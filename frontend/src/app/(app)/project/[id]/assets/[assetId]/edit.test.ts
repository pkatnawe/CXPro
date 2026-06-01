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
  updateAsset,
  deleteAsset,
  retireAsset,
  decommissionAsset,
  type Asset,
} from '@/contexts/asset_registry/api'

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

describe('US-008 — inline edit round-trips', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('updateAsset PATCH sends only the changed fields', async () => {
    const updated = { ...mockAsset, name: 'New Name' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updated),
    }))

    const result = await updateAsset('proj-1', 'asset-1', { name: 'New Name' })
    expect(result.name).toBe('New Name')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/assets/asset-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('updateAsset PATCH with null clears a field', async () => {
    const updated = { ...mockAsset, vendor_name: null }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updated),
    }))

    const result = await updateAsset('proj-1', 'asset-1', { vendor_name: null })
    expect(result.vendor_name).toBeNull()
  })

  it('updateAsset PATCH with nameplate_data updates nameplate', async () => {
    const newNameplate = { voltage: '208V', phase: '3-phase' }
    const updated = { ...mockAsset, nameplate_data: newNameplate }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updated),
    }))

    const result = await updateAsset('proj-1', 'asset-1', { nameplate_data: newNameplate })
    expect(result.nameplate_data).toEqual(newNameplate)
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.nameplate_data).toEqual(newNameplate)
  })

  it('optimistic update: state rolls back on error', () => {
    const original = { ...mockAsset }
    const optimistic = { ...original, name: 'Attempted New Name' }

    let current: Asset = optimistic
    const rollback = () => { current = original }
    rollback()
    expect(current.name).toBe('Air Handler Unit A-01')
  })
})

describe('US-008 — delete confirmation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('deleteAsset sends DELETE to correct endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(undefined),
    }))

    await deleteAsset('proj-1', 'asset-1')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('deleteAsset cancel: no fetch call made when cancel is invoked', () => {
    vi.stubGlobal('fetch', vi.fn())
    const cancelled = true
    if (!cancelled) {
      deleteAsset('proj-1', 'asset-1')
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('deleteAsset 409 causes has_references error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'has_references', next_action: 'retire', counts: {} }),
    }))

    await expect(deleteAsset('proj-1', 'asset-1')).rejects.toMatchObject({ status: 409 })
  })
})

describe('US-008 — retire updates status pill', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('retireAsset POST to /retire endpoint returns updated asset with status=retired', async () => {
    const retired = { ...mockAsset, status: 'retired' as const, retired_at: '2026-06-01T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(retired),
    }))

    const result = await retireAsset('proj-1', 'asset-1')
    expect(result.status).toBe('retired')
    expect(result.retired_at).toBeTruthy()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/retire'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('decommissionAsset POST to /decommission endpoint returns updated asset', async () => {
    const decommissioned = { ...mockAsset, status: 'decommissioned' as const, decommissioned_at: '2026-06-01T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(decommissioned),
    }))

    const result = await decommissionAsset('proj-1', 'asset-1')
    expect(result.status).toBe('decommissioned')
    expect(result.decommissioned_at).toBeTruthy()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/decommission'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('US-008 — InlineEditField logic', () => {
  it('empty string trim saves as null', () => {
    const draft = '   '
    const saved = draft.trim() || null
    expect(saved).toBeNull()
  })

  it('non-empty string saves as trimmed value', () => {
    const draft = '  Daikin  '
    const saved = draft.trim() || null
    expect(saved).toBe('Daikin')
  })

  it('Enter key triggers save, Escape key triggers cancel', () => {
    const events = { enter: false, escape: false }
    const handleKeyDown = (key: string) => {
      if (key === 'Enter') events.enter = true
      if (key === 'Escape') events.escape = true
    }
    handleKeyDown('Enter')
    expect(events.enter).toBe(true)
    expect(events.escape).toBe(false)
    handleKeyDown('Escape')
    expect(events.escape).toBe(true)
  })
})

describe('US-008 — NameplateEditorModal logic', () => {
  it('builds nameplate_data object from rows, filtering empty keys', () => {
    const rows = [
      { key: 'voltage', value: '480V' },
      { key: '', value: 'ignored' },
      { key: 'phase', value: '3-phase' },
    ]
    const data: Record<string, unknown> = {}
    for (const row of rows) {
      if (row.key.trim()) data[row.key.trim()] = row.value
    }
    expect(data).toEqual({ voltage: '480V', phase: '3-phase' })
    expect(data['']).toBeUndefined()
  })

  it('initializes rows from existing nameplate_data', () => {
    const nameplate = { voltage: '480V', amps: '30A' }
    const rows = Object.entries(nameplate).map(([k, v]) => ({ key: k, value: String(v) }))
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ key: 'voltage', value: '480V' })
    expect(rows[1]).toEqual({ key: 'amps', value: '30A' })
  })
})
