'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  type Space,
  type SpaceKind,
  type AssetType,
  type System,
  type SystemMember,
  type Asset,
  type AssetStatus,
  type Point,
  type SignalType,
  SPACE_KINDS,
  ALLOWED_PARENTS,
  SIGNAL_TYPES,
  isAllowedSpaceParent,
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
  deletePoint,
} from './api'
import { InstanceList } from '@/contexts/commissioning_execution/ui'
import { type AssetFilters, type FilterKey } from './useUrlFilters'

interface SpaceFormProps {
  projectId: string
  spaces: Space[]
  editingSpace?: Space | null
  onSuccess: () => void
  onCancel: () => void
}

export function SpaceForm({ projectId, spaces, editingSpace, onSuccess, onCancel }: SpaceFormProps) {
  const [kind, setKind] = useState<SpaceKind>(editingSpace?.kind ?? 'building')
  const [name, setName] = useState(editingSpace?.name ?? '')
  const [parentSpaceId, setParentSpaceId] = useState<string>(editingSpace?.parent_space_id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedParent = spaces.find(s => s.id === parentSpaceId) ?? null
  const parentKind = selectedParent ? selectedParent.kind : null

  const parentValid = isAllowedSpaceParent(parentKind as SpaceKind | null, kind)
  const nameValid = name.trim().length > 0
  const canSubmit = nameValid && (parentSpaceId === '' ? isAllowedSpaceParent(null, kind) : parentValid) && !submitting

  const allowedParentSpaces = spaces.filter(s => {
    return (ALLOWED_PARENTS[kind] as Array<SpaceKind | null>).includes(s.kind as SpaceKind)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const parentId = parentSpaceId || null
      if (editingSpace) {
        await updateSpace(projectId, editingSpace.id, { name: name.trim(), parent_space_id: parentId })
      } else {
        await createSpace(projectId, { kind, name: name.trim(), parent_space_id: parentId })
      }
      onSuccess()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 400 || e.status === 409) {
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
        .sf-form { display: flex; flex-direction: column; gap: 16px; }
        .sf-field { display: flex; flex-direction: column; gap: 4px; }
        .sf-label { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .sf-input, .sf-select { padding: 8px 12px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
        .sf-input:focus, .sf-select:focus { outline: none; border-color: var(--bp-accent); }
        .sf-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; }
        .sf-hint { font-size: 0.75rem; color: var(--bp-text-secondary); }
        .sf-hint-warn { font-size: 0.75rem; color: var(--bp-warning-text, #d97706); }
        .sf-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
        .sf-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .sf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .sf-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
      `}</style>
      <form className="sf-form" onSubmit={handleSubmit}>
        {!editingSpace && (
          <div className="sf-field">
            <label className="sf-label">Kind</label>
            <select
              className="sf-select"
              value={kind}
              onChange={e => { setKind(e.target.value as SpaceKind); setParentSpaceId('') }}
            >
              {SPACE_KINDS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        )}
        <div className="sf-field">
          <label className="sf-label">Name *</label>
          <input
            className="sf-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Space name"
            required
          />
        </div>
        <div className="sf-field">
          <label className="sf-label">Parent Space</label>
          <select
            className="sf-select"
            value={parentSpaceId}
            onChange={e => setParentSpaceId(e.target.value)}
          >
            <option value="">— None (top-level) —</option>
            {allowedParentSpaces.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.kind})</option>
            ))}
          </select>
          {parentSpaceId && !parentValid && (
            <span className="sf-hint-warn">
              Selected parent kind is not allowed for a {kind} space.
            </span>
          )}
          {parentSpaceId === '' && !isAllowedSpaceParent(null, kind) && (
            <span className="sf-hint-warn">
              A {kind} space must have a parent.
            </span>
          )}
        </div>
        {error && <div className="sf-error" role="alert">{error}</div>}
        <div className="sf-actions">
          <button type="button" className="sf-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="sf-btn-primary" disabled={!canSubmit}>
            {submitting ? 'Saving…' : editingSpace ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </>
  )
}

interface DeleteDialogProps {
  space: Space
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
  deleteError: string | null
}

export function DeleteDialog({ space, onConfirm, onCancel, deleting, deleteError }: DeleteDialogProps) {
  return (
    <>
      <style jsx>{`
        .dd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .dd-box { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 400px; width: 90%; }
        .dd-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 8px; }
        .dd-body { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 16px; }
        .dd-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; margin-bottom: 12px; }
        .dd-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .dd-btn-danger { padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .dd-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .dd-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
      `}</style>
      <div className="dd-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
        <div className="dd-box">
          <div className="dd-title">Delete &quot;{space.name}&quot;?</div>
          <div className="dd-body">
            This action cannot be undone. Spaces with child spaces or asset references cannot be deleted.
          </div>
          {deleteError && <div className="dd-error" role="alert">{deleteError}</div>}
          <div className="dd-actions">
            <button className="dd-btn-ghost" onClick={onCancel} disabled={deleting}>Cancel</button>
            <button className="dd-btn-danger" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

interface SpaceTreeProps {
  projectId: string
  onNodeClick?: (space: Space) => void
}

export function SpaceTree({ projectId, onNodeClick }: SpaceTreeProps) {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listSpaces(projectId)
      setSpaces(data)
    } catch {
      setLoadError('Failed to load spaces.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  function handleFormSuccess() {
    setShowForm(false)
    setEditingSpace(null)
    load()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingSpace(null)
  }

  async function handleDeleteConfirm() {
    if (!deletingSpace) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSpace(projectId, deletingSpace.id)
      setDeletingSpace(null)
      load()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 409) {
        setDeleteError(e.body?.detail ?? 'Cannot delete: space has children or asset references.')
      } else {
        setDeleteError('Unexpected error. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  function buildTree(all: Space[]): Space[] {
    return all.filter(s => s.parent_space_id === null)
  }

  function getChildren(all: Space[], parentId: string): Space[] {
    return all.filter(s => s.parent_space_id === parentId)
  }

  function renderSpace(space: Space, depth: number): React.ReactNode {
    const children = getChildren(spaces, space.id)
    return (
      <div key={space.id} style={{ marginLeft: depth * 20 }}>
        <div className="st-row">
          <span className="st-kind-badge">{space.kind}</span>
          <span className="st-name" style={onNodeClick ? { cursor: 'pointer', color: 'var(--bp-accent)' } : undefined} onClick={onNodeClick ? () => onNodeClick(space) : undefined}>{space.name}</span>
          <Link
            className="st-btn-view-assets"
            href={`/project/${projectId}/assets?space=${space.id}`}
            title="View Assets in this Space"
          >
            Assets
          </Link>
          <div className="st-actions">
            <button
              className="st-btn-icon"
              title="Edit"
              onClick={() => { setEditingSpace(space); setShowForm(false) }}
            >
              ✎
            </button>
            <button
              className="st-btn-icon st-btn-danger"
              title="Delete"
              onClick={() => { setDeletingSpace(space); setDeleteError(null) }}
            >
              ✕
            </button>
          </div>
        </div>
        {children.map(child => renderSpace(child, depth + 1))}
      </div>
    )
  }

  const roots = buildTree(spaces)

  return (
    <>
      <style jsx>{`
        .st-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .st-title { font-size: 1.125rem; font-weight: 600; color: var(--bp-text-primary); }
        .st-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .st-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .st-kind-badge { font-size: 0.65rem; text-transform: uppercase; background: var(--bp-bg-tertiary); color: var(--bp-text-secondary); padding: 2px 6px; border-radius: 3px; }
        .st-name { flex: 1; font-size: 0.875rem; color: var(--bp-text-primary); }
        .st-actions { display: flex; gap: 4px; }
        .st-btn-icon { background: transparent; border: none; cursor: pointer; color: var(--bp-text-secondary); font-size: 1rem; padding: 2px 6px; border-radius: 3px; }
        .st-btn-icon:hover { background: var(--bp-bg-tertiary); }
        .st-btn-danger { color: #ef4444; }
        .st-btn-view-assets { font-size: 0.7rem; color: var(--bp-accent); text-decoration: none; padding: 2px 6px; border-radius: 3px; border: 1px solid var(--bp-accent); opacity: 0.7; }
        .st-btn-view-assets:hover { opacity: 1; }
        .st-empty { text-align: center; padding: 48px; color: var(--bp-text-secondary); font-size: 0.875rem; }
        .st-error { color: var(--bp-error-text, #ef4444); font-size: 0.875rem; margin-bottom: 8px; }
        .st-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .st-modal { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 480px; width: 90%; }
        .st-modal-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 16px; }
        .st-spinner { text-align: center; padding: 48px; color: var(--bp-text-secondary); }
      `}</style>

      <div>
        <div className="st-header">
          <span className="st-title">Spaces</span>
          <button className="st-btn-primary" onClick={() => { setShowForm(true); setEditingSpace(null) }}>
            + Add Space
          </button>
        </div>

        {loadError && <div className="st-error" role="alert">{loadError}</div>}

        {loading ? (
          <div className="st-spinner">Loading…</div>
        ) : roots.length === 0 && !showForm ? (
          <div className="st-empty">No spaces yet. Add your first space above.</div>
        ) : (
          <div>
            {roots.map(s => renderSpace(s, 0))}
          </div>
        )}

        {(showForm || editingSpace) && (
          <div className="st-modal-overlay">
            <div className="st-modal">
              <div className="st-modal-title">{editingSpace ? 'Edit Space' : 'Add Space'}</div>
              <SpaceForm
                projectId={projectId}
                spaces={spaces}
                editingSpace={editingSpace}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {deletingSpace && (
          <DeleteDialog
            space={deletingSpace}
            onConfirm={handleDeleteConfirm}
            onCancel={() => { setDeletingSpace(null); setDeleteError(null) }}
            deleting={deleting}
            deleteError={deleteError}
          />
        )}
      </div>
    </>
  )
}

interface AssetTypeFormProps {
  projectId: string
  editingAssetType?: AssetType | null
  onSuccess: () => void
  onCancel: () => void
}

export function AssetTypeForm({ projectId, editingAssetType, onSuccess, onCancel }: AssetTypeFormProps) {
  const [name, setName] = useState(editingAssetType?.name ?? '')
  const [description, setDescription] = useState(editingAssetType?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameValid = name.trim().length > 0
  const canSubmit = nameValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      if (editingAssetType) {
        await updateAssetType(projectId, editingAssetType.id, {
          name: name.trim(),
          description: description.trim() || null,
        })
      } else {
        await createAssetType(projectId, {
          name: name.trim(),
          description: description.trim() || null,
        })
      }
      onSuccess()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 400 || e.status === 409) {
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
        .atf-form { display: flex; flex-direction: column; gap: 16px; }
        .atf-field { display: flex; flex-direction: column; gap: 4px; }
        .atf-label { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .atf-input, .atf-textarea { padding: 8px 12px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
        .atf-input:focus, .atf-textarea:focus { outline: none; border-color: var(--bp-accent); }
        .atf-textarea { resize: vertical; min-height: 72px; }
        .atf-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; }
        .atf-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
        .atf-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .atf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .atf-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
      `}</style>
      <form className="atf-form" onSubmit={handleSubmit}>
        <div className="atf-field">
          <label className="atf-label">Name *</label>
          <input
            className="atf-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Asset type name"
            required
          />
        </div>
        <div className="atf-field">
          <label className="atf-label">Description</label>
          <textarea
            className="atf-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        {error && <div className="atf-error" role="alert">{error}</div>}
        <div className="atf-actions">
          <button type="button" className="atf-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="atf-btn-primary" disabled={!canSubmit}>
            {submitting ? 'Saving…' : editingAssetType ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </>
  )
}

interface AssetTypeDeleteDialogProps {
  assetType: AssetType
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
  deleteError: string | null
}

export function AssetTypeDeleteDialog({ assetType, onConfirm, onCancel, deleting, deleteError }: AssetTypeDeleteDialogProps) {
  return (
    <>
      <style jsx>{`
        .atdd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .atdd-box { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 400px; width: 90%; }
        .atdd-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 8px; }
        .atdd-body { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 16px; }
        .atdd-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; margin-bottom: 12px; }
        .atdd-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .atdd-btn-danger { padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .atdd-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .atdd-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
      `}</style>
      <div className="atdd-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete asset type">
        <div className="atdd-box">
          <div className="atdd-title">Delete &quot;{assetType.name}&quot;?</div>
          <div className="atdd-body">
            This action cannot be undone. Asset types referenced by assets cannot be deleted.
          </div>
          {deleteError && <div className="atdd-error" role="alert">{deleteError}</div>}
          <div className="atdd-actions">
            <button className="atdd-btn-ghost" onClick={onCancel} disabled={deleting}>Cancel</button>
            <button className="atdd-btn-danger" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

interface AssetTypeListProps {
  projectId: string
  onRowClick?: (assetType: AssetType) => void
}

export function AssetTypeList({ projectId, onRowClick }: AssetTypeListProps) {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAssetType, setEditingAssetType] = useState<AssetType | null>(null)
  const [deletingAssetType, setDeletingAssetType] = useState<AssetType | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listAssetTypes(projectId)
      setAssetTypes(data)
    } catch {
      setLoadError('Failed to load asset types.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  function handleFormSuccess() {
    setShowForm(false)
    setEditingAssetType(null)
    load()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingAssetType(null)
  }

  async function handleDeleteConfirm() {
    if (!deletingAssetType) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAssetType(projectId, deletingAssetType.id)
      setDeletingAssetType(null)
      load()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 409) {
        setDeleteError(e.body?.detail ?? 'Cannot delete: asset type is referenced by assets.')
      } else {
        setDeleteError('Unexpected error. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .atl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .atl-title { font-size: 1.125rem; font-weight: 600; color: var(--bp-text-primary); }
        .atl-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .atl-row { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .atl-name { flex: 1; font-size: 0.875rem; font-weight: 500; color: var(--bp-text-primary); }
        .atl-desc { font-size: 0.75rem; color: var(--bp-text-secondary); flex: 2; }
        .atl-actions { display: flex; gap: 4px; }
        .atl-btn-icon { background: transparent; border: none; cursor: pointer; color: var(--bp-text-secondary); font-size: 1rem; padding: 2px 6px; border-radius: 3px; }
        .atl-btn-icon:hover { background: var(--bp-bg-tertiary); }
        .atl-btn-danger { color: #ef4444; }
        .atl-empty { text-align: center; padding: 48px; color: var(--bp-text-secondary); font-size: 0.875rem; }
        .atl-error { color: var(--bp-error-text, #ef4444); font-size: 0.875rem; margin-bottom: 8px; }
        .atl-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .atl-modal { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 480px; width: 90%; }
        .atl-modal-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 16px; }
        .atl-spinner { text-align: center; padding: 48px; color: var(--bp-text-secondary); }
      `}</style>

      <div>
        <div className="atl-header">
          <span className="atl-title">Asset Types</span>
          <button className="atl-btn-primary" onClick={() => { setShowForm(true); setEditingAssetType(null) }}>
            + Add Asset Type
          </button>
        </div>

        {loadError && <div className="atl-error" role="alert">{loadError}</div>}

        {loading ? (
          <div className="atl-spinner">Loading…</div>
        ) : assetTypes.length === 0 && !showForm ? (
          <div className="atl-empty">No asset types yet. Add your first asset type above.</div>
        ) : (
          <div>
            {assetTypes.map(at => (
              <div key={at.id} className="atl-row" style={onRowClick ? { cursor: 'pointer' } : undefined} onClick={onRowClick ? () => onRowClick(at) : undefined}>
                <span className="atl-name">{at.name}</span>
                <span className="atl-desc">{at.description ?? ''}</span>
                <div className="atl-actions">
                  <button
                    className="atl-btn-icon"
                    title="Edit"
                    onClick={() => { setEditingAssetType(at); setShowForm(false) }}
                  >
                    ✎
                  </button>
                  <button
                    className="atl-btn-icon atl-btn-danger"
                    title="Delete"
                    onClick={() => { setDeletingAssetType(at); setDeleteError(null) }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(showForm || editingAssetType) && (
          <div className="atl-modal-overlay">
            <div className="atl-modal">
              <div className="atl-modal-title">{editingAssetType ? 'Edit Asset Type' : 'Add Asset Type'}</div>
              <AssetTypeForm
                projectId={projectId}
                editingAssetType={editingAssetType}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {deletingAssetType && (
          <AssetTypeDeleteDialog
            assetType={deletingAssetType}
            onConfirm={handleDeleteConfirm}
            onCancel={() => { setDeletingAssetType(null); setDeleteError(null) }}
            deleting={deleting}
            deleteError={deleteError}
          />
        )}
      </div>
    </>
  )
}

interface SystemFormProps {
  projectId: string
  systems: System[]
  editingSystem?: System | null
  onSuccess: () => void
  onCancel: () => void
}

export function SystemForm({ projectId, systems, editingSystem, onSuccess, onCancel }: SystemFormProps) {
  const [name, setName] = useState(editingSystem?.name ?? '')
  const [description, setDescription] = useState(editingSystem?.description ?? '')
  const [parentSystemId, setParentSystemId] = useState<string>(editingSystem?.parent_system_id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameValid = name.trim().length > 0
  const canSubmit = nameValid && !submitting

  const parentOptions = systems.filter(s => !editingSystem || s.id !== editingSystem.id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const parentId = parentSystemId || null
      if (editingSystem) {
        await updateSystem(projectId, editingSystem.id, {
          name: name.trim(),
          description: description.trim() || null,
          parent_system_id: parentId,
        })
      } else {
        await createSystem(projectId, {
          name: name.trim(),
          description: description.trim() || null,
          parent_system_id: parentId,
        })
      }
      onSuccess()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 400 || e.status === 409) {
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
        .syf-form { display: flex; flex-direction: column; gap: 16px; }
        .syf-field { display: flex; flex-direction: column; gap: 4px; }
        .syf-label { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .syf-input, .syf-select, .syf-textarea { padding: 8px 12px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
        .syf-input:focus, .syf-select:focus, .syf-textarea:focus { outline: none; border-color: var(--bp-accent); }
        .syf-textarea { resize: vertical; min-height: 72px; }
        .syf-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; }
        .syf-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
        .syf-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .syf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .syf-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
      `}</style>
      <form className="syf-form" onSubmit={handleSubmit}>
        <div className="syf-field">
          <label className="syf-label">Name *</label>
          <input
            className="syf-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="System name"
            required
          />
        </div>
        <div className="syf-field">
          <label className="syf-label">Description</label>
          <textarea
            className="syf-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        <div className="syf-field">
          <label className="syf-label">Parent System</label>
          <select
            className="syf-select"
            value={parentSystemId}
            onChange={e => setParentSystemId(e.target.value)}
          >
            <option value="">— None (top-level) —</option>
            {parentOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {error && <div className="syf-error" role="alert">{error}</div>}
        <div className="syf-actions">
          <button type="button" className="syf-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="syf-btn-primary" disabled={!canSubmit}>
            {submitting ? 'Saving…' : editingSystem ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </>
  )
}

interface SystemMembershipPickerProps {
  projectId: string
  systemId: string
  onAdded: () => void
}

export function SystemMembershipPicker({ projectId, systemId, onAdded }: SystemMembershipPickerProps) {
  const [tagPrefix, setTagPrefix] = useState('')
  const [assetId, setAssetId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = assetId.trim().length > 0 && !submitting

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await addAssetToSystem(projectId, systemId, assetId.trim())
      setAssetId('')
      setTagPrefix('')
      onAdded()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 409) {
        setError(e.body?.detail ?? 'Asset is already a member of this system')
      } else if (e.status === 404) {
        setError(e.body?.detail ?? 'Asset not found')
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
        .smp-form { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
        .smp-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px; }
        .smp-label { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .smp-input { padding: 8px 12px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
        .smp-input:focus { outline: none; border-color: var(--bp-accent); }
        .smp-btn { padding: 8px 14px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; white-space: nowrap; }
        .smp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .smp-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 6px 10px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; width: 100%; }
      `}</style>
      <form className="smp-form" onSubmit={handleAdd}>
        <div className="smp-field">
          <label className="smp-label">Tag Prefix Filter</label>
          <input
            className="smp-input"
            type="text"
            value={tagPrefix}
            onChange={e => setTagPrefix(e.target.value)}
            placeholder="Filter by tag prefix"
          />
        </div>
        <div className="smp-field">
          <label className="smp-label">Asset ID *</label>
          <input
            className="smp-input"
            type="text"
            value={assetId}
            onChange={e => setAssetId(e.target.value)}
            placeholder="Asset UUID"
            required
          />
        </div>
        <button type="submit" className="smp-btn" disabled={!canSubmit}>
          {submitting ? 'Adding…' : 'Add Asset'}
        </button>
        {error && <div className="smp-error" role="alert">{error}</div>}
      </form>
    </>
  )
}

interface SystemMemberListProps {
  projectId: string
  systemId: string
  onMembersChanged: () => void
}

function SystemMemberList({ projectId, systemId, onMembersChanged }: SystemMemberListProps) {
  const [members, setMembers] = useState<SystemMember[]>([])
  const [loading, setLoading] = useState(true)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSystemMembers(projectId, systemId)
      setMembers(data)
    } catch {
      // silently fail — parent shows the system
    } finally {
      setLoading(false)
    }
  }, [projectId, systemId])

  useEffect(() => { load() }, [load])

  async function handleRemoveConfirm(assetId: string) {
    setRemovingMemberId(assetId)
    setRemoveError(null)
    try {
      await removeAssetFromSystem(projectId, systemId, assetId)
      setConfirmRemoveId(null)
      onMembersChanged()
      load()
    } catch (err: unknown) {
      const e = err as { body?: { detail?: string } }
      setRemoveError(e.body?.detail ?? 'Failed to remove asset.')
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <>
      <style jsx>{`
        .sml-wrap { margin-top: 8px; }
        .sml-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--bp-bg-tertiary, #f3f4f6); border-radius: 4px; margin-bottom: 3px; font-size: 0.8rem; }
        .sml-tag { font-family: monospace; color: var(--bp-text-primary); flex: 1; }
        .sml-name { color: var(--bp-text-secondary); flex: 1; }
        .sml-btn-remove { background: transparent; border: none; cursor: pointer; color: #ef4444; font-size: 0.9rem; padding: 2px 5px; border-radius: 3px; }
        .sml-btn-remove:hover { background: #fee2e2; }
        .sml-empty { font-size: 0.8rem; color: var(--bp-text-secondary); padding: 6px 0; }
        .sml-spinner { font-size: 0.8rem; color: var(--bp-text-secondary); }
        .sml-confirm { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #fee2e2; border-radius: 4px; margin-bottom: 3px; font-size: 0.8rem; }
        .sml-confirm-msg { flex: 1; color: var(--bp-text-primary); }
        .sml-confirm-yes { padding: 3px 8px; background: #ef4444; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75rem; }
        .sml-confirm-yes:disabled { opacity: 0.5; }
        .sml-confirm-no { padding: 3px 8px; background: transparent; border: 1px solid var(--bp-border); border-radius: 3px; cursor: pointer; font-size: 0.75rem; color: var(--bp-text-secondary); }
        .sml-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 4px 8px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; margin-bottom: 4px; }
      `}</style>
      <div className="sml-wrap">
        {removeError && <div className="sml-error" role="alert">{removeError}</div>}
        {loading ? (
          <div className="sml-spinner">Loading members…</div>
        ) : members.length === 0 ? (
          <div className="sml-empty">No asset members yet.</div>
        ) : (
          members.map(m => (
            confirmRemoveId === m.id ? (
              <div key={m.id} className="sml-confirm">
                <span className="sml-confirm-msg">Remove {m.tag}?</span>
                <button
                  className="sml-confirm-yes"
                  onClick={() => handleRemoveConfirm(m.id)}
                  disabled={removingMemberId === m.id}
                >
                  {removingMemberId === m.id ? 'Removing…' : 'Remove'}
                </button>
                <button className="sml-confirm-no" onClick={() => setConfirmRemoveId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div key={m.id} className="sml-row">
                <span className="sml-tag">{m.tag}</span>
                <span className="sml-name">{m.name ?? ''}</span>
                <button
                  className="sml-btn-remove"
                  title="Remove from system"
                  onClick={() => { setConfirmRemoveId(m.id); setRemoveError(null) }}
                >
                  ✕
                </button>
              </div>
            )
          ))
        )}
      </div>
    </>
  )
}

interface SystemTreeProps {
  projectId: string
  onNodeClick?: (system: System) => void
}

export function SystemTree({ projectId, onNodeClick }: SystemTreeProps) {
  const [systems, setSystems] = useState<System[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSystem, setEditingSystem] = useState<System | null>(null)
  const [deletingSystem, setDeletingSystem] = useState<System | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())
  const [memberRefreshKey, setMemberRefreshKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listSystems(projectId)
      setSystems(data)
    } catch {
      setLoadError('Failed to load systems.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  function handleFormSuccess() {
    setShowForm(false)
    setEditingSystem(null)
    load()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingSystem(null)
  }

  async function handleDeleteConfirm() {
    if (!deletingSystem) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSystem(projectId, deletingSystem.id)
      setDeletingSystem(null)
      load()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 409) {
        setDeleteError(e.body?.detail ?? 'Cannot delete: system has children or asset memberships.')
      } else {
        setDeleteError('Unexpected error. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  function toggleMembers(systemId: string) {
    setExpandedMembers(prev => {
      const next = new Set(prev)
      if (next.has(systemId)) {
        next.delete(systemId)
      } else {
        next.add(systemId)
      }
      return next
    })
  }

  function getChildren(all: System[], parentId: string): System[] {
    return all.filter(s => s.parent_system_id === parentId)
  }

  function renderSystem(system: System, depth: number): React.ReactNode {
    const children = getChildren(systems, system.id)
    const membersExpanded = expandedMembers.has(system.id)
    return (
      <div key={system.id} style={{ marginLeft: depth * 20 }}>
        <div className="syt-row">
          <span className="syt-name" style={onNodeClick ? { cursor: 'pointer', color: 'var(--bp-accent)' } : undefined} onClick={onNodeClick ? () => onNodeClick(system) : undefined}>{system.name}</span>
          {system.description && <span className="syt-desc">{system.description}</span>}
          <Link
            className="syt-btn-view-assets"
            href={`/project/${projectId}/assets?system=${system.id}`}
            title="View Assets in this System"
          >
            Assets
          </Link>
          <div className="syt-actions">
            <button
              className="syt-btn-icon"
              title={membersExpanded ? 'Hide members' : 'Show members'}
              onClick={() => toggleMembers(system.id)}
            >
              {membersExpanded ? '▲' : '▼'}
            </button>
            <button
              className="syt-btn-icon"
              title="Edit"
              onClick={() => { setEditingSystem(system); setShowForm(false) }}
            >
              ✎
            </button>
            <button
              className="syt-btn-icon syt-btn-danger"
              title="Delete"
              onClick={() => { setDeletingSystem(system); setDeleteError(null) }}
            >
              ✕
            </button>
          </div>
        </div>
        {membersExpanded && (
          <div style={{ marginLeft: 16, marginBottom: 8 }}>
            <SystemMembershipPicker
              projectId={projectId}
              systemId={system.id}
              onAdded={() => setMemberRefreshKey(k => k + 1)}
            />
            <SystemMemberList
              key={`${system.id}-${memberRefreshKey}`}
              projectId={projectId}
              systemId={system.id}
              onMembersChanged={() => setMemberRefreshKey(k => k + 1)}
            />
          </div>
        )}
        {children.map(child => renderSystem(child, depth + 1))}
      </div>
    )
  }

  const roots = systems.filter(s => s.parent_system_id === null)

  return (
    <>
      <style jsx>{`
        .syt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .syt-title { font-size: 1.125rem; font-weight: 600; color: var(--bp-text-primary); }
        .syt-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .syt-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .syt-name { flex: 1; font-size: 0.875rem; font-weight: 500; color: var(--bp-text-primary); }
        .syt-desc { font-size: 0.75rem; color: var(--bp-text-secondary); flex: 2; }
        .syt-actions { display: flex; gap: 4px; }
        .syt-btn-icon { background: transparent; border: none; cursor: pointer; color: var(--bp-text-secondary); font-size: 1rem; padding: 2px 6px; border-radius: 3px; }
        .syt-btn-icon:hover { background: var(--bp-bg-tertiary); }
        .syt-btn-danger { color: #ef4444; }
        .syt-btn-view-assets { font-size: 0.7rem; color: var(--bp-accent); text-decoration: none; padding: 2px 6px; border-radius: 3px; border: 1px solid var(--bp-accent); opacity: 0.7; }
        .syt-btn-view-assets:hover { opacity: 1; }
        .syt-empty { text-align: center; padding: 48px; color: var(--bp-text-secondary); font-size: 0.875rem; }
        .syt-error { color: var(--bp-error-text, #ef4444); font-size: 0.875rem; margin-bottom: 8px; }
        .syt-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .syt-modal { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 480px; width: 90%; }
        .syt-modal-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 16px; }
        .syt-spinner { text-align: center; padding: 48px; color: var(--bp-text-secondary); }
        .syt-delete-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .syt-delete-box { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 400px; width: 90%; }
        .syt-delete-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 8px; }
        .syt-delete-body { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 16px; }
        .syt-delete-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; margin-bottom: 12px; }
        .syt-delete-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .syt-btn-danger-fill { padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .syt-btn-danger-fill:disabled { opacity: 0.5; cursor: not-allowed; }
        .syt-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
      `}</style>

      <div>
        <div className="syt-header">
          <span className="syt-title">Systems</span>
          <button className="syt-btn-primary" onClick={() => { setShowForm(true); setEditingSystem(null) }}>
            + Add System
          </button>
        </div>

        {loadError && <div className="syt-error" role="alert">{loadError}</div>}

        {loading ? (
          <div className="syt-spinner">Loading…</div>
        ) : roots.length === 0 && !showForm ? (
          <div className="syt-empty">No systems yet. Add your first system above.</div>
        ) : (
          <div>
            {roots.map(s => renderSystem(s, 0))}
          </div>
        )}

        {(showForm || editingSystem) && (
          <div className="syt-modal-overlay">
            <div className="syt-modal">
              <div className="syt-modal-title">{editingSystem ? 'Edit System' : 'Add System'}</div>
              <SystemForm
                projectId={projectId}
                systems={systems}
                editingSystem={editingSystem}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {deletingSystem && (
          <div className="syt-delete-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete system">
            <div className="syt-delete-box">
              <div className="syt-delete-title">Delete &quot;{deletingSystem.name}&quot;?</div>
              <div className="syt-delete-body">
                This action cannot be undone. Systems with child systems or asset memberships cannot be deleted.
              </div>
              {deleteError && <div className="syt-delete-error" role="alert">{deleteError}</div>}
              <div className="syt-delete-actions">
                <button className="syt-btn-ghost" onClick={() => { setDeletingSystem(null); setDeleteError(null) }} disabled={deleting}>Cancel</button>
                <button className="syt-btn-danger-fill" onClick={handleDeleteConfirm} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

interface AssetFormProps {
  projectId: string
  assets: Asset[]
  assetTypes: AssetType[]
  spaces: Space[]
  editingAsset?: Asset | null
  onSuccess: () => void
  onCancel: () => void
}

export function AssetForm({ projectId, assets, assetTypes, spaces, editingAsset, onSuccess, onCancel }: AssetFormProps) {
  const [tag, setTag] = useState(editingAsset?.tag ?? '')
  const [name, setName] = useState(editingAsset?.name ?? '')
  const [assetTypeId, setAssetTypeId] = useState(editingAsset?.asset_type_id ?? '')
  const [parentAssetId, setParentAssetId] = useState(editingAsset?.parent_asset_id ?? '')
  const [spaceId, setSpaceId] = useState(editingAsset?.space_id ?? '')
  const [manufacturer, setManufacturer] = useState(editingAsset?.manufacturer ?? '')
  const [model, setModel] = useState(editingAsset?.model ?? '')
  const [serial, setSerial] = useState(editingAsset?.serial ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagReuseConfirm, setTagReuseConfirm] = useState(false)

  const tagValid = tag.trim().length > 0
  const typeValid = assetTypeId.length > 0

  const parentAssetOptions = assets.filter(a => {
    if (!editingAsset) return a.status === 'active'
    return a.status === 'active' && a.id !== editingAsset.id
  })

  const retiredWithSameTag = assets.find(
    a => a.tag === tag.trim() && a.status === 'retired' && (!editingAsset || a.id !== editingAsset.id)
  )

  const canSubmit = tagValid && typeValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    if (!editingAsset && retiredWithSameTag && !tagReuseConfirm) {
      setTagReuseConfirm(true)
      return
    }

    setSubmitting(true)
    setError(null)
    setTagReuseConfirm(false)
    try {
      const params = {
        tag: tag.trim(),
        name: name.trim() || null,
        asset_type_id: assetTypeId,
        parent_asset_id: parentAssetId || null,
        space_id: spaceId || null,
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        serial: serial.trim() || null,
      }
      if (editingAsset) {
        await updateAsset(projectId, editingAsset.id, params)
      } else {
        await createAsset(projectId, params)
      }
      onSuccess()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      if (e.status === 400 || e.status === 409) {
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
        .af-form { display: flex; flex-direction: column; gap: 16px; }
        .af-row { display: flex; gap: 12px; }
        .af-row .af-field { flex: 1; }
        .af-field { display: flex; flex-direction: column; gap: 4px; }
        .af-label { font-size: 0.75rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .af-input, .af-select { padding: 8px 12px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
        .af-input:focus, .af-select:focus { outline: none; border-color: var(--bp-accent); }
        .af-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; }
        .af-warn { font-size: 0.75rem; color: #d97706; padding: 8px 12px; background: #fef3c7; border-radius: 4px; }
        .af-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
        .af-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .af-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .af-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
        .af-btn-warn { padding: 8px 16px; background: #d97706; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
      `}</style>
      <form className="af-form" onSubmit={handleSubmit}>
        <div className="af-row">
          <div className="af-field">
            <label className="af-label">Tag *</label>
            <input
              className="af-input"
              type="text"
              value={tag}
              onChange={e => { setTag(e.target.value); setTagReuseConfirm(false) }}
              placeholder="e.g. AHU-01"
              required
            />
          </div>
          <div className="af-field">
            <label className="af-label">Name</label>
            <input
              className="af-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Optional display name"
            />
          </div>
        </div>
        <div className="af-field">
          <label className="af-label">Asset Type *</label>
          <select
            className="af-select"
            value={assetTypeId}
            onChange={e => setAssetTypeId(e.target.value)}
            required
          >
            <option value="">— Select type —</option>
            {assetTypes.map(at => (
              <option key={at.id} value={at.id}>{at.name}</option>
            ))}
          </select>
        </div>
        <div className="af-field">
          <label className="af-label">Parent Asset</label>
          <select
            className="af-select"
            value={parentAssetId}
            onChange={e => setParentAssetId(e.target.value)}
          >
            <option value="">— None (top-level) —</option>
            {parentAssetOptions.map(a => (
              <option key={a.id} value={a.id}>{a.tag}{a.name ? ` — ${a.name}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="af-field">
          <label className="af-label">Space</label>
          <select
            className="af-select"
            value={spaceId}
            onChange={e => setSpaceId(e.target.value)}
          >
            <option value="">— No space —</option>
            {spaces.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.kind})</option>
            ))}
          </select>
        </div>
        <div className="af-row">
          <div className="af-field">
            <label className="af-label">Manufacturer</label>
            <input className="af-input" type="text" value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="Optional" />
          </div>
          <div className="af-field">
            <label className="af-label">Model</label>
            <input className="af-input" type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Optional" />
          </div>
          <div className="af-field">
            <label className="af-label">Serial</label>
            <input className="af-input" type="text" value={serial} onChange={e => setSerial(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        {retiredWithSameTag && tagReuseConfirm && (
          <div className="af-warn" role="alert">
            A retired asset with tag &quot;{tag.trim()}&quot; already exists. Confirm to reuse this tag.
          </div>
        )}
        {error && <div className="af-error" role="alert">{error}</div>}
        <div className="af-actions">
          <button type="button" className="af-btn-ghost" onClick={onCancel}>Cancel</button>
          {retiredWithSameTag && tagReuseConfirm ? (
            <button type="submit" className="af-btn-warn" disabled={!canSubmit}>
              {submitting ? 'Saving…' : 'Confirm & Create'}
            </button>
          ) : (
            <button type="submit" className="af-btn-primary" disabled={!canSubmit}>
              {submitting ? 'Saving…' : editingAsset ? 'Save' : 'Create'}
            </button>
          )}
        </div>
      </form>
    </>
  )
}

interface PointFormProps {
  projectId: string
  assetId: string
  existingTags: string[]
  editingPoint?: Point | null
  onSuccess: () => void
  onCancel: () => void
}

export function PointForm({ projectId, assetId, existingTags, editingPoint, onSuccess, onCancel }: PointFormProps) {
  const [tag, setTag] = useState(editingPoint?.tag ?? '')
  const [description, setDescription] = useState(editingPoint?.description ?? '')
  const [signalType, setSignalType] = useState<SignalType | ''>(editingPoint?.signal_type ?? '')
  const [rangeLow, setRangeLow] = useState(editingPoint?.range_low != null ? String(editingPoint.range_low) : '')
  const [rangeHigh, setRangeHigh] = useState(editingPoint?.range_high != null ? String(editingPoint.range_high) : '')
  const [engUnits, setEngUnits] = useState(editingPoint?.engineering_units ?? '')
  const [lastCal, setLastCal] = useState(editingPoint?.last_cal_date ?? '')
  const [calDue, setCalDue] = useState(editingPoint?.cal_due_date ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tagValid = tag.trim().length > 0
  const tagDuplicate = !editingPoint && existingTags.includes(tag.trim())
  const rangeLowNum = rangeLow !== '' ? parseFloat(rangeLow) : null
  const rangeHighNum = rangeHigh !== '' ? parseFloat(rangeHigh) : null
  const rangeValid = rangeLowNum === null || rangeHighNum === null || rangeLowNum <= rangeHighNum
  const canSubmit = tagValid && !tagDuplicate && rangeValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const params = {
        tag: tag.trim(),
        description: description.trim() || null,
        signal_type: (signalType || null) as SignalType | null,
        range_low: rangeLowNum,
        range_high: rangeHighNum,
        engineering_units: engUnits.trim() || null,
        last_cal_date: lastCal.trim() || null,
        cal_due_date: calDue.trim() || null,
      }
      if (editingPoint) {
        const { updatePoint } = await import('./api')
        await updatePoint(projectId, assetId, editingPoint.id, params)
      } else {
        await createPoint(projectId, assetId, params)
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
        .pf-form { display: flex; flex-direction: column; gap: 12px; }
        .pf-row { display: flex; gap: 10px; }
        .pf-row .pf-field { flex: 1; }
        .pf-field { display: flex; flex-direction: column; gap: 3px; }
        .pf-label { font-size: 0.7rem; font-weight: 500; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .pf-input, .pf-select { padding: 6px 10px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.8rem; width: 100%; box-sizing: border-box; }
        .pf-input:focus, .pf-select:focus { outline: none; border-color: var(--bp-accent); }
        .pf-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 6px 10px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; }
        .pf-hint-warn { font-size: 0.7rem; color: #d97706; }
        .pf-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
        .pf-btn-primary { padding: 6px 14px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 500; }
        .pf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .pf-btn-ghost { padding: 6px 14px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
      `}</style>
      <form className="pf-form" onSubmit={handleSubmit}>
        <div className="pf-row">
          <div className="pf-field">
            <label className="pf-label">Tag *</label>
            <input
              className="pf-input"
              type="text"
              value={tag}
              onChange={e => setTag(e.target.value)}
              placeholder="e.g. TT-01"
              required
            />
            {tagDuplicate && <span className="pf-hint-warn">Tag already exists on this asset.</span>}
          </div>
          <div className="pf-field">
            <label className="pf-label">Signal Type</label>
            <select
              className="pf-select"
              value={signalType}
              onChange={e => setSignalType(e.target.value as SignalType | '')}
            >
              <option value="">— None —</option>
              {SIGNAL_TYPES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="pf-field">
          <label className="pf-label">Description</label>
          <input
            className="pf-input"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        <div className="pf-row">
          <div className="pf-field">
            <label className="pf-label">Range Low</label>
            <input
              className="pf-input"
              type="number"
              value={rangeLow}
              onChange={e => setRangeLow(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="pf-field">
            <label className="pf-label">Range High</label>
            <input
              className="pf-input"
              type="number"
              value={rangeHigh}
              onChange={e => setRangeHigh(e.target.value)}
              placeholder="Optional"
            />
            {!rangeValid && <span className="pf-hint-warn">Range low must be ≤ range high.</span>}
          </div>
          <div className="pf-field">
            <label className="pf-label">Eng. Units</label>
            <input
              className="pf-input"
              type="text"
              value={engUnits}
              onChange={e => setEngUnits(e.target.value)}
              placeholder="e.g. °C"
            />
          </div>
        </div>
        <div className="pf-row">
          <div className="pf-field">
            <label className="pf-label">Last Cal Date</label>
            <input
              className="pf-input"
              type="date"
              value={lastCal}
              onChange={e => setLastCal(e.target.value)}
            />
          </div>
          <div className="pf-field">
            <label className="pf-label">Cal Due Date</label>
            <input
              className="pf-input"
              type="date"
              value={calDue}
              onChange={e => setCalDue(e.target.value)}
            />
          </div>
        </div>
        {error && <div className="pf-error" role="alert">{error}</div>}
        <div className="pf-actions">
          <button type="button" className="pf-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="pf-btn-primary" disabled={!canSubmit}>
            {submitting ? 'Saving…' : editingPoint ? 'Save' : 'Add Point'}
          </button>
        </div>
      </form>
    </>
  )
}

interface PointListProps {
  projectId: string
  assetId: string
}

export function PointList({ projectId, assetId }: PointListProps) {
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPoint, setEditingPoint] = useState<Point | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listPointsForAsset(projectId, assetId)
      setPoints(data)
    } catch {
      setLoadError('Failed to load points.')
    } finally {
      setLoading(false)
    }
  }, [projectId, assetId])

  useEffect(() => { load() }, [load])

  function handleFormSuccess() {
    setShowForm(false)
    setEditingPoint(null)
    load()
  }

  async function handleDeleteConfirm(pointId: string) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePoint(projectId, assetId, pointId)
      setConfirmDeleteId(null)
      load()
    } catch (err: unknown) {
      const e = err as { body?: { detail?: string } }
      setDeleteError(e.body?.detail ?? 'Failed to delete point.')
    } finally {
      setDeleting(false)
    }
  }

  const existingTags = points.map(p => p.tag)

  return (
    <>
      <style jsx>{`
        .pl-section { margin-top: 20px; border-top: 1px solid var(--bp-border); padding-top: 16px; }
        .pl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .pl-title { font-size: 0.875rem; font-weight: 600; color: var(--bp-text-primary); }
        .pl-btn-add { padding: 4px 12px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 500; }
        .pl-row { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--bp-bg-secondary); border-radius: 4px; margin-bottom: 3px; font-size: 0.8rem; }
        .pl-tag { font-family: monospace; font-weight: 600; color: var(--bp-text-primary); min-width: 80px; }
        .pl-signal { font-size: 0.7rem; background: var(--bp-bg-tertiary); color: var(--bp-text-secondary); padding: 1px 5px; border-radius: 3px; }
        .pl-desc { flex: 1; color: var(--bp-text-secondary); }
        .pl-btn-icon { background: transparent; border: none; cursor: pointer; color: var(--bp-text-secondary); font-size: 0.9rem; padding: 2px 5px; border-radius: 3px; }
        .pl-btn-icon:hover { background: var(--bp-bg-tertiary); }
        .pl-btn-danger { color: #ef4444; }
        .pl-empty { font-size: 0.8rem; color: var(--bp-text-secondary); padding: 8px 0; text-align: center; }
        .pl-spinner { font-size: 0.8rem; color: var(--bp-text-secondary); text-align: center; padding: 8px 0; }
        .pl-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); margin-bottom: 6px; }
        .pl-confirm { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #fee2e2; border-radius: 4px; margin-bottom: 3px; font-size: 0.8rem; }
        .pl-confirm-msg { flex: 1; color: var(--bp-text-primary); }
        .pl-confirm-yes { padding: 3px 8px; background: #ef4444; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75rem; }
        .pl-confirm-yes:disabled { opacity: 0.5; }
        .pl-confirm-no { padding: 3px 8px; background: transparent; border: 1px solid var(--bp-border); border-radius: 3px; cursor: pointer; font-size: 0.75rem; color: var(--bp-text-secondary); }
        .pl-form-wrap { background: var(--bp-bg-secondary); border-radius: 4px; padding: 12px; margin-bottom: 10px; }
        .pl-form-title { font-size: 0.8rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 8px; }
      `}</style>
      <div className="pl-section">
        <div className="pl-header">
          <span className="pl-title">Points</span>
          {!showForm && !editingPoint && (
            <button className="pl-btn-add" onClick={() => setShowForm(true)}>+ Add Point</button>
          )}
        </div>

        {(showForm || editingPoint) && (
          <div className="pl-form-wrap">
            <div className="pl-form-title">{editingPoint ? 'Edit Point' : 'Add Point'}</div>
            <PointForm
              projectId={projectId}
              assetId={assetId}
              existingTags={editingPoint ? existingTags.filter(t => t !== editingPoint.tag) : existingTags}
              editingPoint={editingPoint}
              onSuccess={handleFormSuccess}
              onCancel={() => { setShowForm(false); setEditingPoint(null) }}
            />
          </div>
        )}

        {loadError && <div className="pl-error" role="alert">{loadError}</div>}
        {deleteError && <div className="pl-error" role="alert">{deleteError}</div>}

        {loading ? (
          <div className="pl-spinner">Loading points…</div>
        ) : points.length === 0 && !showForm ? (
          <div className="pl-empty">No points yet.</div>
        ) : (
          points.map(point => (
            confirmDeleteId === point.id ? (
              <div key={point.id} className="pl-confirm">
                <span className="pl-confirm-msg">Delete point &quot;{point.tag}&quot;?</span>
                <button
                  className="pl-confirm-yes"
                  onClick={() => handleDeleteConfirm(point.id)}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
                <button className="pl-confirm-no" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div key={point.id} className="pl-row">
                <span className="pl-tag">{point.tag}</span>
                {point.signal_type && <span className="pl-signal">{point.signal_type}</span>}
                <span className="pl-desc">{point.description ?? ''}</span>
                <button
                  className="pl-btn-icon"
                  title="Edit"
                  onClick={() => { setEditingPoint(point); setShowForm(false) }}
                >
                  ✎
                </button>
                <button
                  className="pl-btn-icon pl-btn-danger"
                  title="Delete"
                  onClick={() => { setConfirmDeleteId(point.id); setDeleteError(null) }}
                >
                  ✕
                </button>
              </div>
            )
          ))
        )}
      </div>
    </>
  )
}

interface AssetDetailProps {
  projectId: string
  asset: Asset
  assetType: AssetType | undefined
  space: Space | undefined
  onClose: () => void
  onRetire: () => void
  onDecommission: () => void
  onDelete: () => void
  onEdit: () => void
}

export function AssetDetail({ projectId, asset, assetType, space, onClose, onRetire, onDecommission, onDelete, onEdit }: AssetDetailProps) {
  return (
    <>
      <style jsx>{`
        .ad-wrap { padding: 0; }
        .ad-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .ad-tag { font-size: 1.25rem; font-weight: 700; color: var(--bp-text-primary); font-family: monospace; }
        .ad-status { font-size: 0.7rem; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; font-weight: 600; }
        .ad-status-active { background: #d1fae5; color: #065f46; }
        .ad-status-retired { background: #fef3c7; color: #92400e; }
        .ad-status-decommissioned { background: #fee2e2; color: #991b1b; }
        .ad-name { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 12px; }
        .ad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 16px; }
        .ad-kv { display: flex; flex-direction: column; gap: 2px; }
        .ad-key { font-size: 0.7rem; text-transform: uppercase; color: var(--bp-text-secondary); letter-spacing: 0.05em; }
        .ad-val { font-size: 0.875rem; color: var(--bp-text-primary); }
        .ad-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ad-btn-edit { padding: 6px 14px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .ad-btn-retire { padding: 6px 14px; background: #d97706; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .ad-btn-decommission { padding: 6px 14px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .ad-btn-delete { padding: 6px 14px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .ad-btn-close { padding: 6px 14px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: auto; }
      `}</style>
      <div className="ad-wrap">
        <div className="ad-header">
          <span className="ad-tag">{asset.tag}</span>
          <span className={`ad-status ad-status-${asset.status}`}>{asset.status}</span>
        </div>
        {asset.name && <div className="ad-name">{asset.name}</div>}
        <div className="ad-grid">
          <div className="ad-kv">
            <span className="ad-key">Asset Type</span>
            <span className="ad-val">{assetType?.name ?? asset.asset_type_id}</span>
          </div>
          <div className="ad-kv">
            <span className="ad-key">Space</span>
            <span className="ad-val">{space ? `${space.name} (${space.kind})` : '—'}</span>
          </div>
          {asset.manufacturer && (
            <div className="ad-kv">
              <span className="ad-key">Manufacturer</span>
              <span className="ad-val">{asset.manufacturer}</span>
            </div>
          )}
          {asset.model && (
            <div className="ad-kv">
              <span className="ad-key">Model</span>
              <span className="ad-val">{asset.model}</span>
            </div>
          )}
          {asset.serial && (
            <div className="ad-kv">
              <span className="ad-key">Serial</span>
              <span className="ad-val">{asset.serial}</span>
            </div>
          )}
        </div>
        <div className="ad-actions">
          {asset.status === 'active' && (
            <button className="ad-btn-edit" onClick={onEdit}>Edit</button>
          )}
          {asset.status === 'active' && (
            <button className="ad-btn-retire" onClick={onRetire}>Retire…</button>
          )}
          {asset.status !== 'decommissioned' && (
            <button className="ad-btn-decommission" onClick={onDecommission}>Decommission…</button>
          )}
          <button className="ad-btn-delete" onClick={onDelete}>Delete…</button>
          <button className="ad-btn-close" onClick={onClose}>Close</button>
        </div>
        <PointList projectId={projectId} assetId={asset.id} />
        <InstanceList projectId={projectId} assetId={asset.id} />
      </div>
    </>
  )
}

interface AssetListProps {
  projectId: string
  onRowClick?: (asset: Asset) => void
  externalFilters?: AssetFilters
  onFilterChange?: (key: FilterKey, value: string) => void
}

export function AssetList({ projectId, onRowClick, externalFilters, onFilterChange }: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [localStatusFilter, setLocalStatusFilter] = useState<AssetStatus | ''>('active')
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showRetireConfirm, setShowRetireConfirm] = useState<Asset | null>(null)
  const [retiring, setRetiring] = useState(false)
  const [showDecommissionConfirm, setShowDecommissionConfirm] = useState<Asset | null>(null)
  const [decommissioning, setDecommissioning] = useState(false)
  const [retireInstead, setRetireInstead] = useState(false)
  const [allAssets, setAllAssets] = useState<Asset[]>([])

  const statusFilter = externalFilters !== undefined
    ? (externalFilters.status ?? 'active')
    : localStatusFilter

  const spaceFilter = externalFilters?.space ?? ''
  const systemFilter = externalFilters?.system ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const apiFilters: Parameters<typeof listAssets>[1] = {}
      if (statusFilter) apiFilters.status = statusFilter as AssetStatus
      if (spaceFilter) apiFilters.space_id = spaceFilter
      if (systemFilter) apiFilters.system_id = systemFilter
      const [atData, spData, allData] = await Promise.all([
        listAssetTypes(projectId),
        listSpaces(projectId),
        listAssets(projectId, apiFilters),
      ])
      setAssetTypes(atData)
      setSpaces(spData)
      setAllAssets(allData)
      setAssets(allData)
    } catch {
      setLoadError('Failed to load assets.')
    } finally {
      setLoading(false)
    }
  }, [projectId, statusFilter, spaceFilter, systemFilter])

  useEffect(() => { load() }, [load])

  function handleFormSuccess() {
    setShowForm(false)
    setEditingAsset(null)
    load()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingAsset(null)
  }

  async function handleDeleteConfirm() {
    if (!deletingAsset) return
    setDeleting(true)
    setDeleteError(null)
    setRetireInstead(false)
    try {
      await deleteAsset(projectId, deletingAsset.id)
      setDeletingAsset(null)
      setSelectedAsset(null)
      load()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: { next_action?: string } } }
      if (e.status === 409 && e.body?.detail?.next_action === 'retire') {
        setRetireInstead(true)
        setDeleteError('This asset has references and cannot be hard-deleted. You can retire it instead.')
      } else {
        setDeleteError('Unexpected error. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  async function handleRetireInstead() {
    if (!deletingAsset) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await retireAsset(projectId, deletingAsset.id)
      setDeletingAsset(null)
      setSelectedAsset(null)
      load()
    } catch (err: unknown) {
      const e = err as { body?: { detail?: string } }
      setDeleteError(e.body?.detail ?? 'Failed to retire asset.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRetireConfirm() {
    if (!showRetireConfirm) return
    setRetiring(true)
    try {
      await retireAsset(projectId, showRetireConfirm.id)
      setShowRetireConfirm(null)
      setSelectedAsset(null)
      load()
    } catch {
      // ignore — asset may already be retired
    } finally {
      setRetiring(false)
    }
  }

  async function handleDecommissionConfirm() {
    if (!showDecommissionConfirm) return
    setDecommissioning(true)
    try {
      await decommissionAsset(projectId, showDecommissionConfirm.id)
      setShowDecommissionConfirm(null)
      setSelectedAsset(null)
      load()
    } catch {
      // ignore
    } finally {
      setDecommissioning(false)
    }
  }

  const filteredAssets = assets

  return (
    <>
      <style jsx>{`
        .al-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .al-title { font-size: 1.125rem; font-weight: 600; color: var(--bp-text-primary); }
        .al-controls { display: flex; gap: 8px; align-items: center; }
        .al-filter-select { padding: 6px 10px; background: var(--bp-bg-secondary); border: 1px solid var(--bp-border); border-radius: 4px; color: var(--bp-text-primary); font-size: 0.8rem; }
        .al-btn-primary { padding: 8px 16px; background: var(--bp-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .al-row { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; cursor: pointer; }
        .al-row:hover { background: var(--bp-bg-tertiary); }
        .al-tag { font-family: monospace; font-size: 0.875rem; font-weight: 600; color: var(--bp-text-primary); min-width: 100px; }
        .al-name { flex: 1; font-size: 0.875rem; color: var(--bp-text-secondary); }
        .al-type { font-size: 0.75rem; color: var(--bp-text-secondary); min-width: 80px; }
        .al-status { font-size: 0.65rem; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
        .al-status-active { background: #d1fae5; color: #065f46; }
        .al-status-retired { background: #fef3c7; color: #92400e; }
        .al-status-decommissioned { background: #fee2e2; color: #991b1b; }
        .al-empty { text-align: center; padding: 48px; color: var(--bp-text-secondary); font-size: 0.875rem; }
        .al-error { color: var(--bp-error-text, #ef4444); font-size: 0.875rem; margin-bottom: 8px; }
        .al-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .al-modal { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 560px; width: 90%; max-height: 90vh; overflow-y: auto; }
        .al-modal-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 16px; }
        .al-spinner { text-align: center; padding: 48px; color: var(--bp-text-secondary); }
        .al-delete-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .al-delete-box { background: var(--bp-bg-primary, #fff); border-radius: 8px; padding: 24px; max-width: 420px; width: 90%; }
        .al-delete-title { font-size: 1rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 8px; }
        .al-delete-body { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 16px; }
        .al-delete-warn { font-size: 0.8rem; color: #92400e; background: #fef3c7; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; }
        .al-delete-error { font-size: 0.75rem; color: var(--bp-error-text, #ef4444); padding: 8px 12px; background: var(--bp-error-bg, #fee2e2); border-radius: 4px; margin-bottom: 12px; }
        .al-delete-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
        .al-btn-danger { padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .al-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .al-btn-warn { padding: 8px 16px; background: #d97706; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .al-btn-warn:disabled { opacity: 0.5; cursor: not-allowed; }
        .al-btn-ghost { padding: 8px 16px; background: transparent; color: var(--bp-text-secondary); border: 1px solid var(--bp-border); border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
        .al-confirm-body { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 16px; }
        .al-confirm-warn { font-size: 0.8rem; color: #7c3aed; background: #ede9fe; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; }
      `}</style>

      <div>
        <div className="al-header">
          <span className="al-title">Assets</span>
          <div className="al-controls">
            <select
              className="al-filter-select"
              value={statusFilter}
              onChange={e => {
                const val = e.target.value as AssetStatus | ''
                if (externalFilters !== undefined && onFilterChange) {
                  onFilterChange('status', val)
                } else {
                  setLocalStatusFilter(val)
                }
              }}
            >
              <option value="active">Active</option>
              <option value="retired">Retired</option>
              <option value="decommissioned">Decommissioned</option>
              <option value="">All</option>
            </select>
            <button className="al-btn-primary" onClick={() => { setShowForm(true); setEditingAsset(null) }}>
              + Add Asset
            </button>
          </div>
        </div>

        {loadError && <div className="al-error" role="alert">{loadError}</div>}

        {loading ? (
          <div className="al-spinner">Loading…</div>
        ) : filteredAssets.length === 0 && !showForm ? (
          <div className="al-empty">No assets{statusFilter ? ` with status "${statusFilter}"` : ''} yet.</div>
        ) : (
          <div>
            {filteredAssets.map(asset => {
              const at = assetTypes.find(t => t.id === asset.asset_type_id)
              return (
                <div key={asset.id} className="al-row" onClick={() => onRowClick ? onRowClick(asset) : setSelectedAsset(asset)}>
                  <span className="al-tag">{asset.tag}</span>
                  <span className="al-name">{asset.name ?? ''}</span>
                  <span className="al-type">{at?.name ?? ''}</span>
                  <span className={`al-status al-status-${asset.status}`}>{asset.status}</span>
                </div>
              )
            })}
          </div>
        )}

        {(showForm || editingAsset) && (
          <div className="al-modal-overlay">
            <div className="al-modal">
              <div className="al-modal-title">{editingAsset ? 'Edit Asset' : 'Add Asset'}</div>
              <AssetForm
                projectId={projectId}
                assets={allAssets}
                assetTypes={assetTypes}
                spaces={spaces}
                editingAsset={editingAsset}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {selectedAsset && !showForm && !editingAsset && !deletingAsset && !showRetireConfirm && !showDecommissionConfirm && (
          <div className="al-modal-overlay">
            <div className="al-modal">
              <div className="al-modal-title">Asset Detail</div>
              <AssetDetail
                projectId={projectId}
                asset={selectedAsset}
                assetType={assetTypes.find(t => t.id === selectedAsset.asset_type_id)}
                space={spaces.find(s => s.id === selectedAsset.space_id)}
                onClose={() => setSelectedAsset(null)}
                onEdit={() => { setEditingAsset(selectedAsset); setSelectedAsset(null) }}
                onRetire={() => { setShowRetireConfirm(selectedAsset); setSelectedAsset(null) }}
                onDecommission={() => { setShowDecommissionConfirm(selectedAsset); setSelectedAsset(null) }}
                onDelete={() => { setDeletingAsset(selectedAsset); setSelectedAsset(null); setDeleteError(null); setRetireInstead(false) }}
              />
            </div>
          </div>
        )}

        {showRetireConfirm && (
          <div className="al-delete-overlay" role="dialog" aria-modal="true" aria-label="Confirm retire asset">
            <div className="al-delete-box">
              <div className="al-delete-title">Retire &quot;{showRetireConfirm.tag}&quot;?</div>
              <div className="al-confirm-warn">
                Retiring preserves the audit trail. The asset will remain in the database with status &quot;retired&quot;.
              </div>
              <div className="al-confirm-body">
                This action cannot be undone.
              </div>
              <div className="al-delete-actions">
                <button className="al-btn-ghost" onClick={() => setShowRetireConfirm(null)} disabled={retiring}>Cancel</button>
                <button className="al-btn-warn" onClick={handleRetireConfirm} disabled={retiring}>
                  {retiring ? 'Retiring…' : 'Retire'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDecommissionConfirm && (
          <div className="al-delete-overlay" role="dialog" aria-modal="true" aria-label="Confirm decommission asset">
            <div className="al-delete-box">
              <div className="al-delete-title">Decommission &quot;{showDecommissionConfirm.tag}&quot;?</div>
              <div className="al-confirm-warn" style={{ color: '#6d28d9', background: '#ede9fe' }}>
                Decommissioning preserves the audit trail. The asset will remain with status &quot;decommissioned&quot;.
              </div>
              <div className="al-confirm-body">
                This action cannot be undone.
              </div>
              <div className="al-delete-actions">
                <button className="al-btn-ghost" onClick={() => setShowDecommissionConfirm(null)} disabled={decommissioning}>Cancel</button>
                <button className="al-btn-danger" style={{ background: '#7c3aed' }} onClick={handleDecommissionConfirm} disabled={decommissioning}>
                  {decommissioning ? 'Decommissioning…' : 'Decommission'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingAsset && (
          <div className="al-delete-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete asset">
            <div className="al-delete-box">
              <div className="al-delete-title">Delete &quot;{deletingAsset.tag}&quot;?</div>
              <div className="al-delete-body">
                Attempting hard delete. If the asset has references, you will be offered a retire option instead.
              </div>
              {deleteError && <div className="al-delete-error" role="alert">{deleteError}</div>}
              <div className="al-delete-actions">
                <button className="al-btn-ghost" onClick={() => { setDeletingAsset(null); setDeleteError(null); setRetireInstead(false) }} disabled={deleting}>Cancel</button>
                {retireInstead ? (
                  <button className="al-btn-warn" onClick={handleRetireInstead} disabled={deleting}>
                    {deleting ? 'Retiring…' : 'Retire instead'}
                  </button>
                ) : (
                  <button className="al-btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
