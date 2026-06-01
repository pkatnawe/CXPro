'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  type Template,
  type TemplateLevel,
  type Instance,
  TEMPLATE_LEVELS,
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  linkTemplateToAssetType,
  unlinkTemplateFromAssetType,
  listInstances,
  updateInstanceStatus,
} from './api'
import { type AssetType, listAssetTypes } from '@/contexts/asset_registry/api'

interface TemplateFormProps {
  projectId: string
  editingTemplate?: Template | null
  onSuccess: () => void
  onCancel: () => void
}

export function TemplateForm({ projectId, editingTemplate, onSuccess, onCancel }: TemplateFormProps) {
  const [name, setName] = useState(editingTemplate?.name ?? '')
  const [level, setLevel] = useState<TemplateLevel>(editingTemplate?.level ?? 'L1')
  const [description, setDescription] = useState(editingTemplate?.description ?? '')
  const [steps, setSteps] = useState<string[]>(
    editingTemplate?.steps
      ? (editingTemplate.steps as string[]).map(s => (typeof s === 'string' ? s : JSON.stringify(s)))
      : ['']
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameValid = name.trim().length > 0
  const canSubmit = nameValid && !submitting

  function addStep() {
    setSteps(prev => [...prev, ''])
  }

  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx))
  }

  function updateStep(idx: number, value: string) {
    setSteps(prev => prev.map((s, i) => (i === idx ? value : s)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const stepsFiltered = steps.filter(s => s.trim().length > 0)
      const params = {
        name: name.trim(),
        level,
        description: description.trim() || null,
        steps: stepsFiltered,
      }
      if (editingTemplate) {
        await updateTemplate(projectId, editingTemplate.id, params)
      } else {
        await createTemplate(projectId, params)
      }
      onSuccess()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 400 || e.status === 409 || e.status === 422) {
        setError(e.body?.detail ?? 'Invalid request')
      } else {
        setError('Unexpected error. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .tf-form { display: flex; flex-direction: column; gap: 16px; }
        .tf-field { display: flex; flex-direction: column; gap: 4px; }
        .tf-label { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .tf-input, .tf-select, .tf-textarea { padding: 8px 12px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
        .tf-input:focus, .tf-select:focus, .tf-textarea:focus { outline: none; border-color: var(--bp-accent); }
        .tf-textarea { min-height: 60px; resize: vertical; }
        .tf-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; }
        .tf-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
        .tf-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .tf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .tf-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
        .tf-btn-sm { padding: 4px 8px; font-size: 0.75rem; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; }
        .tf-step-row { display: flex; gap: 8px; align-items: flex-start; }
        .tf-step-num { font-size: 0.75rem; color: var(--bp-text-secondary); padding-top: 10px; min-width: 20px; }
        .tf-step-input { flex: 1; padding: 8px 12px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; box-sizing: border-box; }
        .tf-step-input:focus { outline: none; border-color: var(--bp-accent); }
        .tf-steps-section { display: flex; flex-direction: column; gap: 8px; }
      `}</style>
      <form className="tf-form" onSubmit={handleSubmit}>
        <div className="tf-field">
          <label className="tf-label">Name *</label>
          <input
            className="tf-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Template name"
            required
          />
        </div>
        <div className="tf-field">
          <label className="tf-label">Level *</label>
          <select
            className="tf-select"
            value={level}
            onChange={e => setLevel(e.target.value as TemplateLevel)}
          >
            {TEMPLATE_LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="tf-field">
          <label className="tf-label">Description</label>
          <textarea
            className="tf-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        <div className="tf-field">
          <label className="tf-label">Steps</label>
          <div className="tf-steps-section">
            {steps.map((step, idx) => (
              <div key={idx} className="tf-step-row">
                <span className="tf-step-num">{idx + 1}.</span>
                <input
                  className="tf-step-input"
                  type="text"
                  value={step}
                  onChange={e => updateStep(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}`}
                />
                <button
                  type="button"
                  className="tf-btn-sm"
                  onClick={() => removeStep(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
            <div>
              <button type="button" className="tf-btn-sm" onClick={addStep}>
                + Add Step
              </button>
            </div>
          </div>
        </div>
        {error && <div className="tf-error" role="alert">{error}</div>}
        <div className="tf-actions">
          <button type="button" className="tf-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="tf-btn-primary" disabled={!canSubmit}>
            {submitting ? 'Saving…' : editingTemplate ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </>
  )
}

interface AssetTypeLinkPickerProps {
  projectId: string
  templateId: string
  onLinksChanged: () => void
}

export function AssetTypeLinkPicker({ projectId, templateId, onLinksChanged }: AssetTypeLinkPickerProps) {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [linkedIds, setLinkedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const types = await listAssetTypes(projectId)
      setAssetTypes(types)
      const linked: string[] = []
      for (const at of types) {
        const templates = await listTemplates(projectId, { asset_type_id: at.id })
        if (templates.some(t => t.id === templateId)) {
          linked.push(at.id)
        }
      }
      setLinkedIds(linked)
    } catch {
      setError('Failed to load asset types.')
    } finally {
      setLoading(false)
    }
  }, [projectId, templateId])

  useEffect(() => { load() }, [load])

  async function toggle(assetTypeId: string) {
    setToggling(assetTypeId)
    setError(null)
    try {
      if (linkedIds.includes(assetTypeId)) {
        await unlinkTemplateFromAssetType(projectId, templateId, assetTypeId)
        setLinkedIds(prev => prev.filter(id => id !== assetTypeId))
      } else {
        await linkTemplateToAssetType(projectId, templateId, assetTypeId)
        setLinkedIds(prev => [...prev, assetTypeId])
      }
      onLinksChanged()
    } catch {
      setError('Failed to update link.')
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <span style={{ fontSize: '0.875rem', color: 'var(--bp-text-secondary)' }}>Loading asset types…</span>

  return (
    <>
      <style jsx>{`
        .alp-list { display: flex; flex-direction: column; gap: 6px; }
        .alp-row { display: flex; align-items: center; gap: 8px; }
        .alp-label { font-size: 0.875rem; color: var(--bp-text-primary); flex: 1; }
        .alp-btn { padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--bp-border); background: transparent; color: var(--bp-text-secondary); }
        .alp-btn-linked { background: var(--bp-accent); color: white; border-color: var(--bp-accent); }
        .alp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .alp-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); margin-top: 4px; }
        .alp-empty { font-size: 0.875rem; color: var(--bp-text-secondary); }
      `}</style>
      {error && <div className="alp-error" role="alert">{error}</div>}
      {assetTypes.length === 0 ? (
        <span className="alp-empty">No asset types defined for this project.</span>
      ) : (
        <div className="alp-list">
          {assetTypes.map(at => {
            const isLinked = linkedIds.includes(at.id)
            return (
              <div key={at.id} className="alp-row">
                <span className="alp-label">{at.name}</span>
                <button
                  className={`alp-btn ${isLinked ? 'alp-btn-linked' : ''}`}
                  onClick={() => toggle(at.id)}
                  disabled={toggling === at.id}
                >
                  {isLinked ? 'Linked' : 'Link'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

interface TemplateDeleteDialogProps {
  template: Template
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
  deleteError: string | null
}

function TemplateDeleteDialog({ template, onConfirm, onCancel, deleting, deleteError }: TemplateDeleteDialogProps) {
  return (
    <>
      <style jsx>{`
        .tdd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .tdd-box { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 400px; width: 90%; }
        .tdd-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 8px; }
        .tdd-body { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 16px; }
        .tdd-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; margin-bottom: 12px; }
        .tdd-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .tdd-btn-danger { padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .tdd-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .tdd-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
      `}</style>
      <div className="tdd-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
        <div className="tdd-box">
          <div className="tdd-title">Delete &quot;{template.name}&quot;?</div>
          <div className="tdd-body">
            This action cannot be undone. Templates in use by test procedure instances cannot be deleted.
          </div>
          {deleteError && <div className="tdd-error" role="alert">{deleteError}</div>}
          <div className="tdd-actions">
            <button className="tdd-btn-ghost" onClick={onCancel} disabled={deleting}>Cancel</button>
            <button className="tdd-btn-danger" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

interface TemplateListProps {
  projectId: string
  onRowClick?: (template: Template) => void
}

export function TemplateList({ projectId, onRowClick }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<TemplateLevel | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listTemplates(projectId, levelFilter ? { level: levelFilter } : undefined)
      setTemplates(data)
    } catch {
      setLoadError('Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }, [projectId, levelFilter])

  useEffect(() => { load() }, [load])

  function handleFormSuccess() {
    setShowForm(false)
    setEditingTemplate(null)
    load()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingTemplate(null)
  }

  async function handleDelete() {
    if (!deletingTemplate) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteTemplate(projectId, deletingTemplate.id)
      setDeletingTemplate(null)
      load()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 409) {
        const detail = e.body?.detail
        const msg = typeof detail === 'string'
          ? detail
          : 'Template is in use by test procedure instances and cannot be deleted.'
        setDeleteError(msg)
      } else {
        setDeleteError('Failed to delete template.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .tl-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .tl-select { padding: 6px 10px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; }
        .tl-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; margin-left: auto; }
        .tl-loading { color: var(--bp-text-secondary); font-size: 0.875rem; }
        .tl-error { color: var(--bp-error-text, #ef4444); font-size: 0.875rem; }
        .tl-empty { color: var(--bp-text-secondary); font-size: 0.875rem; }
        .tl-table { width: 100%; border-collapse: collapse; }
        .tl-th { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--bp-border); }
        .tl-td { font-size: 0.875rem; color: var(--bp-text-primary); padding: 10px 12px; border-bottom: 1px solid var(--bp-border); vertical-align: top; }
        .tl-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: var(--bp-bg-secondary); color: var(--bp-text-secondary); }
        .tl-btn-ghost { padding: 4px 10px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-right: 4px; }
        .tl-btn-danger { padding: 4px 10px; background: transparent; color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
        .tl-btn-link { padding: 4px 10px; background: transparent; color: var(--bp-accent); border: 1px solid var(--bp-accent); border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-right: 4px; }
        .tl-form-container { padding: 16px; background: var(--bp-bg-secondary); border-radius: 8px; margin-bottom: 16px; }
        .tl-form-title { font-size: 0.875rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 12px; }
        .tl-link-panel { padding: 12px; background: var(--bp-bg-secondary); border-radius: 4px; margin-top: 4px; }
        .tl-link-title { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .tl-step-count { font-size: 0.75rem; color: var(--bp-text-secondary); }
      `}</style>
      {(showForm || editingTemplate) && (
        <div className="tl-form-container">
          <div className="tl-form-title">{editingTemplate ? 'Edit Template' : 'New Template'}</div>
          <TemplateForm
            projectId={projectId}
            editingTemplate={editingTemplate}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}
      <div className="tl-toolbar">
        <label style={{ fontSize: '0.75rem', color: 'var(--bp-text-secondary)' }}>Filter by Level:</label>
        <select
          className="tl-select"
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value as TemplateLevel | '')}
        >
          <option value="">All Levels</option>
          {TEMPLATE_LEVELS.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <button
          className="tl-btn-primary"
          onClick={() => { setEditingTemplate(null); setShowForm(true) }}
        >
          + New Template
        </button>
      </div>
      {loading && <div className="tl-loading">Loading templates…</div>}
      {loadError && <div className="tl-error" role="alert">{loadError}</div>}
      {!loading && !loadError && templates.length === 0 && (
        <div className="tl-empty">No templates found. Create one to get started.</div>
      )}
      {!loading && templates.length > 0 && (
        <table className="tl-table">
          <thead>
            <tr>
              <th className="tl-th">Name</th>
              <th className="tl-th">Level</th>
              <th className="tl-th">Steps</th>
              <th className="tl-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <>
                <tr key={t.id} style={onRowClick ? { cursor: 'pointer' } : undefined} onClick={onRowClick ? () => onRowClick(t) : undefined}>
                  <td className="tl-td">{t.name}</td>
                  <td className="tl-td"><span className="tl-badge">{t.level}</span></td>
                  <td className="tl-td">
                    <span className="tl-step-count">{t.steps.length} step{t.steps.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="tl-td">
                    <button
                      className="tl-btn-link"
                      onClick={() => setExpandedLinkId(expandedLinkId === t.id ? null : t.id)}
                    >
                      Asset Types
                    </button>
                    <button
                      className="tl-btn-ghost"
                      onClick={() => { setShowForm(false); setEditingTemplate(t) }}
                    >
                      Edit
                    </button>
                    <button
                      className="tl-btn-danger"
                      onClick={() => { setDeleteError(null); setDeletingTemplate(t) }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedLinkId === t.id && (
                  <tr key={`${t.id}-links`}>
                    <td className="tl-td" colSpan={4}>
                      <div className="tl-link-panel">
                        <div className="tl-link-title">Linked Asset Types</div>
                        <AssetTypeLinkPicker
                          projectId={projectId}
                          templateId={t.id}
                          onLinksChanged={load}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
      {deletingTemplate && (
        <TemplateDeleteDialog
          template={deletingTemplate}
          onConfirm={handleDelete}
          onCancel={() => { setDeletingTemplate(null); setDeleteError(null) }}
          deleting={deleting}
          deleteError={deleteError}
        />
      )}
    </>
  )
}

const INSTANCE_STATUSES = ['pending', 'in_progress', 'complete'] as const
type InstanceStatus = typeof INSTANCE_STATUSES[number]

const LEVEL_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'L2', label: 'Checklist (L2)' },
  { value: 'L3', label: 'Tests (L3)' },
  { value: 'L4', label: 'Tests (L4)' },
  { value: 'L5', label: 'Tests (L5)' },
] as const

interface InstanceListProps {
  projectId: string
  assetId: string
}

export function InstanceList({ projectId, assetId }: InstanceListProps) {
  const [instances, setInstances] = useState<Instance[]>([])
  const [templateMap, setTemplateMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const filters: { asset_id: string; level?: string } = { asset_id: assetId }
      if (levelFilter) filters.level = levelFilter
      const [data, templates] = await Promise.all([
        listInstances(projectId, filters),
        listTemplates(projectId),
      ])
      setInstances(data)
      const map: Record<string, string> = {}
      for (const t of templates) map[t.id] = t.name
      setTemplateMap(map)
    } catch {
      setLoadError('Failed to load test procedure instances.')
    } finally {
      setLoading(false)
    }
  }, [projectId, assetId, levelFilter])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(instanceId: string, newStatus: string) {
    setUpdatingId(instanceId)
    try {
      const updated = await updateInstanceStatus(projectId, instanceId, newStatus)
      setInstances(prev => prev.map(i => i.id === instanceId ? updated : i))
    } catch {
      // silently ignore; row stays at previous status
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <style jsx>{`
        .il-section { margin-top: 24px; }
        .il-title { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .il-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .il-label { font-size: 0.75rem; color: var(--bp-text-secondary); }
        .il-select { padding: 4px 8px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.8rem; }
        .il-loading { font-size: 0.875rem; color: var(--bp-text-secondary); }
        .il-error { font-size: 0.875rem; color: var(--bp-error-text, #ef4444); }
        .il-empty { font-size: 0.875rem; color: var(--bp-text-secondary); }
        .il-table { width: 100%; border-collapse: collapse; }
        .il-th { font-size: 0.7rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--bp-border); }
        .il-td { font-size: 0.8rem; color: var(--bp-text-primary); padding: 8px 10px; border-bottom: 1px solid var(--bp-border); }
        .il-badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: 500; background: var(--bp-bg-secondary); color: var(--bp-text-secondary); }
        .il-status-select { padding: 3px 6px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.8rem; }
        .il-status-select:disabled { opacity: 0.5; }
      `}</style>
      <div className="il-section">
        <div className="il-title">Test Procedure Instances</div>
        <div className="il-toolbar">
          <span className="il-label">Level:</span>
          <select
            className="il-select"
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            aria-label="Filter by level"
          >
            {LEVEL_FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {loading && <div className="il-loading">Loading instances…</div>}
        {loadError && <div className="il-error" role="alert">{loadError}</div>}
        {!loading && !loadError && instances.length === 0 && (
          <div className="il-empty">No test procedure instances found.</div>
        )}
        {!loading && instances.length > 0 && (
          <table className="il-table">
            <thead>
              <tr>
                <th className="il-th">Template</th>
                <th className="il-th">Level</th>
                <th className="il-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {instances.map(inst => (
                <tr key={inst.id}>
                  <td className="il-td">{templateMap[inst.template_id] ?? inst.template_id}</td>
                  <td className="il-td"><span className="il-badge">{inst.level}</span></td>
                  <td className="il-td">
                    <select
                      className="il-status-select"
                      value={inst.status}
                      disabled={updatingId === inst.id}
                      onChange={e => handleStatusChange(inst.id, e.target.value)}
                      aria-label={`Status for instance ${inst.id}`}
                    >
                      {INSTANCE_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
