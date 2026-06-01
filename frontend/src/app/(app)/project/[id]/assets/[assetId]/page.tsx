'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getAsset,
  listAssets,
  listAssetTypes,
  listSpaces,
  listSystems,
  listSystemMembers,
  updateAsset,
  deleteAsset,
  retireAsset,
  decommissionAsset,
  type Asset,
  type AssetType,
  type Space,
  type System,
  type AssetStatus,
} from '@/contexts/asset_registry/api'
import { listInstances, listTemplates, type Instance, type Template } from '@/contexts/commissioning_execution/api'
import { derivePhase } from '@/contexts/asset_registry/derivePhase'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'
import {
  WFrame,
  WHeader,
  WPill,
  WT,
  WStamp,
  WH,
  WTabs,
  WKV,
  WKVGrid,
  WSkeleton,
  WEmpty,
  WBar,
  WBox,
  WBtn,
  PhaseTracker,
} from '@/lib/frontend-kit'

const STATUS_VARIANT: Record<AssetStatus, 'default' | 'ok' | 'amber' | 'warn'> = {
  active: 'ok',
  retired: 'amber',
  decommissioned: 'warn',
}

const PHASE_LABEL: Record<string, string> = {
  'pre-install': 'Pre-install',
  L2: 'L2 / Pre-functional',
  L3: 'L3 / Functional',
  L4: 'L4 / Functional Performance',
  L5: 'L5 / IST',
}

const TABS = ['Overview', 'Devices', 'Checklists', 'Tests', 'Linked'] as const
type TabName = typeof TABS[number]

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

function deriveCxProgress(instances: Instance[]): number {
  const active = instances.filter(i => i.status === 'in_progress' || i.status === 'complete')
  if (active.length === 0) return 0
  const done = instances.filter(i => i.status === 'complete').length
  return Math.round((done / instances.length) * 100)
}

interface KVRow {
  key: string
  value: string
}

interface InlineEditFieldProps {
  value: string | null
  onSave: (val: string | null) => Promise<void>
  placeholder?: string
  emptyDisplay?: string
}

