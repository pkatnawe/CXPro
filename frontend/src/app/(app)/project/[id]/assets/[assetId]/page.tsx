'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getAsset,
  listAssetTypes,
  listSpaces,
  updateAsset,
  deleteAsset,
  retireAsset,
  decommissionAsset,
  type Asset,
  type AssetType,
  type Space,
  type AssetStatus,
} from '@/contexts/asset_registry/api'
import { listInstances, type Instance } from '@/contexts/commissioning_execution/api'
import { derivePhase } from '@/contexts/asset_registry/derivePhase'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'
import { AssetOverview } from '@/contexts/asset_registry/AssetOverview'
import { AssetDevices } from '@/contexts/asset_registry/AssetDevices'
import { AssetChecklists } from '@/contexts/asset_registry/AssetChecklists'
import { AssetTests } from '@/contexts/asset_registry/AssetTests'
import { AssetIssues } from '@/contexts/asset_registry/AssetIssues'
import { AssetFiles } from '@/contexts/asset_registry/AssetFiles'
import {
  WFrame,
  WH,
  WT,
  WPill,
  WStamp,
  WBtn,
  WSkeleton,
  WEmpty,
  WBox,
  WBar,
} from '@/lib/frontend-kit'

interface TabDef {
  id: string
  label: string
  preview?: boolean
}

const TABS: TabDef[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'devices',    label: 'Devices' },
  { id: 'checklists', label: 'Checklists' },
  { id: 'tests',      label: 'Tests' },
  { id: 'issues',     label: 'Issues',  preview: true },
  { id: 'files',      label: 'Files',   preview: true },
  { id: 'rfis',       label: 'RFIs',    preview: true },
  { id: 'history',    label: 'History', preview: true },
  { id: 'linked',     label: 'Linked' },
]

type TabId = 'overview' | 'devices' | 'checklists' | 'tests' | 'issues' | 'files' | 'rfis' | 'history' | 'linked'

const PHASE_LABEL: Record<string, string> = {
  'pre-install': 'Pre-install',
  L2: 'L2 / Pre-functional',
  L3: 'L3 / Functional',
  L4: 'L4 / Functional Performance',
  L5: 'L5 / IST',
}

const STATUS_TONE: Record<AssetStatus, 'ok' | 'warn' | 'ink'> = {
  active: 'ok',
  retired: 'warn',
  decommissioned: 'warn',
}

function getHash(): TabId {
  if (typeof window === 'undefined') return 'overview'
  const h = window.location.hash.replace('#', '') as TabId
  return TABS.some(t => t.id === h) ? h : 'overview'
}

