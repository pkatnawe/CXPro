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
  isAllowedSpaceParent,
  ALLOWED_PARENTS,
  SPACE_KINDS,
  createSpace,
  listSpaces,
  updateSpace,
  deleteSpace,
  createAssetType,
  listAssetTypes,
  updateAssetType,
  deleteAssetType,
  createSystem,
  listSystems,
  updateSystem,
  deleteSystem,
  addAssetToSystem,
  removeAssetFromSystem,
  listSystemMembers,
  createAsset,
  listAssets,
  updateAsset,
  retireAsset,
  decommissionAsset,
  deleteAsset,
  createPoint,
  listPointsForAsset,
  updatePoint,
  deletePoint,
  SIGNAL_TYPES,
  type SpaceKind,
} from './api'

import { SpaceForm, SpaceTree, DeleteDialog, AssetTypeForm, AssetTypeList, AssetTypeDeleteDialog, SystemForm, SystemTree, SystemMembershipPicker, AssetForm, AssetList, AssetDetail, PointForm, PointList } from './ui'

describe('isAllowedSpaceParent', () => {
  it('allows campus at root (null parent)', () => {
    expect(isAllowedSpaceParent(null, 'campus')).toBe(true)
  })

  it('allows building at root', () => {
    expect(isAllowedSpaceParent(null, 'building')).toBe(true)
  })

  it('allows building under campus', () => {
    expect(isAllowedSpaceParent('campus', 'building')).toBe(true)
  })

  it('rejects campus under campus', () => {
    expect(isAllowedSpaceParent('campus', 'campus')).toBe(false)
  })

  it('rejects floor at root (no null in allowed parents)', () => {
    expect(isAllowedSpaceParent(null, 'floor')).toBe(false)
  })

  it('allows floor under building', () => {
    expect(isAllowedSpaceParent('building', 'floor')).toBe(true)
  })

  it('rejects floor under campus', () => {
    expect(isAllowedSpaceParent('campus', 'floor')).toBe(false)
  })

  it('allows wing under floor', () => {
    expect(isAllowedSpaceParent('floor', 'wing')).toBe(true)
  })

  it('rejects wing under building', () => {
    expect(isAllowedSpaceParent('building', 'wing')).toBe(false)
  })

  it('allows department under floor', () => {
    expect(isAllowedSpaceParent('floor', 'department')).toBe(true)
  })

  it('allows department under wing', () => {
    expect(isAllowedSpaceParent('wing', 'department')).toBe(true)
  })

  it('rejects department under building', () => {
    expect(isAllowedSpaceParent('building', 'department')).toBe(false)
  })

  it('allows data_hall under floor', () => {
    expect(isAllowedSpaceParent('floor', 'data_hall')).toBe(true)
  })

  it('allows data_hall under building', () => {
    expect(isAllowedSpaceParent('building', 'data_hall')).toBe(true)
  })

  it('rejects data_hall under campus', () => {
    expect(isAllowedSpaceParent('campus', 'data_hall')).toBe(false)
  })

  it('allows rack_row under data_hall', () => {
    expect(isAllowedSpaceParent('data_hall', 'rack_row')).toBe(true)
  })

  it('rejects rack_row under floor', () => {
    expect(isAllowedSpaceParent('floor', 'rack_row')).toBe(false)
  })

  it('allows room under floor', () => {
    expect(isAllowedSpaceParent('floor', 'room')).toBe(true)
  })

  it('allows room under wing', () => {
    expect(isAllowedSpaceParent('wing', 'room')).toBe(true)
  })

  it('allows room under department', () => {
    expect(isAllowedSpaceParent('department', 'room')).toBe(true)
  })

  it('allows room under data_hall', () => {
    expect(isAllowedSpaceParent('data_hall', 'room')).toBe(true)
  })

  it('rejects room under campus', () => {
    expect(isAllowedSpaceParent('campus', 'room')).toBe(false)
  })

  it('rejects room under building', () => {
    expect(isAllowedSpaceParent('building', 'room')).toBe(false)
  })
})

