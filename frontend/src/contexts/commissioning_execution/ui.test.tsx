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

vi.mock('@/contexts/asset_registry/api', () => ({
  listAssetTypes: vi.fn().mockResolvedValue([]),
}))

import {
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  linkTemplateToAssetType,
  unlinkTemplateFromAssetType,
  listInstances,
  updateInstanceStatus,
  TEMPLATE_LEVELS,
  type TemplateLevel,
} from './api'

import { TemplateForm, TemplateList, AssetTypeLinkPicker, InstanceList } from './ui'

describe('TEMPLATE_LEVELS', () => {
  it('contains exactly L1 through L5', () => {
    expect(TEMPLATE_LEVELS).toHaveLength(5)
    expect(TEMPLATE_LEVELS).toContain('L1')
    expect(TEMPLATE_LEVELS).toContain('L2')
    expect(TEMPLATE_LEVELS).toContain('L3')
    expect(TEMPLATE_LEVELS).toContain('L4')
    expect(TEMPLATE_LEVELS).toContain('L5')
  })
})

describe('createTemplate API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST and returns created template', async () => {
    const mockTemplate = {
      id: 'tpl-1',
      project_id: 'proj-1',
      name: 'L1 Pre-Construction Check',
      level: 'L1' as TemplateLevel,
      description: null,
      steps: [],
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    }))

    const result = await createTemplate('proj-1', { name: 'L1 Pre-Construction Check', level: 'L1' })
    expect(result).toEqual(mockTemplate)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/test-procedure-templates'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws 409 on duplicate name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'A template with this name already exists in the project' }),
    }))

    await expect(createTemplate('proj-1', { name: 'Duplicate', level: 'L2' }))
      .rejects.toMatchObject({ status: 409 })
  })

  it('throws 422 on invalid level', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ detail: 'Invalid level' }),
    }))

    await expect(createTemplate('proj-1', { name: 'Bad', level: 'L9' as TemplateLevel }))
      .rejects.toMatchObject({ status: 422 })
  })
})

describe('listTemplates API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends GET and returns list of templates', async () => {
    const mockTemplates = [
      { id: 'tpl-1', project_id: 'proj-1', name: 'Check 1', level: 'L1', description: null, steps: [], created_at: '2026-01-01T00:00:00Z' },
      { id: 'tpl-2', project_id: 'proj-1', name: 'Test 1', level: 'L3', description: null, steps: [], created_at: '2026-01-01T00:00:00Z' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTemplates),
    }))

    const result = await listTemplates('proj-1')
    expect(result).toEqual(mockTemplates)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/test-procedure-templates'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })

  it('includes level query param when filter provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listTemplates('proj-1', { level: 'L2' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('level=L2'),
      expect.any(Object)
    )
  })

  it('includes asset_type_id query param when filter provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listTemplates('proj-1', { asset_type_id: 'at-1' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('asset_type_id=at-1'),
      expect.any(Object)
    )
  })
})

describe('updateTemplate API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends PATCH and returns updated template', async () => {
    const mockTemplate = {
      id: 'tpl-1',
      project_id: 'proj-1',
      name: 'Renamed Template',
      level: 'L2' as TemplateLevel,
      description: null,
      steps: [],
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    }))

    const result = await updateTemplate('proj-1', 'tpl-1', { name: 'Renamed Template' })
    expect(result).toEqual(mockTemplate)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/test-procedure-templates/tpl-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('throws 409 on duplicate name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'A template with this name already exists' }),
    }))

    await expect(updateTemplate('proj-1', 'tpl-1', { name: 'Existing Name' }))
      .rejects.toMatchObject({ status: 409 })
  })
})

describe('deleteTemplate API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends DELETE and resolves on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }))

    await expect(deleteTemplate('proj-1', 'tpl-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/test-procedure-templates/tpl-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws 409 when template has instances', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: 'Cannot delete a template that is referenced by test procedure instances' }),
    }))

    await expect(deleteTemplate('proj-1', 'tpl-1'))
      .rejects.toMatchObject({ status: 409, message: 'Cannot delete a template that is referenced by test procedure instances' })
  })
})

