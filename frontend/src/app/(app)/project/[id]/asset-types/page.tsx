'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  listAssetTypes,
  createAssetType,
  updateAssetType,
  deleteAssetType,
  type AssetType,
} from '@/contexts/asset_registry/api'
import {
  WFrame,
  WH,
  WT,
  WBtn,
  WSectionLabel,
  WSkeleton,
  WEmpty,
  WBox,
} from '@/lib/frontend-kit'

function AssetTypesContent({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAt, setEditingAt] = useState<AssetType | null>(null)
  const [deletingAt, setDeletingAt] = useState<AssetType | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listAssetTypes(projectId)
    setAssetTypes(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditingAt(null)
    setFormName('')
    setFormDesc('')
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (at: AssetType) => {
    setEditingAt(at)
    setFormName(at.name)
    setFormDesc(at.description ?? '')
    setFormError('')
    setShowForm(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Name is required'); return }
    setFormSaving(true)
    setFormError('')
    try {
      if (editingAt) {
        await updateAssetType(projectId, editingAt.id, { name: formName.trim(), description: formDesc.trim() || null })
      } else {
        await createAssetType(projectId, { name: formName.trim(), description: formDesc.trim() || null })
      }
      setShowForm(false)
      load()
    } catch {
      setFormError('Failed to save asset type.')
    } finally {
      setFormSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAt) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAssetType(projectId, deletingAt.id)
      setDeletingAt(null)
      load()
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { detail?: string } }
      setDeleteError(e.status === 409 ? (e.body?.detail ?? 'Cannot delete: referenced by assets.') : 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-panel)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <WSectionLabel tone="primary">Setup</WSectionLabel>
          <WH size={22} style={{ marginTop: 4 }}>Asset Types</WH>
        </div>
        <WBtn tone="primary" onClick={openAdd}>+ Add Asset Type</WBtn>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {loading ? (
          <WBox style={{ padding: 0, overflow: 'hidden' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-line)', display: 'flex', gap: 16 }}>
                <WSkeleton width={160} />
                <WSkeleton width={240} />
              </div>
            ))}
          </WBox>
        ) : assetTypes.length === 0 ? (
          <WEmpty title="No asset types yet" subtitle="Add your first asset type using the button above." />
        ) : (
          <WBox style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 2fr auto',
              padding: '8px 16px',
              borderBottom: '1px solid var(--ui-line)',
              background: 'var(--ui-panel-2)',
            }}>
              {['Name', 'Description', ''].map(h => (
                <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
              ))}
            </div>
            {assetTypes.map((at, i) => (
              <div
                key={at.id}
                data-testid="asset-type-row"
                onClick={() => router.push(`/project/${projectId}/asset-types/${at.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 2fr auto',
                  padding: '10px 16px',
                  borderBottom: i < assetTypes.length - 1 ? '1px solid var(--ui-line)' : 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <WT size={13} weight={500}>{at.name}</WT>
                <WT size={12} color="ink-soft">{at.description ?? '—'}</WT>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button
                    title="Edit"
                    onClick={() => openEdit(at)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui-ink-soft)', fontSize: 14, padding: '2px 6px', borderRadius: 4 }}
                  >
                    ✎
                  </button>
                  <button
                    title="Delete"
                    onClick={() => { setDeletingAt(at); setDeleteError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui-warn)', fontSize: 14, padding: '2px 6px', borderRadius: 4 }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </WBox>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <WBox style={{ width: '100%', maxWidth: 440, padding: 24 }}>
            <WH size={15} style={{ marginBottom: 16 }}>{editingAt ? 'Edit Asset Type' : 'Add Asset Type'}</WH>
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: 12 }}>
                <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>Name *</WT>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ui-line-strong)', borderRadius: 6, fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>Description</WT>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ui-line-strong)', borderRadius: 6, fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              {formError && <WT size={12} color="warn" style={{ display: 'block', marginBottom: 10 }}>{formError}</WT>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <WBtn variant="ghost" onClick={() => setShowForm(false)} disabled={formSaving}>Cancel</WBtn>
                <WBtn tone="primary" disabled={formSaving}>{formSaving ? 'Saving…' : 'Save'}</WBtn>
              </div>
            </form>
          </WBox>
        </div>
      )}

      {deletingAt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <WBox style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <WH size={15} style={{ marginBottom: 8 }}>Delete asset type?</WH>
            <WT size={13} color="ink-soft" style={{ marginBottom: 16 }}>
              This will permanently delete <strong>{deletingAt.name}</strong>. This action cannot be undone.
            </WT>
            {deleteError && <WT size={12} color="warn" style={{ display: 'block', marginBottom: 12 }}>{deleteError}</WT>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <WBtn variant="ghost" onClick={() => setDeletingAt(null)} disabled={deleting}>Cancel</WBtn>
              <WBtn tone="warn" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</WBtn>
            </div>
          </WBox>
        </div>
      )}
    </WFrame>
  )
}

function AssetTypesPageInner() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/auth'); return }
      setReady(true)
    })
  }, [router])

  if (!ready) {
    return (
      <WFrame style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <WSkeleton width={200} />
      </WFrame>
    )
  }

  return <AssetTypesContent projectId={projectId} />
}

export default function AssetTypesPage() {
  return (
    <Suspense>
      <AssetTypesPageInner />
    </Suspense>
  )
}