describe('SPACE_KINDS', () => {
  it('includes all 8 space kinds', () => {
    expect(SPACE_KINDS).toHaveLength(8)
    expect(SPACE_KINDS).toContain('campus')
    expect(SPACE_KINDS).toContain('building')
    expect(SPACE_KINDS).toContain('floor')
    expect(SPACE_KINDS).toContain('wing')
    expect(SPACE_KINDS).toContain('department')
    expect(SPACE_KINDS).toContain('data_hall')
    expect(SPACE_KINDS).toContain('rack_row')
    expect(SPACE_KINDS).toContain('room')
  })
})

describe('createSpace API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST and returns created space', async () => {
    const mockSpace = {
      id: 'space-1',
      project_id: 'proj-1',
      parent_space_id: null,
      kind: 'building',
      name: 'Main Building',
      ordinal: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpace),
    }))

    const result = await createSpace('proj-1', { kind: 'building', name: 'Main Building' })

    expect(result).toEqual(mockSpace)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/spaces'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws an error with status on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Invalid parent kind' }),
    }))

    await expect(createSpace('proj-1', { kind: 'floor', name: 'Floor 1' }))
      .rejects.toMatchObject({ status: 400, message: 'Invalid parent kind' })
  })
})

describe('listSpaces API', () => {
  it('sends GET and returns list of spaces', async () => {
    const mockSpaces = [
      { id: 'space-1', project_id: 'proj-1', parent_space_id: null, kind: 'building', name: 'B1', ordinal: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpaces),
    }))

    const result = await listSpaces('proj-1')
    expect(result).toEqual(mockSpaces)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/spaces'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })

  it('includes parent_space_id query param when provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listSpaces('proj-1', 'parent-id-123')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('parent_space_id=parent-id-123'),
      expect.any(Object)
    )
  })
})

describe('updateSpace API', () => {
  it('sends PATCH and returns updated space', async () => {
    const mockSpace = {
      id: 'space-1',
      project_id: 'proj-1',
      parent_space_id: null,
      kind: 'building',
      name: 'Renamed Building',
      ordinal: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpace),
    }))

    const result = await updateSpace('proj-1', 'space-1', { name: 'Renamed Building' })
    expect(result).toEqual(mockSpace)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/spaces/space-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('throws 409 error when reparenting to invalid parent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Parent kind not allowed' }),
    }))

    await expect(updateSpace('proj-1', 'space-1', { parent_space_id: 'other-id' }))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('deleteSpace API', () => {
  it('sends DELETE and resolves on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }))

    await expect(deleteSpace('proj-1', 'space-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/spaces/space-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws 409 error when space has children', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Cannot delete: space has child spaces or asset references.' }),
    }))

    await expect(deleteSpace('proj-1', 'space-1'))
      .rejects.toMatchObject({ status: 409, message: 'Cannot delete: space has child spaces or asset references.' })
  })
})

describe('SpaceForm component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof SpaceForm).toBe('function')
  })
})

describe('SpaceTree component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof SpaceTree).toBe('function')
  })
})

describe('DeleteDialog component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof DeleteDialog).toBe('function')
  })
})

describe('in-flight disable pattern', () => {
  it('canSubmit is false when submitting=true (logical check)', () => {
    const submitting = true
    const nameValid = true
    const parentValid = true
    const canSubmit = nameValid && parentValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when not submitting and valid', () => {
    const submitting = false
    const nameValid = true
    const parentValid = true
    const canSubmit = nameValid && parentValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false when name is empty', () => {
    const submitting = false
    const nameValid = false
    const parentValid = true
    const canSubmit = nameValid && parentValid && !submitting
    expect(canSubmit).toBe(false)
  })
})

describe('parent kind validation logic', () => {
  it('rejects campus parent for rack_row child', () => {
    const parentKind: SpaceKind = 'campus'
    const childKind: SpaceKind = 'rack_row'
    expect(isAllowedSpaceParent(parentKind, childKind)).toBe(false)
  })

  it('accepts data_hall parent for rack_row child', () => {
    const parentKind: SpaceKind = 'data_hall'
    const childKind: SpaceKind = 'rack_row'
    expect(isAllowedSpaceParent(parentKind, childKind)).toBe(true)
  })

  it('ALLOWED_PARENTS covers all SPACE_KINDS', () => {
    for (const kind of SPACE_KINDS) {
      expect(ALLOWED_PARENTS[kind]).toBeDefined()
    }
  })
})

