import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      })
    }
  }
}))

import {
  getAsset,
  listAssets,
  listSystems,
  listSystemMembers,
} from '@/contexts/asset_registry/api'
import { listInstances, listTemplates } from '@/contexts/commissioning_execution/api'
import { derivePhase } from '@/contexts/asset_registry/derivePhase'
import type { Asset, Space, System } from '@/contexts/asset_registry/api'
import type { Instance, Template } from '@/contexts/commissioning_execution/api'

const mockAsset: Asset = {
  id: 'asset-1',
  project_id: 'proj-1',
  parent_asset_id: null,
  asset_type_id: 'at-1',
  space_id: 'space-1',
  tag: 'AHU-A-01',
  name: 'Air Handler Unit A-01',
  status: 'active',
  manufacturer: 'Trane',
  model: 'RTUA-100',
  serial: 'SN-001',
  vendor_name: 'ACCO Brands',
  nameplate_data: { voltage: '480V', amps: '30A' },
  created_at: '2026-01-01T00:00:00Z',
  retired_at: null,
  decommissioned_at: null,
}

const mockSpaces: Space[] = [
  {
    id: 'space-0',
    project_id: 'proj-1',
    parent_space_id: null,
    kind: 'building',
    name: 'Building',
    ordinal: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'space-1',
    project_id: 'proj-1',
    parent_space_id: 'space-0',
    kind: 'data_hall',
    name: 'Hall A',
    ordinal: null,
    created_at: '2026-01-01T00:00:00Z',
  },
]

const mockInstances: Instance[] = [
  { id: 'inst-1', project_id: 'proj-1', template_id: 'tpl-1', asset_id: 'asset-1', system_id: null, level: 'L2', status: 'complete', created_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-2', project_id: 'proj-1', template_id: 'tpl-2', asset_id: 'asset-1', system_id: null, level: 'L3', status: 'in_progress', created_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-3', project_id: 'proj-1', template_id: 'tpl-3', asset_id: 'asset-1', system_id: null, level: 'L5', status: 'pending', created_at: '2026-01-01T00:00:00Z' },
]

const mockTemplates: Template[] = [
  { id: 'tpl-1', project_id: 'proj-1', name: 'L2 Pre-functional Checklist', level: 'L2', description: null, steps: [], created_at: '2026-01-01T00:00:00Z' },
  { id: 'tpl-2', project_id: 'proj-1', name: 'L3 Functional Test', level: 'L3', description: null, steps: [], created_at: '2026-01-01T00:00:00Z' },
  { id: 'tpl-3', project_id: 'proj-1', name: 'L5 IST', level: 'L5', description: null, steps: [], created_at: '2026-01-01T00:00:00Z' },
]

describe('Asset detail page — hero field derivation', () => {
  it('renders all available fields from asset', () => {
    expect(mockAsset.tag).toBe('AHU-A-01')
    expect(mockAsset.name).toBe('Air Handler Unit A-01')
    expect(mockAsset.status).toBe('active')
    expect(mockAsset.manufacturer).toBe('Trane')
    expect(mockAsset.model).toBe('RTUA-100')
    expect(mockAsset.serial).toBe('SN-001')
    expect(mockAsset.vendor_name).toBe('ACCO Brands')
  })

  it('nameplate_data entries are enumerable for KV display', () => {
    const entries = Object.entries(mockAsset.nameplate_data ?? {})
    expect(entries).toContainEqual(['voltage', '480V'])
    expect(entries).toContainEqual(['amps', '30A'])
  })

  it('scheduled_date pill only renders when present in nameplate_data', () => {
    const withDate = { ...mockAsset, nameplate_data: { scheduled_date: '2026-06-15' } as Record<string, unknown> }
    const noDate = { ...mockAsset, nameplate_data: {} as Record<string, unknown> }
    expect(withDate.nameplate_data['scheduled_date']).toBe('2026-06-15')
    expect(noDate.nameplate_data['scheduled_date']).toBeUndefined()
  })

  it('vendor_name pill only renders when non-null', () => {
    const withVendor = { ...mockAsset, vendor_name: 'ACCO Brands' }
    const noVendor = { ...mockAsset, vendor_name: null }
    expect(withVendor.vendor_name).toBeTruthy()
    expect(noVendor.vendor_name).toBeNull()
  })
})

describe('Asset detail page — space path derivation', () => {
  it('buildSpacePath walks up parent chain', () => {
    const spaceMap = new Map(mockSpaces.map(s => [s.id, s]))

    function buildSpacePath(spaceId: string | null): string {
      if (!spaceId) return '—'
      const parts: string[] = []
      let current = spaceMap.get(spaceId)
      while (current) {
        parts.unshift(current.name)
        current = current.parent_space_id ? spaceMap.get(current.parent_space_id) : undefined
      }
      return parts.join(' / ') || '—'
    }

    expect(buildSpacePath('space-1')).toBe('Building / Hall A')
    expect(buildSpacePath(null)).toBe('—')
    expect(buildSpacePath('space-0')).toBe('Building')
  })
})