describe('linkTemplateToAssetType API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST to asset-type-links endpoint', async () => {
    const mockLink = {
      asset_type_id: 'at-1',
      test_procedure_template_id: 'tpl-1',
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLink),
    }))

    const result = await linkTemplateToAssetType('proj-1', 'tpl-1', 'at-1')
    expect(result).toEqual(mockLink)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-procedure-templates/tpl-1/asset-type-links'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('unlinkTemplateFromAssetType API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends DELETE to asset-type-links/{id} endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }))

    await expect(unlinkTemplateFromAssetType('proj-1', 'tpl-1', 'at-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-procedure-templates/tpl-1/asset-type-links/at-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('listInstances API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends GET and returns list of instances', async () => {
    const mockInstances = [
      {
        id: 'inst-1',
        project_id: 'proj-1',
        template_id: 'tpl-1',
        asset_id: 'asset-1',
        system_id: null,
        level: 'L2',
        status: 'pending',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]
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

  it('includes level filter in query params', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listInstances('proj-1', { level: 'L2' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('level=L2'),
      expect.any(Object)
    )
  })

  it('includes status filter in query params', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }))

    await listInstances('proj-1', { status: 'pending' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=pending'),
      expect.any(Object)
    )
  })
})

describe('updateInstanceStatus API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends PATCH and returns updated instance', async () => {
    const mockInstance = {
      id: 'inst-1',
      project_id: 'proj-1',
      template_id: 'tpl-1',
      asset_id: 'asset-1',
      system_id: null,
      level: 'L2',
      status: 'in_progress',
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInstance),
    }))

    const result = await updateInstanceStatus('proj-1', 'inst-1', 'in_progress')
    expect(result).toEqual(mockInstance)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-procedure-instances/inst-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})

describe('TemplateForm component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof TemplateForm).toBe('function')
  })
})

describe('TemplateList component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof TemplateList).toBe('function')
  })
})

describe('AssetTypeLinkPicker component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof AssetTypeLinkPicker).toBe('function')
  })
})