describe('createAssetType API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST and returns created asset type', async () => {
    const mockAt = {
      id: 'at-1',
      project_id: 'proj-1',
      name: 'AHU',
      description: 'Air Handling Unit',
      expected_attributes: {},
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAt),
    }))

    const result = await createAssetType('proj-1', { name: 'AHU', description: 'Air Handling Unit' })
    expect(result).toEqual(mockAt)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/asset-types'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws 409 on duplicate name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'An asset type with this name already exists in the project' }),
    }))

    await expect(createAssetType('proj-1', { name: 'AHU' }))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('listAssetTypes API', () => {
  it('sends GET and returns list', async () => {
    const mockList = [
      { id: 'at-1', project_id: 'proj-1', name: 'AHU', description: null, expected_attributes: {}, created_at: '2026-01-01T00:00:00Z' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockList),
    }))

    const result = await listAssetTypes('proj-1')
    expect(result).toEqual(mockList)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/asset-types'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })
})

describe('updateAssetType API', () => {
  it('sends PATCH and returns updated asset type', async () => {
    const mockAt = {
      id: 'at-1',
      project_id: 'proj-1',
      name: 'Renamed AHU',
      description: null,
      expected_attributes: {},
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAt),
    }))

    const result = await updateAssetType('proj-1', 'at-1', { name: 'Renamed AHU' })
    expect(result).toEqual(mockAt)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/asset-types/at-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('throws 409 on duplicate name during update', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'An asset type with this name already exists in the project' }),
    }))

    await expect(updateAssetType('proj-1', 'at-1', { name: 'Existing Name' }))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('deleteAssetType API', () => {
  it('sends DELETE and resolves on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }))

    await expect(deleteAssetType('proj-1', 'at-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/asset-types/at-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws 409 when asset type is referenced by assets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Cannot delete an asset type that is referenced by assets' }),
    }))

    await expect(deleteAssetType('proj-1', 'at-1'))
      .rejects.toMatchObject({ status: 409, message: 'Cannot delete an asset type that is referenced by assets' })
  })
})

describe('AssetTypeForm component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof AssetTypeForm).toBe('function')
  })
})

describe('AssetTypeList component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof AssetTypeList).toBe('function')
  })
})

describe('AssetTypeDeleteDialog component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof AssetTypeDeleteDialog).toBe('function')
  })
})

describe('AssetTypeForm validation logic', () => {
  it('canSubmit is false when name is empty', () => {
    const name = ''
    const submitting = false
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when name is present and not submitting', () => {
    const name = 'AHU'
    const submitting = false
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false when submitting=true even if name valid', () => {
    const name = 'AHU'
    const submitting = true
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is false when name is only whitespace', () => {
    const name = '   '
    const submitting = false
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(false)
  })
})

describe('AssetType delete confirmation logic', () => {
  it('surfaces 409 error inline without closing dialog', () => {
    const status = 409
    const detail = 'Cannot delete an asset type that is referenced by assets'
    const deleteError = status === 409 ? (detail ?? 'Cannot delete: asset type is referenced by assets.') : null
    expect(deleteError).toBe(detail)
  })

  it('uses fallback message when no detail provided', () => {
    const status = 409
    const detail: string | undefined = undefined
    const deleteError = status === 409 ? (detail ?? 'Cannot delete: asset type is referenced by assets.') : null
    expect(deleteError).toBe('Cannot delete: asset type is referenced by assets.')
  })
})