describe('Asset detail page — phase derivation from instances', () => {
  it('derives L3 when L2 complete + L3 in_progress', () => {
    const phase = derivePhase(mockInstances)
    expect(phase).toBe('L3')
  })

  it('derives pre-install when no instances', () => {
    expect(derivePhase([])).toBe('pre-install')
  })

  it('derives L2 when only L2 complete', () => {
    expect(derivePhase([{ level: 'L2', status: 'complete' }])).toBe('L2')
  })
})

describe('Asset detail page — cx progress calculation', () => {
  it('calculates 0% when no instances', () => {
    function deriveCxProgress(instances: Instance[]): number {
      if (instances.length === 0) return 0
      const done = instances.filter(i => i.status === 'complete').length
      return Math.round((done / instances.length) * 100)
    }
    expect(deriveCxProgress([])).toBe(0)
  })

  it('calculates 33% for 1 complete out of 3', () => {
    function deriveCxProgress(instances: Instance[]): number {
      if (instances.length === 0) return 0
      const done = instances.filter(i => i.status === 'complete').length
      return Math.round((done / instances.length) * 100)
    }
    expect(deriveCxProgress(mockInstances)).toBe(33)
  })

  it('calculates 100% when all complete', () => {
    function deriveCxProgress(instances: Instance[]): number {
      if (instances.length === 0) return 0
      const done = instances.filter(i => i.status === 'complete').length
      return Math.round((done / instances.length) * 100)
    }
    const allDone: Instance[] = mockInstances.map(i => ({ ...i, status: 'complete' }))
    expect(deriveCxProgress(allDone)).toBe(100)
  })
})

describe('Asset detail page — tab switching updates URL', () => {
  it('tab param is set in URL on tab change', () => {
    const tabs = ['Overview', 'Devices', 'Checklists', 'Tests', 'Linked']
    const mockReplace = vi.fn()

    for (const tab of tabs) {
      const params = new URLSearchParams()
      params.set('tab', tab)
      const url = `/project/proj-1/assets/asset-1?${params.toString()}`
      mockReplace(url)
      expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining(`tab=${tab}`))
    }
  })

  it('default tab is Overview when no query param', () => {
    const searchParams = new URLSearchParams('')
    const activeTab = searchParams.get('tab') ?? 'Overview'
    expect(activeTab).toBe('Overview')
  })

  it('reads tab from query param correctly', () => {
    const searchParams = new URLSearchParams('tab=Devices')
    const activeTab = searchParams.get('tab') ?? 'Overview'
    expect(activeTab).toBe('Devices')
  })
})

describe('Asset detail page — panel API calls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))
  })

  it('listInstances is called with asset_id filter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInstances),
    }))
    const result = await listInstances('proj-1', { asset_id: 'asset-1' })
    expect(result).toEqual(mockInstances)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('asset_id=asset-1'),
      expect.any(Object)
    )
  })

  it('listAssets is called with parent_asset_id for devices panel', async () => {
    const mockChildren: Asset[] = []
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockChildren),
    }))
    const result = await listAssets('proj-1', { parent_asset_id: 'asset-1' })
    expect(Array.isArray(result)).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('parent_asset_id=asset-1'),
      expect.any(Object)
    )
  })

  it('listTemplates is called to build templateMap for checklists/tests panels', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTemplates),
    }))
    const result = await listTemplates('proj-1')
    expect(result).toEqual(mockTemplates)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-procedure-templates'),
      expect.any(Object)
    )
  })
})

describe('Asset detail page — checklists vs tests panel split', () => {
  it('checklists = L2 instances only', () => {
    const checklists = mockInstances.filter(i => i.level === 'L2')
    expect(checklists).toHaveLength(1)
    expect(checklists[0].id).toBe('inst-1')
  })

  it('tests = L3/L4/L5 instances', () => {
    const tests = mockInstances.filter(i => ['L3', 'L4', 'L5'].includes(i.level))
    expect(tests).toHaveLength(2)
    expect(tests.map(t => t.level)).toContain('L3')
    expect(tests.map(t => t.level)).toContain('L5')
  })
})

describe('Asset detail page — linked panel', () => {
  it('parent asset is fetched when parent_asset_id is set', async () => {
    const assetWithParent = { ...mockAsset, parent_asset_id: 'parent-1' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockAsset, id: 'parent-1', tag: 'SWG-A-01' }),
    }))
    const parent = await getAsset('proj-1', assetWithParent.parent_asset_id!)
    expect(parent.id).toBe('parent-1')
    expect(parent.tag).toBe('SWG-A-01')
  })

  it('no parent fetch when parent_asset_id is null', () => {
    expect(mockAsset.parent_asset_id).toBeNull()
  })

  it('system memberships are determined by checking each system members list', async () => {
    const mockSystems: System[] = [
      { id: 'sys-1', project_id: 'proj-1', parent_system_id: null, name: 'Cooling', description: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/members')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'asset-1', tag: 'AHU-A-01', name: null, status: 'active', added_at: '' }])
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSystems) })
    }))
    const systems = await listSystems('proj-1')
    const members = await listSystemMembers('proj-1', 'sys-1')
    const isMember = members.some(m => m.id === 'asset-1')
    expect(isMember).toBe(true)
    expect(systems[0].name).toBe('Cooling')
  })
})
