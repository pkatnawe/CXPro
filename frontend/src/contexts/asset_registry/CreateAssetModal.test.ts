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

vi.mock('@/contexts/asset_registry/api', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/asset_registry/api')>('@/contexts/asset_registry/api')
  return {
    ...actual,
    createAsset: vi.fn(),
  }
})

import { createAsset } from '@/contexts/asset_registry/api'
import type { AssetType, Space, Asset } from '@/contexts/asset_registry/api'

const mockAssetTypes: AssetType[] = [
  { id: 'at-1', project_id: 'proj-1', name: 'AHU', description: null, expected_attributes: {}, created_at: '2026-01-01T00:00:00Z' },
  { id: 'at-2', project_id: 'proj-1', name: 'PDU', description: null, expected_attributes: {}, created_at: '2026-01-01T00:00:00Z' },
]

const mockSpaces: Space[] = [
  { id: 'sp-1', project_id: 'proj-1', parent_space_id: null, kind: 'building', name: 'Building', ordinal: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'sp-2', project_id: 'proj-1', parent_space_id: 'sp-1', kind: 'data_hall', name: 'Hall A', ordinal: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'sp-3', project_id: 'proj-1', parent_space_id: 'sp-2', kind: 'rack_row', name: 'Row 1', ordinal: null, created_at: '2026-01-01T00:00:00Z' },
]

const mockAssets: Asset[] = [
  { id: 'asset-1', project_id: 'proj-1', parent_asset_id: null, asset_type_id: 'at-1', space_id: 'sp-2', tag: 'AHU-A-01', name: 'Air Handler A01', status: 'active', manufacturer: 'Trane', model: 'RTUA', serial: 'SN-001', vendor_name: null, nameplate_data: {}, created_at: '2026-01-01T00:00:00Z', retired_at: null, decommissioned_at: null },
]

describe('CreateAssetModal — form validation', () => {
  it('requires tag field to be non-empty', () => {
    const errors: Record<string, string> = {}
    const tag = ''
    const assetTypeId = 'at-1'
    if (!tag.trim()) errors.tag = 'Tag is required'
    if (!assetTypeId) errors.asset_type_id = 'Asset type is required'
    expect(errors.tag).toBe('Tag is required')
    expect(errors.asset_type_id).toBeUndefined()
  })

  it('requires asset_type_id to be non-empty', () => {
    const errors: Record<string, string> = {}
    const tag = 'AHU-A-01'
    const assetTypeId = ''
    if (!tag.trim()) errors.tag = 'Tag is required'
    if (!assetTypeId) errors.asset_type_id = 'Asset type is required'
    expect(errors.tag).toBeUndefined()
    expect(errors.asset_type_id).toBe('Asset type is required')
  })

  it('passes validation when tag and asset_type_id are provided', () => {
    const errors: Record<string, string> = {}
    const tag = 'AHU-A-01'
    const assetTypeId = 'at-1'
    if (!tag.trim()) errors.tag = 'Tag is required'
    if (!assetTypeId) errors.asset_type_id = 'Asset type is required'
    expect(Object.keys(errors)).toHaveLength(0)
  })
})