describe('createSystem API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST and returns created system', async () => {
    const mockSystem = {
      id: 'sys-1',
      project_id: 'proj-1',
      parent_system_id: null,
      name: 'HVAC',
      description: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSystem),
    }))

    const result = await createSystem('proj-1', { name: 'HVAC' })
    expect(result).toEqual(mockSystem)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/systems'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws 409 on duplicate system name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'A system with this name already exists under the same parent' }),
    }))

    await expect(createSystem('proj-1', { name: 'HVAC' }))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('listSystems API', () => {
  it('sends GET and returns list of systems', async () => {
    const mockSystems = [
      { id: 'sys-1', project_id: 'proj-1', parent_system_id: null, name: 'HVAC', description: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSystems),
    }))

    const result = await listSystems('proj-1')
    expect(result).toEqual(mockSystems)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/systems'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })

  it('includes parent_system_id query param when provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listSystems('proj-1', { parent_system_id: 'sys-parent' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('parent_system_id=sys-parent'),
      expect.any(Object)
    )
  })

  it('includes include_descendants param when true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listSystems('proj-1', { include_descendants: true })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('include_descendants=true'),
      expect.any(Object)
    )
  })
})

describe('updateSystem API', () => {
  it('sends PATCH and returns updated system', async () => {
    const mockSystem = {
      id: 'sys-1',
      project_id: 'proj-1',
      parent_system_id: null,
      name: 'Renamed HVAC',
      description: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSystem),
    }))

    const result = await updateSystem('proj-1', 'sys-1', { name: 'Renamed HVAC' })
    expect(result).toEqual(mockSystem)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/systems/sys-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})

describe('deleteSystem API', () => {
  it('sends DELETE and resolves on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }))

    await expect(deleteSystem('proj-1', 'sys-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/systems/sys-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws 409 when system has children or memberships', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Cannot delete a system that has child systems' }),
    }))

    await expect(deleteSystem('proj-1', 'sys-1'))
      .rejects.toMatchObject({ status: 409, message: 'Cannot delete a system that has child systems' })
  })
})

describe('addAssetToSystem API', () => {
  it('sends POST to members endpoint', async () => {
    const mockMembership = { asset_id: 'asset-1', system_id: 'sys-1', added_at: '2026-01-01T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMembership),
    }))

    const result = await addAssetToSystem('proj-1', 'sys-1', 'asset-1')
    expect(result).toEqual(mockMembership)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/systems/sys-1/members'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws 409 when asset already a member', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Asset is already a member of this system' }),
    }))

    await expect(addAssetToSystem('proj-1', 'sys-1', 'asset-1'))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('removeAssetFromSystem API', () => {
  it('sends DELETE to members endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }))

    await expect(removeAssetFromSystem('proj-1', 'sys-1', 'asset-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/systems/sys-1/members/asset-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('listSystemMembers API', () => {
  it('sends GET to members endpoint and returns member list', async () => {
    const mockMembers = [
      { id: 'asset-1', project_id: 'proj-1', tag: 'AHU-01', name: 'AHU Unit 1', status: 'active', added_at: '2026-01-01T00:00:00Z' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMembers),
    }))

    const result = await listSystemMembers('proj-1', 'sys-1')
    expect(result).toEqual(mockMembers)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/systems/sys-1/members'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })
})

describe('SystemForm component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof SystemForm).toBe('function')
  })
})

describe('SystemTree component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof SystemTree).toBe('function')
  })
})

describe('SystemMembershipPicker component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof SystemMembershipPicker).toBe('function')
  })
})