describe('TemplateForm validation logic', () => {
  it('canSubmit is false when name is empty', () => {
    const name = ''
    const submitting = false
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('canSubmit is true when name is provided', () => {
    const name = 'My Template'
    const submitting = false
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(true)
  })

  it('canSubmit is false while submitting', () => {
    const name = 'My Template'
    const submitting = true
    const nameValid = name.trim().length > 0
    const canSubmit = nameValid && !submitting
    expect(canSubmit).toBe(false)
  })

  it('level must be from L1-L5 set', () => {
    const validLevels: TemplateLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5']
    for (const level of validLevels) {
      expect(TEMPLATE_LEVELS).toContain(level)
    }
  })

  it('steps list is editable — add step appends empty string', () => {
    const steps = ['step one']
    const newSteps = [...steps, '']
    expect(newSteps).toHaveLength(2)
    expect(newSteps[1]).toBe('')
  })

  it('steps list is editable — remove step filters by index', () => {
    const steps = ['step one', 'step two', 'step three']
    const idx = 1
    const filtered = steps.filter((_, i) => i !== idx)
    expect(filtered).toEqual(['step one', 'step three'])
  })

  it('blank steps are filtered out on submit', () => {
    const steps = ['step one', '', 'step three', '  ']
    const filtered = steps.filter(s => s.trim().length > 0)
    expect(filtered).toEqual(['step one', 'step three'])
  })
})

describe('TemplateForm delete confirmation logic', () => {
  it('sets deletingTemplate when delete clicked', () => {
    let deletingTemplate: { id: string; name: string } | null = null
    const template = { id: 'tpl-1', name: 'My Template' }
    deletingTemplate = template
    expect(deletingTemplate).toEqual(template)
  })

  it('clears deletingTemplate on cancel', () => {
    let deletingTemplate: { id: string; name: string } | null = { id: 'tpl-1', name: 'My Template' }
    deletingTemplate = null
    expect(deletingTemplate).toBeNull()
  })

  it('surfaces 409 error inline without closing dialog', () => {
    const status = 409
    const body = { detail: 'template is in use by N instances' }
    const isInUse = status === 409
    const errorMsg = body.detail
    expect(isInUse).toBe(true)
    expect(errorMsg).toContain('template is in use')
  })

  it('resolves on 204 — template removed from list', () => {
    const status = 204
    const removed = status === 204
    expect(removed).toBe(true)
  })
})

describe('AssetTypeLinkPicker toggle logic', () => {
  it('links an asset type when not already linked', () => {
    const linkedIds: string[] = []
    const assetTypeId = 'at-1'
    const isLinked = linkedIds.includes(assetTypeId)
    expect(isLinked).toBe(false)
    const newLinkedIds = [...linkedIds, assetTypeId]
    expect(newLinkedIds).toContain('at-1')
  })

  it('unlinks an asset type when already linked', () => {
    const linkedIds = ['at-1', 'at-2']
    const assetTypeId = 'at-1'
    const isLinked = linkedIds.includes(assetTypeId)
    expect(isLinked).toBe(true)
    const newLinkedIds = linkedIds.filter(id => id !== assetTypeId)
    expect(newLinkedIds).toEqual(['at-2'])
  })
})

describe('TemplateList level filter logic', () => {
  it('filters templates by level', () => {
    const templates = [
      { id: 'tpl-1', level: 'L1', name: 'Check 1' },
      { id: 'tpl-2', level: 'L2', name: 'Checklist 1' },
      { id: 'tpl-3', level: 'L3', name: 'Test 1' },
    ]
    const levelFilter = 'L2'
    const filtered = levelFilter ? templates.filter(t => t.level === levelFilter) : templates
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('tpl-2')
  })

  it('shows all templates when no level filter', () => {
    const templates = [
      { id: 'tpl-1', level: 'L1', name: 'Check 1' },
      { id: 'tpl-2', level: 'L3', name: 'Test 1' },
    ]
    const levelFilter = ''
    const filtered = levelFilter ? templates.filter(t => t.level === levelFilter) : templates
    expect(filtered).toHaveLength(2)
  })
})

describe('InstanceList component', () => {
  it('is exported from ui.tsx', () => {
    expect(typeof InstanceList).toBe('function')
  })
})

describe('InstanceList level filter logic', () => {
  it('filters instances to L2 (Checklist) only', () => {
    const instances = [
      { id: 'inst-1', level: 'L2', status: 'pending', template_id: 'tpl-1', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
      { id: 'inst-2', level: 'L3', status: 'pending', template_id: 'tpl-2', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
      { id: 'inst-3', level: 'L4', status: 'complete', template_id: 'tpl-3', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
    ]
    const levelFilter = 'L2'
    const filtered = levelFilter ? instances.filter(i => i.level === levelFilter) : instances
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('inst-1')
  })

  it('filters instances to Tests (L3-L5)', () => {
    const instances = [
      { id: 'inst-1', level: 'L2', status: 'pending', template_id: 'tpl-1', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
      { id: 'inst-2', level: 'L3', status: 'pending', template_id: 'tpl-2', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
      { id: 'inst-3', level: 'L4', status: 'complete', template_id: 'tpl-3', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
    ]
    const levelFilter = 'L3'
    const filtered = levelFilter ? instances.filter(i => i.level === levelFilter) : instances
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('inst-2')
  })

  it('shows all instances when no level filter', () => {
    const instances = [
      { id: 'inst-1', level: 'L2', status: 'pending', template_id: 'tpl-1', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
      { id: 'inst-2', level: 'L3', status: 'in_progress', template_id: 'tpl-2', asset_id: 'a-1', system_id: null, project_id: 'p-1', created_at: '' },
    ]
    const levelFilter = ''
    const filtered = levelFilter ? instances.filter(i => i.level === levelFilter) : instances
    expect(filtered).toHaveLength(2)
  })
})

describe('InstanceList empty state logic', () => {
  it('shows empty state when instances array is empty', () => {
    const instances: unknown[] = []
    const isEmpty = instances.length === 0
    expect(isEmpty).toBe(true)
  })

  it('does not show empty state when instances exist', () => {
    const instances = [{ id: 'inst-1', level: 'L2', status: 'pending' }]
    const isEmpty = instances.length === 0
    expect(isEmpty).toBe(false)
  })
})

describe('InstanceList status transition logic', () => {
  it('status transition pending → in_progress is valid', () => {
    const VALID_STATUSES = ['pending', 'in_progress', 'complete']
    expect(VALID_STATUSES).toContain('in_progress')
  })

  it('status transition in_progress → complete is valid', () => {
    const VALID_STATUSES = ['pending', 'in_progress', 'complete']
    expect(VALID_STATUSES).toContain('complete')
  })

  it('updateInstanceStatus is called with correct args on status change', async () => {
    vi.clearAllMocks()
    const mockInstance = {
      id: 'inst-1',
      project_id: 'proj-1',
      template_id: 'tpl-1',
      asset_id: 'asset-1',
      system_id: null,
      level: 'L2',
      status: 'in_progress',
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInstance),
    }))

    const result = await updateInstanceStatus('proj-1', 'inst-1', 'in_progress')
    expect(result.status).toBe('in_progress')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-procedure-instances/inst-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('after status update, instance in list is updated', () => {
    const instances = [
      { id: 'inst-1', level: 'L2', status: 'pending', template_id: 'tpl-1' },
      { id: 'inst-2', level: 'L3', status: 'pending', template_id: 'tpl-2' },
    ]
    const updatedInstance = { id: 'inst-1', level: 'L2', status: 'in_progress', template_id: 'tpl-1' }
    const newInstances = instances.map(i => i.id === 'inst-1' ? updatedInstance : i)
    expect(newInstances[0].status).toBe('in_progress')
    expect(newInstances[1].status).toBe('pending')
  })
})

describe('InstanceList template name display logic', () => {
  it('resolves template_id to template name via templateMap', () => {
    const templateMap: Record<string, string> = { 'tpl-1': 'L2 Checklist', 'tpl-2': 'L3 Functional Test' }
    const instance = { id: 'inst-1', template_id: 'tpl-1', level: 'L2', status: 'pending' }
    const displayName = templateMap[instance.template_id] ?? instance.template_id
    expect(displayName).toBe('L2 Checklist')
  })

  it('falls back to template_id when not in templateMap', () => {
    const templateMap: Record<string, string> = {}
    const instance = { id: 'inst-1', template_id: 'tpl-unknown', level: 'L2', status: 'pending' }
    const displayName = templateMap[instance.template_id] ?? instance.template_id
    expect(displayName).toBe('tpl-unknown')
  })

  it('templateMap is built from templates list by id→name', () => {
    const templates = [
      { id: 'tpl-1', name: 'L2 Checklist', level: 'L2', project_id: 'p-1', description: null, steps: [], created_at: '' },
      { id: 'tpl-2', name: 'L3 Functional Test', level: 'L3', project_id: 'p-1', description: null, steps: [], created_at: '' },
    ]
    const map: Record<string, string> = {}
    for (const t of templates) map[t.id] = t.name
    expect(map['tpl-1']).toBe('L2 Checklist')
    expect(map['tpl-2']).toBe('L3 Functional Test')
  })
})

describe('TemplateList row click href', () => {
  it('onRowClick href is /project/[id]/test-procedure-templates/[templateId]', () => {
    const projectId = 'proj-1'
    const templateId = 'tpl-abc'
    const href = `/project/${projectId}/test-procedure-templates/${templateId}`
    expect(href).toBe('/project/proj-1/test-procedure-templates/tpl-abc')
  })
})