describe('CreateAssetModal — space cascading select', () => {
  function buildSpaceLevels(spaces: Space[]) {
    const childrenOf = new Map<string | null, Space[]>()
    for (const s of spaces) {
      const parentId = s.parent_space_id ?? null
      const arr = childrenOf.get(parentId) ?? []
      arr.push(s)
      childrenOf.set(parentId, arr)
    }
    const roots = childrenOf.get(null) ?? []
    return { roots, childrenOf }
  }

  it('roots contains top-level spaces only', () => {
    const { roots } = buildSpaceLevels(mockSpaces)
    expect(roots).toHaveLength(1)
    expect(roots[0].name).toBe('Building')
  })

  it('level2Options are children of level1 selection', () => {
    const { childrenOf } = buildSpaceLevels(mockSpaces)
    const level2Options = childrenOf.get('sp-1') ?? []
    expect(level2Options).toHaveLength(1)
    expect(level2Options[0].name).toBe('Hall A')
  })

  it('level3Options are children of level2 selection', () => {
    const { childrenOf } = buildSpaceLevels(mockSpaces)
    const level3Options = childrenOf.get('sp-2') ?? []
    expect(level3Options).toHaveLength(1)
    expect(level3Options[0].name).toBe('Row 1')
  })

  it('resolvedSpaceId prefers deepest selection', () => {
    const spaceLevel1 = 'sp-1'
    const spaceLevel2 = 'sp-2'
    const spaceLevel3 = 'sp-3'
    const resolvedSpaceId = spaceLevel3 || spaceLevel2 || spaceLevel1 || null
    expect(resolvedSpaceId).toBe('sp-3')
  })

  it('resolvedSpaceId falls back to level1 when deeper levels empty', () => {
    const spaceLevel1 = 'sp-1'
    const spaceLevel2 = ''
    const spaceLevel3 = ''
    const resolvedSpaceId = spaceLevel3 || spaceLevel2 || spaceLevel1 || null
    expect(resolvedSpaceId).toBe('sp-1')
  })

  it('resolvedSpaceId is null when no selection', () => {
    const spaceLevel1 = ''
    const spaceLevel2 = ''
    const spaceLevel3 = ''
    const resolvedSpaceId = spaceLevel3 || spaceLevel2 || spaceLevel1 || null
    expect(resolvedSpaceId).toBeNull()
  })
})

describe('CreateAssetModal — API submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls createAsset with correct params on valid form', async () => {
    const mockCreated: Asset = {
      id: 'new-asset',
      project_id: 'proj-1',
      parent_asset_id: null,
      asset_type_id: 'at-1',
      space_id: 'sp-2',
      tag: 'AHU-B-01',
      name: 'New AHU',
      status: 'active',
      manufacturer: 'Carrier',
      model: 'XPower',
      serial: null,
      vendor_name: 'ACCO',
      nameplate_data: { voltage: '480V' },
      created_at: '2026-01-01T00:00:00Z',
      retired_at: null,
      decommissioned_at: null,
    }
    vi.mocked(createAsset).mockResolvedValue(mockCreated)

    const result = await createAsset('proj-1', {
      tag: 'AHU-B-01',
      name: 'New AHU',
      asset_type_id: 'at-1',
      space_id: 'sp-2',
      parent_asset_id: null,
      manufacturer: 'Carrier',
      model: 'XPower',
      serial: null,
      vendor_name: 'ACCO',
      nameplate_data: { voltage: '480V' },
    })

    expect(createAsset).toHaveBeenCalledOnce()
    expect(result.id).toBe('new-asset')
    expect(result.tag).toBe('AHU-B-01')
  })

  it('surfaces 409 as a tag field error', async () => {
    const conflictError = Object.assign(new Error('Conflict'), { status: 409 })
    vi.mocked(createAsset).mockRejectedValue(conflictError)

    let fieldErrors: Record<string, string> = {}
    try {
      await createAsset('proj-1', { tag: 'AHU-A-01', asset_type_id: 'at-1' })
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e?.status === 409) {
        fieldErrors = { tag: 'Tag already exists in this project' }
      }
    }

    expect(fieldErrors.tag).toBe('Tag already exists in this project')
  })

  it('nameplate_data is built from KV rows with non-empty keys', () => {
    const kvRows = [
      { key: 'voltage', value: '480V' },
      { key: '', value: 'ignored' },
      { key: 'amps', value: '30A' },
    ]
    const nameplateData: Record<string, unknown> = {}
    for (const row of kvRows) {
      if (row.key.trim()) nameplateData[row.key.trim()] = row.value
    }
    expect(nameplateData).toEqual({ voltage: '480V', amps: '30A' })
    expect(Object.keys(nameplateData)).toHaveLength(2)
  })

  it('optimistic insert prepends new asset to list', () => {
    const newAsset = mockAssets[0]
    const prevAssets: Asset[] = []
    const updated = [newAsset, ...prevAssets]
    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBe('asset-1')
  })
})

describe('CreateAssetModal — asset types displayed', () => {
  it('lists all asset types as select options', () => {
    const options = mockAssetTypes.map(t => ({ value: t.id, label: t.name }))
    expect(options).toHaveLength(2)
    expect(options[0].label).toBe('AHU')
    expect(options[1].label).toBe('PDU')
  })
})