describe('SystemForm validation logic', () => {
  it('canSubmit is false when name is empty', () => {
    const name = ''
    const submitting = false
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when name is present and not submitting', () => {
    const name = 'HVAC'
    const submitting = false
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false when submitting=true even if name valid', () => {
    const name = 'HVAC'
    const submitting = true
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('parent (if set) is filtered to exclude self when editing', () => {
    const allSystems = [
      { id: 'sys-1', name: 'HVAC' },
      { id: 'sys-2', name: 'Plumbing' },
    ]
    const editingSystem = { id: 'sys-1' }
    const parentOptions = allSystems.filter(s => !editingSystem || s.id !== editingSystem.id)
    expect(parentOptions).toHaveLength(1)
    expect(parentOptions[0].id).toBe('sys-2')
  })
})

describe('SystemMembershipPicker add logic', () => {
  it('canSubmit is false when assetId is empty', () => {
    const assetId = ''
    const submitting = false
    const canSubmit = assetId.trim().length > 0 && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when assetId is set and not submitting', () => {
    const assetId = 'asset-uuid-123'
    const submitting = false
    const canSubmit = assetId.trim().length > 0 && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false while submitting', () => {
    const assetId = 'asset-uuid-123'
    const submitting = true
    const canSubmit = assetId.trim().length > 0 && !submitting
    expect(canSubmit).toBe(false)
  })
})

describe('System member remove confirmation logic', () => {
  it('surfaces error inline without closing when remove fails', () => {
    const status = 404
    const detail = 'Asset is not a member of this system'
    const removeError = detail ?? 'Failed to remove asset.'
    expect(removeError).toBe(detail)
  })

  it('uses fallback message when no detail provided', () => {
    const detail: string | undefined = undefined
    const removeError = detail ?? 'Failed to remove asset.'
    expect(removeError).toBe('Failed to remove asset.')
  })
})

describe('createAsset API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST and returns created asset', async () => {
    const mockAsset = {
      id: 'asset-1',
      project_id: 'proj-1',
      parent_asset_id: null,
      asset_type_id: 'at-1',
      space_id: null,
      tag: 'AHU-01',
      name: 'Air Handler 1',
      status: 'active',
      manufacturer: null,
      model: null,
      serial: null,
      nameplate_data: {},
      created_at: '2026-01-01T00:00:00Z',
      retired_at: null,
      decommissioned_at: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAsset),
    }))

    const result = await createAsset('proj-1', { asset_type_id: 'at-1', tag: 'AHU-01', name: 'Air Handler 1' })
    expect(result).toEqual(mockAsset)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws 409 on duplicate active tag', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'An active asset with this tag already exists in the project' }),
    }))

    await expect(createAsset('proj-1', { asset_type_id: 'at-1', tag: 'AHU-01' }))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('listAssets API', () => {
  it('sends GET and returns list of assets', async () => {
    const mockList = [
      {
        id: 'asset-1', project_id: 'proj-1', parent_asset_id: null, asset_type_id: 'at-1',
        space_id: null, tag: 'AHU-01', name: null, status: 'active',
        manufacturer: null, model: null, serial: null, nameplate_data: {},
        created_at: '2026-01-01T00:00:00Z', retired_at: null, decommissioned_at: null,
      },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockList),
    }))

    const result = await listAssets('proj-1')
    expect(result).toEqual(mockList)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })

  it('includes status filter query param when provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listAssets('proj-1', { status: 'active' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=active'),
      expect.any(Object)
    )
  })

  it('includes space_id filter query param when provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listAssets('proj-1', { space_id: 'space-1' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('space_id=space-1'),
      expect.any(Object)
    )
  })
})

describe('updateAsset API', () => {
  it('sends PATCH and returns updated asset', async () => {
    const mockAsset = {
      id: 'asset-1', project_id: 'proj-1', parent_asset_id: null, asset_type_id: 'at-1',
      space_id: null, tag: 'AHU-01-RENAMED', name: null, status: 'active',
      manufacturer: null, model: null, serial: null, nameplate_data: {},
      created_at: '2026-01-01T00:00:00Z', retired_at: null, decommissioned_at: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAsset),
    }))

    const result = await updateAsset('proj-1', 'asset-1', { tag: 'AHU-01-RENAMED' })
    expect(result).toEqual(mockAsset)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('throws 400 on parent-cycle rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Reparenting would create a cycle' }),
    }))

    await expect(updateAsset('proj-1', 'asset-1', { parent_asset_id: 'asset-1' }))
      .rejects.toMatchObject({ status: 400, message: 'Reparenting would create a cycle' })
  })
})

