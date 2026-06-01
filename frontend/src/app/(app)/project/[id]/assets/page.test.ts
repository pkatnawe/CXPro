import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token', user: { id: 'user-1' } } }
      })
    }
  }
}))

import {
  listAssets,
  listAssetTypes,
  listSpaces,
} from '@/contexts/asset_registry/api'
import { listInstances } from '@/contexts/commissioning_execution/api'
import type { Asset, AssetType, Space } from '@/contexts/asset_registry/api'

vi.mock('@/contexts/asset_registry/api', () => ({
  listAssets: vi.fn(),
  listAssetTypes: vi.fn(),
  listSpaces: vi.fn(),
}))

vi.mock('@/contexts/commissioning_execution/api', () => ({
  listInstances: vi.fn(),
}))

const mockAsset: Asset = {
  id: 'asset-1',
  project_id: 'proj-1',
  parent_asset_id: null,
  asset_type_id: 'at-1',
  space_id: null,
  tag: 'AHU-001',
  name: 'Air Handler Unit 001',
  status: 'active',
  manufacturer: 'Trane',
  model: 'RTU-100',
  serial: 'SN-001',
  vendor_name: 'ACCO Brands',
  nameplate_data: {},
  created_at: '2026-01-01T00:00:00Z',
  retired_at: null,
  decommissioned_at: null,
}

const mockAssetType: AssetType = {
  id: 'at-1',
  project_id: 'proj-1',
  name: 'AHU · Air Handler',
  created_at: '2026-01-01T00:00:00Z',
}

const mockSpace: Space = {
  id: 'space-1',
  project_id: 'proj-1',
  parent_space_id: null,
  kind: 'floor',
  name: 'Level 1',
  ordinal: 1,
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.mocked(listAssets).mockResolvedValue([mockAsset])
  vi.mocked(listAssetTypes).mockResolvedValue([mockAssetType])
  vi.mocked(listSpaces).mockResolvedValue([mockSpace])
  vi.mocked(listInstances).mockResolvedValue([])
})

describe('AssetsPage data logic', () => {
  it('buildSpacePath returns dash for null space', () => {
    const spaceMap = new Map<string, Space>()
    expect(buildSpacePath(null, spaceMap)).toBe('—')
  })

  it('buildSpacePath returns space name for known space', () => {
    const spaceMap = new Map([['space-1', mockSpace]])
    expect(buildSpacePath('space-1', spaceMap)).toBe('Level 1')
  })

  it('buildSpacePath returns dash for unknown space id', () => {
    const spaceMap = new Map<string, Space>()
    expect(buildSpacePath('unknown', spaceMap)).toBe('—')
  })

  it('listAssets is called with projectId', async () => {
    await listAssets('proj-1')
    expect(listAssets).toHaveBeenCalledWith('proj-1')
  })

  it('listAssetTypes is called with projectId', async () => {
    await listAssetTypes('proj-1')
    expect(listAssetTypes).toHaveBeenCalledWith('proj-1')
  })
})

function buildSpacePath(spaceId: string | null, spaceMap: Map<string, Space>): string {
  if (!spaceId) return '—'
  const parts: string[] = []
  let current = spaceMap.get(spaceId)
  while (current) {
    parts.unshift(current.name)
    current = current.parent_space_id ? spaceMap.get(current.parent_space_id) : undefined
  }
  return parts.join(' / ') || '—'
}