function AssetDetailContent({ projectId, assetId }: { projectId: string; assetId: string }) {
  const router = useRouter()
  const { setEntityLabel } = useBreadcrumbLabel()

  const [activeTab, setActiveTabState] = useState<TabId>('overview')
  const [asset, setAsset] = useState<Asset | null>(null)
  const [assetType, setAssetType] = useState<AssetType | undefined>(undefined)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)

  const [showOverflow, setShowOverflow] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionError, setActionError] = useState('')
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveTabState(getHash())
    const onHashChange = () => setActiveTabState(getHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const setTab = (id: TabId) => {
    window.location.hash = id
    setActiveTabState(id)
  }

  const load = useCallback(async () => {
    const [assetData, assetTypes, spacesData, instancesData] = await Promise.all([
      getAsset(projectId, assetId),
      listAssetTypes(projectId),
      listSpaces(projectId),
      listInstances(projectId, { asset_id: assetId }),
    ])
    setAsset(assetData)
    setEntityLabel(assetData.tag)
    setAssetType(assetTypes.find(t => t.id === assetData.asset_type_id))
    setSpaces(spacesData)
    setInstances(instancesData)
    setLoading(false)
  }, [projectId, assetId, setEntityLabel])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/auth'); return }
      load()
    })
  }, [router, load])

  useEffect(() => {
    if (!showOverflow) return
    const onClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showOverflow])

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
      setActionError((err as { message?: string })?.message ?? 'Failed to retire')
    }
  }

  const handleDecommission = async () => {
    setShowOverflow(false)
    setActionError('')
    try {
      const updated = await decommissionAsset(projectId, assetId)
      setAsset(updated)
    } catch (err: unknown) {
      setActionError((err as { message?: string })?.message ?? 'Failed to decommission')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAsset(projectId, assetId)
      router.push(`/project/${projectId}/assets`)
    } catch (err: unknown) {
      setActionError((err as { message?: string })?.message ?? 'Failed to delete')
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)' }}>
          <WSkeleton width={200} height="28px" />
          <WSkeleton width={320} height="16px" style={{ marginTop: 8 }} />
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ width: 200, borderRight: '1px solid var(--ui-line)', padding: '12px 8px', background: 'var(--ui-panel-2)' }}>
            {TABS.map(t => <div key={t.id} style={{ padding: '7px 10px', marginBottom: 2 }}><WSkeleton width={80} /></div>)}
          </div>
          <div style={{ flex: 1, padding: 20 }}>
            <WSkeleton width="100%" height="200px" />
          </div>
        </div>
      </WFrame>
    )
  }

  if (!asset) {
    return (
      <WFrame style={{ padding: 24 }}>
        <WEmpty title="Asset not found" subtitle="This asset may have been deleted." />
      </WFrame>
    )
  }

  const phase = derivePhase(instances)
  const doneCount = instances.filter(i => i.status === 'complete').length
  const cxProgress = instances.length > 0 ? Math.round((doneCount / instances.length) * 100) : 0

  return (
    <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-panel)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <WStamp k="tag" v={asset.tag} />
              {assetType && <WStamp k="type" v={assetType.name} />}
              {asset.manufacturer && <WStamp k="mfr" v={asset.manufacturer} />}
              {asset.model && <WStamp k="model" v={asset.model} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <WH size={24}>{asset.tag}</WH>
              {asset.name && <WT size={14} color="ink-soft">{asset.name}</WT>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <WPill tone={STATUS_TONE[asset.status]} filled>{asset.status}</WPill>
              <WPill tone="ink">{PHASE_LABEL[phase] ?? phase}</WPill>
              {asset.vendor_name && <WPill tone="ink">vendor · {asset.vendor_name}</WPill>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <WBtn tone="primary" onClick={() => {}} aria-label="Edit asset">Edit</WBtn>
            <div ref={overflowRef} style={{ position: 'relative' }}>
              <button
                data-testid="overflow-menu-btn"
                onClick={() => setShowOverflow(v => !v)}
                style={{
                  background: 'none',
                  border: '1px solid var(--ui-line-strong)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--ui-ink-soft)',
                  padding: '4px 10px',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ⋯
              </button>
              {showOverflow && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'var(--ui-panel)',
                  border: '1px solid var(--ui-line-strong)',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: 180,
                  zIndex: 100,
                  padding: '4px 0',
                }}>
                  <button onClick={handleRetire} style={overflowItemStyle()}>Retire</button>
                  <button onClick={handleDecommission} style={overflowItemStyle()}>Decommission</button>
                  <button
                    data-testid="delete-btn"
                    onClick={() => { setShowOverflow(false); setShowDeleteConfirm(true) }}
                    style={overflowItemStyle('warn')}
                  >
                    Delete asset…
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {actionError && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ui-warn)' }}>{actionError}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Cx progress', value: `${cxProgress}%`, bar: cxProgress },
            { label: 'Sub-assets', value: '—' },
            { label: 'Instances', value: `${doneCount}/${instances.length}` },
            { label: 'Phase', value: PHASE_LABEL[phase] ?? phase },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: 'var(--ui-panel-2)', border: '1px solid var(--ui-line)', borderRadius: 8, padding: '10px 12px' }}>
              <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{kpi.label}</WT>
              <WH size={18} style={{ marginTop: 4 }}>{kpi.value}</WH>
              {kpi.bar !== undefined && <WBar value={kpi.bar} height={4} color={kpi.bar === 100 ? 'ok' : 'primary'} style={{ marginTop: 6, width: '100%' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <nav style={{
          width: 200,
          flexShrink: 0,
          borderRight: '1px solid var(--ui-line)',
          background: 'var(--ui-panel-2)',
          padding: '8px 8px',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '4px 4px 8px' }}>
            <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1.2px' }}>sections</WT>
          </div>
          {TABS.map(tab => {
            const on = activeTab === tab.id
            return (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setTab(tab.id as TabId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: on ? 'var(--ui-primary-soft)' : 'transparent',
                  border: on ? '1px solid var(--ui-primary-line)' : '1px solid transparent',
                  color: on ? 'var(--ui-primary)' : 'var(--ui-ink-soft)',
                  fontSize: 13,
                  fontWeight: on ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 2,
                }}
              >
                {tab.label}
                {tab.preview && (
                  <WT size={9} mono color={on ? 'primary' : 'ink-faint'} style={{ opacity: 0.7 }}>preview</WT>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'overview' ? (
            <AssetOverview
              asset={asset}
              assetType={assetType}
              instances={instances}
              spaceMap={new Map(spaces.map(s => [s.id, s]))}
              onPatch={patchAsset}
            />
          ) : activeTab === 'devices' ? (
            <AssetDevices projectId={projectId} assetId={assetId} />
          ) : activeTab === 'checklists' ? (
            <AssetChecklists projectId={projectId} assetId={assetId} />
          ) : activeTab === 'tests' ? (
            <AssetTests projectId={projectId} assetId={assetId} />
          ) : activeTab === 'issues' ? (
            <AssetIssues />
          ) : activeTab === 'files' ? (
            <AssetFiles />
          ) : (
            <div style={{ padding: 20 }}>
              <WBox style={{ padding: 20 }}>
                <WT size={13} color="ink-soft">
                  {TABS.find(t => t.id === activeTab)?.label} · coming in next slice
                </WT>
              </WBox>
            </div>
          )}
        </div>
      </div>

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

function overflowItemStyle(variant?: 'warn'): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
    color: variant === 'warn' ? 'var(--ui-warn)' : 'var(--ui-ink-soft)',
  }
}

function DeleteConfirmModal({ assetTag, onConfirm, onCancel }: {
  assetTag: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
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
    try { await onConfirm() } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <WBox style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        <WH size={15} style={{ marginBottom: 8 }}>Delete asset?</WH>
        <WT size={13} color="ink-soft" style={{ marginBottom: 16 }}>
          This will permanently delete <strong>{assetTag}</strong>. This action cannot be undone.
        </WT>
        {error && <WT size={12} color="warn" style={{ marginBottom: 12 }}>{error}</WT>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <WBtn variant="ghost" onClick={onCancel} disabled={deleting}>Cancel</WBtn>
          <WBtn tone="warn" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </WBtn>
        </div>
      </WBox>
    </div>
  )
}

function AssetDetailPageInner() {
  const params = useParams()
  return (
    <AssetDetailContent
      projectId={params?.id as string}
      assetId={params?.assetId as string}
    />
  )
}

export default function AssetDetailPage() {
  return (
    <Suspense>
      <AssetDetailPageInner />
    </Suspense>
  )
}