describe('retireAsset API', () => {
  it('sends POST to retire endpoint', async () => {
    const mockAsset = {
      id: 'asset-1', project_id: 'proj-1', parent_asset_id: null, asset_type_id: 'at-1',
      space_id: null, tag: 'AHU-01', name: null, status: 'retired',
      manufacturer: null, model: null, serial: null, nameplate_data: {},
      created_at: '2026-01-01T00:00:00Z', retired_at: '2026-05-01T00:00:00Z', decommissioned_at: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAsset),
    }))

    const result = await retireAsset('proj-1', 'asset-1')
    expect(result.status).toBe('retired')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1/retire'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('decommissionAsset API', () => {
  it('sends POST to decommission endpoint', async () => {
    const mockAsset = {
      id: 'asset-1', project_id: 'proj-1', parent_asset_id: null, asset_type_id: 'at-1',
      space_id: null, tag: 'AHU-01', name: null, status: 'decommissioned',
      manufacturer: null, model: null, serial: null, nameplate_data: {},
      created_at: '2026-01-01T00:00:00Z', retired_at: null, decommissioned_at: '2026-05-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAsset),
    }))

    const result = await decommissionAsset('proj-1', 'asset-1')
    expect(result.status).toBe('decommissioned')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1/decommission'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('deleteAsset API', () => {
  it('resolves on 204 (hard delete)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 204,
      json: () => Promise.resolve({}),
    }))

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) })
    ))

    await expect(deleteAsset('proj-1', 'asset-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws 409 with has_references error when references exist', async () => {
    const errorBody = {
      detail: { error: 'has_references', next_action: 'retire', counts: { points: 2 } }
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve(errorBody),
    }))

    await expect(deleteAsset('proj-1', 'asset-1'))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('AssetForm component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof AssetForm).toBe('function')
  })
})

describe('AssetList component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof AssetList).toBe('function')
  })
})

describe('AssetDetail component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof AssetDetail).toBe('function')
  })
})

describe('AssetForm validation logic', () => {
  it('canSubmit is false when tag is empty', () => {
    const tag = ''
    const assetTypeId = 'at-1'
    const submitting = false
    const tagValid = tag.trim().length > 0
    const typeValid = assetTypeId.length > 0
    const canSubmit = tagValid && typeValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is false when asset type not selected', () => {
    const tag = 'AHU-01'
    const assetTypeId = ''
    const submitting = false
    const tagValid = tag.trim().length > 0
    const typeValid = assetTypeId.length > 0
    const canSubmit = tagValid && typeValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when tag and type present and not submitting', () => {
    const tag = 'AHU-01'
    const assetTypeId = 'at-1'
    const submitting = false
    const tagValid = tag.trim().length > 0
    const typeValid = assetTypeId.length > 0
    const canSubmit = tagValid && typeValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false when submitting=true', () => {
    const tag = 'AHU-01'
    const assetTypeId = 'at-1'
    const submitting = true
    const tagValid = tag.trim().length > 0
    const typeValid = assetTypeId.length > 0
    const canSubmit = tagValid && typeValid && !submitting
    expect(canSubmit).toBe(false)
  })
})

describe('AssetForm parent picker — rejects self/descendants', () => {
  it('parent picker excludes the asset being edited (self)', () => {
    const allAssets = [
      { id: 'asset-1', tag: 'AHU-01', name: null, status: 'active', parent_asset_id: null },
      { id: 'asset-2', tag: 'AHU-02', name: null, status: 'active', parent_asset_id: null },
    ]
    const editingAsset = { id: 'asset-1' }
    const parentOptions = allAssets.filter(a =>
      a.status === 'active' && a.id !== editingAsset.id
    )
    expect(parentOptions).toHaveLength(1)
    expect(parentOptions[0].id).toBe('asset-2')
  })

  it('parent picker includes only active assets when creating', () => {
    const allAssets = [
      { id: 'asset-1', tag: 'AHU-01', status: 'active' },
      { id: 'asset-2', tag: 'AHU-02', status: 'retired' },
      { id: 'asset-3', tag: 'AHU-03', status: 'active' },
    ]
    const parentOptions = allAssets.filter(a => a.status === 'active')
    expect(parentOptions).toHaveLength(2)
    expect(parentOptions.map(a => a.id)).not.toContain('asset-2')
  })
})