function InlineEditField({ value, onSave, placeholder, emptyDisplay = '—' }: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(value ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const cancel = () => {
    setEditing(false)
    setDraft(value ?? '')
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(draft.trim() || null)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  if (editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <input
          ref={inputRef}
          style={{
            background: 'var(--bp-paper-2)',
            border: '1px solid var(--bp-blue)',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 13,
            color: 'var(--bp-ink)',
            outline: 'none',
            minWidth: 120,
          }}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={saving}
        />
        <button
          style={{ fontSize: 11, color: 'var(--bp-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
          onClick={cancel}
          title="Cancel (Esc)"
        >
          ✕
        </button>
      </span>
    )
  }

  return (
    <span
      style={{ cursor: 'pointer', borderBottom: '1px dashed var(--bp-line-softer)', paddingBottom: 1 }}
      onClick={startEdit}
      title="Click to edit"
    >
      {value ?? emptyDisplay}
    </span>
  )
}

interface NameplateEditorModalProps {
  initial: Record<string, unknown>
  onSave: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

function NameplateEditorModal({ initial, onSave, onClose }: NameplateEditorModalProps) {
  const [rows, setRows] = useState<KVRow[]>(
    Object.entries(initial).map(([k, v]) => ({ key: k, value: String(v) }))
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleEsc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const addRow = () => setRows(r => [...r, { key: '', value: '' }])
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'key' | 'value', val: string) => {
    setRows(r => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Record<string, unknown> = {}
      for (const row of rows) {
        if (row.key.trim()) data[row.key.trim()] = row.value
      }
      await onSave(data)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style jsx>{`
        .npm-modal { width: 100%; max-width: 480px; max-height: 80vh; overflow-y: auto; padding: 24px; }
        .npm-title { font-size: 15px; font-weight: 600; color: var(--bp-ink); margin: 0 0 16px 0; }
        .npm-kv-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; margin-bottom: 6px; align-items: center; }
        .npm-input { background: var(--bp-paper-2); border: 1px solid var(--bp-line-softer); border-radius: 6px; padding: 7px 10px; font-size: 13px; color: var(--bp-ink); outline: none; width: 100%; box-sizing: border-box; }
        .npm-input:focus { border-color: var(--bp-blue); }
        .npm-del { background: none; border: none; cursor: pointer; color: var(--bp-text-secondary); font-size: 16px; padding: 0 4px; line-height: 1; }
        .npm-del:hover { color: var(--bp-red, #e53e3e); }
        .npm-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
      `}</style>
      <WBox className="npm-modal">
        <p className="npm-title">Edit Nameplate Data</p>
        {rows.map((row, i) => (
          <div key={i} className="npm-kv-row">
            <input className="npm-input" value={row.key} onChange={e => updateRow(i, 'key', e.target.value)} placeholder="Key" />
            <input className="npm-input" value={row.value} onChange={e => updateRow(i, 'value', e.target.value)} placeholder="Value" />
            <button className="npm-del" onClick={() => removeRow(i)} title="Remove">×</button>
          </div>
        ))}
        <WPill variant="chip" style={{ cursor: 'pointer', marginTop: 4 }} onClick={addRow}>+ add row</WPill>
        <div className="npm-footer">
          <WBtn variant="ghost" onClick={onClose} disabled={saving}>Cancel</WBtn>
          <WBtn variant="blue" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</WBtn>
        </div>
      </WBox>
    </div>
  )
}

interface DeleteConfirmModalProps {
  assetTag: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeleteConfirmModal({ assetTag, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleEsc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onCancel])

  const handleConfirm = async () => {
    setDeleting(true)
    setError('')
    try {
      await onConfirm()
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e?.status === 409) {
        setError('This asset has references (child assets or test instances). Retire it instead.')
      } else {
        setError(e?.message ?? 'Failed to delete asset')
      }
      setDeleting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <style jsx>{`
        .dcm-modal { width: 100%; max-width: 400px; padding: 24px; }
        .dcm-title { font-size: 15px; font-weight: 600; color: var(--bp-ink); margin: 0 0 8px 0; }
        .dcm-body { font-size: 13px; color: var(--bp-text-secondary); margin: 0 0 16px 0; }
        .dcm-tag { font-weight: 600; color: var(--bp-ink); }
        .dcm-error { font-size: 12px; color: var(--bp-red, #e53e3e); margin-bottom: 12px; }
        .dcm-footer { display: flex; justify-content: flex-end; gap: 8px; }
      `}</style>
      <WBox className="dcm-modal">
        <p className="dcm-title">Delete asset?</p>
        <p className="dcm-body">
          This will permanently delete <span className="dcm-tag">{assetTag}</span>. This action cannot be undone.
        </p>
        {error && <div className="dcm-error">{error}</div>}
        <div className="dcm-footer">
          <WBtn variant="ghost" onClick={onCancel} disabled={deleting}>Cancel</WBtn>
          <WBtn variant="danger" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </WBtn>
        </div>
      </WBox>
    </div>
  )
}

interface AssetDetailContentProps {
  projectId: string
  assetId: string
}

function AssetDetailContent({ projectId, assetId }: AssetDetailContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as TabName) ?? 'Overview'

  const { setEntityLabel } = useBreadcrumbLabel()

  const [asset, setAsset] = useState<Asset | null>(null)
  const [assetType, setAssetType] = useState<AssetType | undefined>(undefined)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [parentAsset, setParentAsset] = useState<Asset | null>(null)
  const [childAssets, setChildAssets] = useState<Asset[]>([])
  const [systemMemberships, setSystemMemberships] = useState<System[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [templateMap, setTemplateMap] = useState<Map<string, Template>>(new Map())
  const [loading, setLoading] = useState(true)

  const [showOverflow, setShowOverflow] = useState(false)
  const [showNameplateEditor, setShowNameplateEditor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionError, setActionError] = useState('')

  const spaceMap = new Map(spaces.map(s => [s.id, s]))

  const load = useCallback(async () => {
    const [assetData, assetTypes, spacesData, allSystems, children, instancesData, templatesData] =
      await Promise.all([
        getAsset(projectId, assetId),
        listAssetTypes(projectId),
        listSpaces(projectId),
        listSystems(projectId, { include_descendants: true }),
        listAssets(projectId, { parent_asset_id: assetId }),
        listInstances(projectId, { asset_id: assetId }),
        listTemplates(projectId),
      ])

    setAsset(assetData)
    setEntityLabel(assetData.tag)
    setAssetType(assetTypes.find(t => t.id === assetData.asset_type_id))
    setSpaces(spacesData)
    setChildAssets(children)
    setInstances(instancesData)
    setTemplateMap(new Map(templatesData.map(t => [t.id, t])))

    if (assetData.parent_asset_id) {
      const parentData = await getAsset(projectId, assetData.parent_asset_id)
      setParentAsset(parentData)
    }

    const memberships: System[] = []
    await Promise.all(
      allSystems.map(async (sys) => {
        try {
          const members = await listSystemMembers(projectId, sys.id)
          if (members.some(m => m.id === assetId)) {
            memberships.push(sys)
          }
        } catch {
          // ignore per-system errors
        }
      })
    )
    setSystemMemberships(memberships)
    setLoading(false)
  }, [projectId, assetId, setEntityLabel])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      load()
    })
  }, [router, load])

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/project/${projectId}/assets/${assetId}?${params.toString()}`)
  }

  const patchAsset = useCallback(async (fields: Parameters<typeof updateAsset>[2]) => {
    if (!asset) return
    const optimistic = { ...asset, ...fields }
    setAsset(optimistic)
    try {
      const updated = await updateAsset(projectId, assetId, fields)
      setAsset(updated)
    } catch {
      setAsset(asset)
    }
  }, [asset, projectId, assetId])

  const handleRetire = async () => {
    setShowOverflow(false)
    setActionError('')
    try {
      const updated = await retireAsset(projectId, assetId)
      setAsset(updated)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setActionError(e?.message ?? 'Failed to retire asset')
    }
  }

  const handleDecommission = async () => {
    setShowOverflow(false)
    setActionError('')
    try {
      const updated = await decommissionAsset(projectId, assetId)
      setAsset(updated)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setActionError(e?.message ?? 'Failed to decommission asset')
    }
  }

  const handleDelete = async () => {
    await deleteAsset(projectId, assetId)
    router.push(`/project/${projectId}/assets`)
  }

  if (loading) {
    return (
      <WFrame variant="padded">
        <style jsx>{`
          .adp-hero { display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid var(--bp-line-softer); margin-bottom: 20px; }
          .adp-stamps { display: flex; gap: 6px; flex-wrap: wrap; }
          .adp-kpi-strip { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
          .adp-kpi-box { flex: 1; min-width: 120px; background: var(--bp-paper-2); border: 1px solid var(--bp-line-softer); border-radius: 8px; padding: 12px 14px; }
          .adp-panel { min-height: 200px; }
          .adp-list { display: flex; flex-direction: column; gap: 4px; }
          .adp-list-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--bp-line-softer); background: var(--bp-paper-1); cursor: pointer; }
          .adp-list-row:hover { background: var(--bp-paper-2); }
          .adp-instance-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--bp-line-softer); background: var(--bp-paper-1); }
          .adp-linked-section { margin-bottom: 16px; }
        `}</style>
        <WHeader
          crumbs={[
            { label: 'Project', onClick: () => router.push(`/project/${projectId}`) },
            { label: 'Assets', onClick: () => router.push(`/project/${projectId}/assets`) },
            { label: '…' },
          ]}
          title="Loading…"
        />
        <div className="adp-hero">
          <div className="adp-stamps">
            {[80, 60, 90, 70].map((w, i) => <WSkeleton key={i} width={w} height="22px" />)}
          </div>
          <WSkeleton width={240} height="28px" />
          <div style={{ display: 'flex', gap: 8 }}>
            {[60, 80, 90].map((w, i) => <WSkeleton key={i} width={w} height="22px" />)}
          </div>
        </div>
        <div className="adp-kpi-strip">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="adp-kpi-box">
              <WSkeleton width={40} height="24px" />
              <WSkeleton width={80} height="12px" />
            </div>
          ))}
        </div>
      </WFrame>
    )
  }

  if (!asset) {
    return (
      <WFrame variant="padded">
        <WEmpty title="Asset not found" subtitle="This asset may have been deleted." />
      </WFrame>
    )
  }

  const spacePath = buildSpacePath(asset.space_id, spaceMap)
  const currentSpace = asset.space_id ? spaceMap.get(asset.space_id) : undefined
  const phase = derivePhase(instances)
  const cxProgress = deriveCxProgress(instances)
  const doneCount = instances.filter(i => i.status === 'complete').length
  const checklists = instances.filter(i => i.level === 'L2')
  const tests = instances.filter(i => ['L3', 'L4', 'L5'].includes(i.level))

  const nameplateEntries = Object.entries(asset.nameplate_data ?? {})
  const scheduledDate = asset.nameplate_data?.scheduled_date as string | undefined

  return (
    <WFrame variant="padded">
      <style jsx>{`
        .adp-hero { display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid var(--bp-line-softer); margin-bottom: 20px; }
        .adp-stamps { display: flex; gap: 6px; flex-wrap: wrap; }
        .adp-title-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .adp-pills-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .adp-kpi-strip { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .adp-kpi-box { flex: 1; min-width: 120px; background: var(--bp-paper-2); border: 1px solid var(--bp-line-softer); border-radius: 8px; padding: 12px 14px; }
        .adp-kpi-val { font-size: 20px; font-weight: 700; color: var(--bp-ink); line-height: 1; }
        .adp-kpi-label { font-size: 11px; color: var(--bp-text-secondary); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .adp-panel { min-height: 200px; padding-top: 16px; }
        .adp-list { display: flex; flex-direction: column; gap: 6px; }
        .adp-list-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--bp-line-softer); background: var(--bp-paper-1); cursor: pointer; }
        .adp-list-row:hover { background: var(--bp-paper-2); }
        .adp-instance-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--bp-line-softer); background: var(--bp-paper-1); }
        .adp-linked-section { margin-bottom: 20px; }
        .adp-linked-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--bp-text-secondary); margin-bottom: 8px; }
        .adp-linked-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--bp-line-softer); background: var(--bp-paper-1); margin-bottom: 6px; cursor: pointer; }
        .adp-linked-row:hover { background: var(--bp-paper-2); }
        .adp-crumb-path { font-size: 12px; color: var(--bp-text-secondary); }
        .adp-inst-status { min-width: 80px; }
        .adp-timeline-empty { padding: 20px 0; }
        .adp-kpi-bar { margin-top: 6px; }
        .adp-kv-grid { margin-bottom: 24px; }
        .adp-header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .adp-overflow-btn { background: none; border: 1px solid var(--bp-line-softer); border-radius: 6px; cursor: pointer; color: var(--bp-text-secondary); padding: 4px 8px; font-size: 16px; line-height: 1; position: relative; }
        .adp-overflow-btn:hover { background: var(--bp-paper-2); }
        .adp-overflow-menu { position: absolute; top: 100%; right: 0; margin-top: 4px; background: var(--bp-paper-1); border: 1px solid var(--bp-line-softer); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); min-width: 180px; z-index: 100; padding: 4px; }
        .adp-overflow-item { display: block; width: 100%; text-align: left; background: none; border: none; border-radius: 6px; padding: 8px 12px; font-size: 13px; cursor: pointer; color: var(--bp-ink); }
        .adp-overflow-item:hover { background: var(--bp-paper-2); }
        .adp-overflow-item.danger { color: var(--bp-red, #e53e3e); }
        .adp-action-error { font-size: 12px; color: var(--bp-red, #e53e3e); margin-bottom: 8px; }
      `}</style>

      <div className="adp-header-row">
        <div style={{ flex: 1 }}>
          <WHeader
            crumbs={[
              { label: 'Project', onClick: () => router.push(`/project/${projectId}`) },
              { label: 'Assets', onClick: () => router.push(`/project/${projectId}/assets`) },
              { label: asset.tag },
            ]}
            title={asset.tag}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="adp-overflow-btn"
            onClick={() => setShowOverflow(v => !v)}
            title="More actions"
          >
            ⋯
          </button>
          {showOverflow && (
            <div className="adp-overflow-menu">
              <button className="adp-overflow-item" onClick={handleRetire}>Retire</button>
              <button className="adp-overflow-item" onClick={handleDecommission}>Decommission</button>
              <button className="adp-overflow-item danger" onClick={() => { setShowOverflow(false); setShowDeleteConfirm(true) }}>
                Delete asset…
              </button>
            </div>
          )}
        </div>
      </div>

      {actionError && <div className="adp-action-error">{actionError}</div>}

      <div className="adp-hero">
        <div className="adp-stamps">
          <WStamp variant="ink">{asset.tag}</WStamp>
          {assetType && <WStamp>{assetType.name}</WStamp>}
          {currentSpace && <WStamp variant="blue">loc: {currentSpace.name}</WStamp>}
          <WStamp variant="outline">id: {asset.id.slice(0, 8)}</WStamp>
        </div>

        <div className="adp-title-row">
          <WH level={2}>{asset.tag}</WH>
          <WT size="lg" color="dim">
            <InlineEditField
              value={asset.name}
              onSave={val => patchAsset({ name: val })}
              placeholder="Add name…"
              emptyDisplay="(no name)"
            />
          </WT>
        </div>

        <div className="adp-pills-row">
          <WPill variant={STATUS_VARIANT[asset.status]}>{asset.status}</WPill>
          <WPill variant="outline">
            <InlineEditField
              value={asset.vendor_name}
              onSave={val => patchAsset({ vendor_name: val })}
              placeholder="Vendor…"
              emptyDisplay="+ vendor"
            />
          </WPill>
          {scheduledDate && (
            <WPill variant="default">Scheduled: {scheduledDate}</WPill>
          )}
          <WPill variant="ghost">{PHASE_LABEL[phase] ?? phase}</WPill>
        </div>

        <PhaseTracker phase={phase} />
      </div>

      <div className="adp-kpi-strip">
        <div className="adp-kpi-box">
          <div className="adp-kpi-val">{cxProgress}%</div>
          <WBar value={cxProgress} size="sm" color={cxProgress === 100 ? 'ok' : 'default'} className="adp-kpi-bar" />
          <div className="adp-kpi-label">Cx Progress</div>
        </div>
        <div className="adp-kpi-box">
          <div className="adp-kpi-val">{childAssets.length}</div>
          <div className="adp-kpi-label">Sub-assets</div>
        </div>
        <div className="adp-kpi-box">
          <div className="adp-kpi-val">{doneCount}/{instances.length}</div>
          <div className="adp-kpi-label">Instances done</div>
        </div>
        <div className="adp-kpi-box">
          <div className="adp-kpi-val" style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>
            <InlineEditField
              value={asset.manufacturer}
              onSave={val => patchAsset({ manufacturer: val })}
              placeholder="Manufacturer…"
            />
          </div>
          <div className="adp-kpi-label">Manufacturer</div>
        </div>
        <div className="adp-kpi-box">
          <div className="adp-kpi-val" style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>
            <InlineEditField
              value={asset.model}
              onSave={val => patchAsset({ model: val })}
              placeholder="Model…"
            />
          </div>
          <div className="adp-kpi-label">Model</div>
        </div>
      </div>

      <WTabs
        tabs={[...TABS]}
        active={activeTab}
        onChange={setTab}
      />

      <div className="adp-panel">
        {activeTab === 'Overview' && (
          <div>
            <WKVGrid className="adp-kv-grid">
              <WKV label="Tag">{asset.tag}</WKV>
              <WKV label="Name">
                <InlineEditField
                  value={asset.name}
                  onSave={val => patchAsset({ name: val })}
                  placeholder="Add name…"
                />
              </WKV>
              <WKV label="Status"><WPill variant={STATUS_VARIANT[asset.status]}>{asset.status}</WPill></WKV>
              <WKV label="Type">{assetType?.name ?? '—'}</WKV>
              <WKV label="Space">{spacePath}</WKV>
              <WKV label="Manufacturer">
                <InlineEditField
                  value={asset.manufacturer}
                  onSave={val => patchAsset({ manufacturer: val })}
                  placeholder="Add manufacturer…"
                />
              </WKV>
              <WKV label="Model">
                <InlineEditField
                  value={asset.model}
                  onSave={val => patchAsset({ model: val })}
                  placeholder="Add model…"
                />
              </WKV>
              <WKV label="Serial">
                <InlineEditField
                  value={asset.serial}
                  onSave={val => patchAsset({ serial: val })}
                  placeholder="Add serial…"
                />
              </WKV>
              <WKV label="Vendor">
                <InlineEditField
                  value={asset.vendor_name}
                  onSave={val => patchAsset({ vendor_name: val })}
                  placeholder="Add vendor…"
                />
              </WKV>
              <WKV label="Created">{new Date(asset.created_at).toLocaleDateString()}</WKV>
              {asset.retired_at && <WKV label="Retired">{new Date(asset.retired_at).toLocaleDateString()}</WKV>}
              {asset.decommissioned_at && <WKV label="Decommissioned">{new Date(asset.decommissioned_at).toLocaleDateString()}</WKV>}
              {nameplateEntries.map(([k, v]) => (
                <WKV key={k} label={k}>{String(v)}</WKV>
              ))}
            </WKVGrid>

            <WBtn variant="ghost" onClick={() => setShowNameplateEditor(true)} style={{ marginBottom: 16 }}>
              Edit nameplate data
            </WBtn>

            <div className="adp-timeline-empty">
              <WEmpty title="No activity log yet" subtitle="Activity will appear here once available." />
            </div>
          </div>
        )}

        {activeTab === 'Devices' && (
          <div className="adp-list">
            {childAssets.length === 0 ? (
              <WEmpty title="No sub-assets" subtitle="Child assets will appear here." />
            ) : (
              childAssets.map(child => (
                <div
                  key={child.id}
                  className="adp-list-row"
                  onClick={() => router.push(`/project/${projectId}/assets/${child.id}`)}
                >
                  <WStamp variant="ink">{child.tag}</WStamp>
                  <WT size="sm">{child.name ?? child.tag}</WT>
                  <WPill variant={STATUS_VARIANT[child.status]} style={{ marginLeft: 'auto' }}>
                    {child.status}
                  </WPill>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Checklists' && (
          <div className="adp-list">
            {checklists.length === 0 ? (
              <WEmpty title="No L2 checklists" subtitle="L2 pre-functional checklists will appear here." />
            ) : (
              checklists.map(inst => {
                const tmpl = templateMap.get(inst.template_id)
                return (
                  <div key={inst.id} className="adp-instance-row">
                    <WT size="sm" weight="medium" style={{ flex: 1 }}>
                      {tmpl?.name ?? inst.template_id}
                    </WT>
                    <WT size="xs" color="dim" className="adp-inst-status">{inst.status}</WT>
                    <WT size="xs" color="dim">{new Date(inst.created_at).toLocaleDateString()}</WT>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'Tests' && (
          <div className="adp-list">
            {tests.length === 0 ? (
              <WEmpty title="No tests" subtitle="L3–L5 test procedure instances will appear here." />
            ) : (
              tests.map(inst => {
                const tmpl = templateMap.get(inst.template_id)
                return (
                  <div key={inst.id} className="adp-instance-row">
                    <WStamp>{inst.level}</WStamp>
                    <WT size="sm" weight="medium" style={{ flex: 1 }}>
                      {tmpl?.name ?? inst.template_id}
                    </WT>
                    <WT size="xs" color="dim" className="adp-inst-status">{inst.status}</WT>
                    <WT size="xs" color="dim">{new Date(inst.created_at).toLocaleDateString()}</WT>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'Linked' && (
          <div>
            <div className="adp-linked-section">
              <div className="adp-linked-title">Parent Asset</div>
              {parentAsset ? (
                <div
                  className="adp-linked-row"
                  onClick={() => router.push(`/project/${projectId}/assets/${parentAsset.id}`)}
                >
                  <WStamp variant="ink">{parentAsset.tag}</WStamp>
                  <WT size="sm">{parentAsset.name ?? parentAsset.tag}</WT>
                </div>
              ) : (
                <WT size="sm" color="dim">No parent asset</WT>
              )}
            </div>

            <div className="adp-linked-section">
              <div className="adp-linked-title">System Memberships</div>
              {systemMemberships.length === 0 ? (
                <WT size="sm" color="dim">Not a member of any system</WT>
              ) : (
                systemMemberships.map(sys => (
                  <div
                    key={sys.id}
                    className="adp-linked-row"
                    onClick={() => router.push(`/project/${projectId}/systems/${sys.id}`)}
                  >
                    <WT size="sm">{sys.name}</WT>
                  </div>
                ))
              )}
            </div>

            <div className="adp-linked-section">
              <div className="adp-linked-title">Space Path</div>
              <WT size="sm" className="adp-crumb-path">{spacePath}</WT>
            </div>
          </div>
        )}
      </div>

      {showNameplateEditor && (
        <NameplateEditorModal
          initial={asset.nameplate_data ?? {}}
          onSave={async (data) => { await patchAsset({ nameplate_data: data }) }}
          onClose={() => setShowNameplateEditor(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          assetTag={asset.tag}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </WFrame>
  )
}

function AssetDetailPageInner() {
  const params = useParams()
  const projectId = params?.id as string
  const assetId = params?.assetId as string
  return <AssetDetailContent projectId={projectId} assetId={assetId} />
}

export default function AssetDetailPage() {
  return (
    <Suspense>
      <AssetDetailPageInner />
    </Suspense>
  )
}