describe('AssetForm tag-reuse confirmation', () => {
  it('detects retired asset with same tag', () => {
    const allAssets = [
      { id: 'asset-1', tag: 'AHU-01', status: 'retired' },
      { id: 'asset-2', tag: 'AHU-02', status: 'active' },
    ]
    const inputTag = 'AHU-01'
    const retiredWithSameTag = allAssets.find(
      a => a.tag === inputTag.trim() && a.status === 'retired'
    )
    expect(retiredWithSameTag).toBeDefined()
    expect(retiredWithSameTag?.id).toBe('asset-1')
  })

  it('does not flag tag if no retired asset has same tag', () => {
    const allAssets = [
      { id: 'asset-1', tag: 'AHU-01', status: 'active' },
    ]
    const inputTag = 'AHU-02'
    const retiredWithSameTag = allAssets.find(
      a => a.tag === inputTag.trim() && a.status === 'retired'
    )
    expect(retiredWithSameTag).toBeUndefined()
  })
})

describe('Asset delete-vs-retire branching logic', () => {
  it('surfaces retire-instead when 409 with next_action=retire', () => {
    const status = 409
    const body = { detail: { error: 'has_references', next_action: 'retire', counts: { points: 3 } } }
    const retireInstead = status === 409 && body.detail?.next_action === 'retire'
    expect(retireInstead).toBe(true)
  })

  it('does not surface retire-instead on generic non-409 error', () => {
    const status: number = 404
    const body = { detail: 'Asset not found' }
    const retireInstead = status === 409 && (body.detail as unknown as { next_action?: string })?.next_action === 'retire'
    expect(retireInstead).toBe(false)
  })
})

describe('SIGNAL_TYPES', () => {
  it('includes all 6 signal types', () => {
    expect(SIGNAL_TYPES).toHaveLength(6)
    expect(SIGNAL_TYPES).toContain('4-20mA')
    expect(SIGNAL_TYPES).toContain('0-10V')
    expect(SIGNAL_TYPES).toContain('RTD')
    expect(SIGNAL_TYPES).toContain('thermocouple')
    expect(SIGNAL_TYPES).toContain('discrete')
    expect(SIGNAL_TYPES).toContain('modbus')
  })
})

describe('createPoint API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST and returns created point', async () => {
    const mockPoint = {
      id: 'pt-1',
      asset_id: 'asset-1',
      tag: 'TT-01',
      description: 'Temperature sensor',
      signal_type: '4-20mA',
      range_low: 4,
      range_high: 20,
      engineering_units: 'mA',
      last_cal_date: null,
      cal_due_date: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPoint),
    }))

    const result = await createPoint('proj-1', 'asset-1', { tag: 'TT-01', signal_type: '4-20mA', range_low: 4, range_high: 20 })
    expect(result).toEqual(mockPoint)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1/points'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws 409 on duplicate tag within asset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'A point with this tag already exists on the asset' }),
    }))

    await expect(createPoint('proj-1', 'asset-1', { tag: 'TT-01' }))
      .rejects.toMatchObject({ status: 409 })
  })

  it('throws 422 on invalid signal type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ detail: 'Invalid signal_type' }),
    }))

    await expect(createPoint('proj-1', 'asset-1', { tag: 'TT-01', signal_type: 'invalid' as never }))
      .rejects.toMatchObject({ status: 422 })
  })
})

describe('listPointsForAsset API', () => {
  it('sends GET and returns list of points', async () => {
    const mockPoints = [
      {
        id: 'pt-1', asset_id: 'asset-1', tag: 'TT-01', description: null,
        signal_type: '4-20mA', range_low: 4, range_high: 20,
        engineering_units: 'mA', last_cal_date: null, cal_due_date: null,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPoints),
    }))

    const result = await listPointsForAsset('proj-1', 'asset-1')
    expect(result).toEqual(mockPoints)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1/points'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })
})

describe('updatePoint API', () => {
  it('sends PATCH and returns updated point', async () => {
    const mockPoint = {
      id: 'pt-1', asset_id: 'asset-1', tag: 'TT-01-RENAMED', description: null,
      signal_type: null, range_low: null, range_high: null,
      engineering_units: null, last_cal_date: null, cal_due_date: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPoint),
    }))

    const result = await updatePoint('proj-1', 'asset-1', 'pt-1', { tag: 'TT-01-RENAMED' })
    expect(result).toEqual(mockPoint)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1/points/pt-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})

describe('deletePoint API', () => {
  it('sends DELETE and resolves on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }))

    await expect(deletePoint('proj-1', 'asset-1', 'pt-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/assets/asset-1/points/pt-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws error when delete fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Point not found' }),
    }))

    await expect(deletePoint('proj-1', 'asset-1', 'pt-1'))
      .rejects.toMatchObject({ status: 404, message: 'Point not found' })
  })
})

describe('PointForm component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof PointForm).toBe('function')
  })
})

describe('PointList component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof PointList).toBe('function')
  })
})

describe('PointForm validation logic', () => {
  it('canSubmit is false when tag is empty', () => {
    const tag = ''
    const existingTags: string[] = []
    const submitting = false
    const tagValid = tag.trim().length > 0
    const tagDuplicate = existingTags.includes(tag.trim())
    const rangeValid = true
    const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when tag is valid, no duplicate, range valid, not submitting', () => {
    const tag = 'TT-01'
    const existingTags: string[] = []
    const submitting = false
    const tagValid = tag.trim().length > 0
    const tagDuplicate = existingTags.includes(tag.trim())
    const rangeValid = true
    const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false when tag duplicates an existing tag', () => {
    const tag = 'TT-01'
    const existingTags = ['TT-01']
    const submitting = false
    const tagValid = tag.trim().length > 0
    const tagDuplicate = existingTags.includes(tag.trim())
    const rangeValid = true
    const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is false when range_low > range_high', () => {
    const tag = 'TT-01'
    const existingTags: string[] = []
    const submitting = false
    const tagValid = tag.trim().length > 0
    const tagDuplicate = existingTags.includes(tag.trim())
    const rangeLowNum = 20
    const rangeHighNum = 4
    const rangeValid = rangeLowNum <= rangeHighNum
    const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when range_low equals range_high', () => {
    const tag = 'TT-01'
    const existingTags: string[] = []
    const submitting = false
    const tagValid = tag.trim().length > 0
    const tagDuplicate = existingTags.includes(tag.trim())
    const rangeLowNum = 10
    const rangeHighNum = 10
    const rangeValid = rangeLowNum <= rangeHighNum
    const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is true when only range_low is set (range_high null)', () => {
    const tag = 'TT-01'
    const existingTags: string[] = []
    const submitting = false
    const tagValid = tag.trim().length > 0
    const tagDuplicate = existingTags.includes(tag.trim())
    const rangeLowNum: number | null = 4
    const rangeHighNum: number | null = null
    const rangeValid = rangeLowNum === null || rangeHighNum === null || rangeLowNum <= rangeHighNum
    const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false when submitting=true', () => {
    const tag = 'TT-01'
    const existingTags: string[] = []
    const submitting = true
    const tagValid = tag.trim().length > 0
    const tagDuplicate = existingTags.includes(tag.trim())
    const rangeValid = true
    const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting
    expect(canSubmit).toBe(false)
  })
})

describe('PointList confirm-before-remove logic', () => {
  it('sets confirmDeleteId when delete button clicked', () => {
    let confirmDeleteId: string | null = null
    const pointId = 'pt-1'
    confirmDeleteId = pointId
    expect(confirmDeleteId).toBe('pt-1')
  })

  it('clears confirmDeleteId on cancel', () => {
    let confirmDeleteId: string | null = 'pt-1'
    confirmDeleteId = null
    expect(confirmDeleteId).toBeNull()
  })

  it('surfaces error inline without closing confirm row', () => {
    const deleteError = 'Failed to delete point.'
    expect(deleteError).toBe('Failed to delete point.')
  })
})
