'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getAsset,
  listAssets,
  listAssetTypes,
  listSpaces,
  listSystems,
  listSystemMembers,
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
      `}</style>

      <WHeader
        crumbs={[
          { label: 'Project', onClick: () => router.push(`/project/${projectId}`) },
          { label: 'Assets', onClick: () => router.push(`/project/${projectId}/assets`) },
          { label: asset.tag },
        ]}
        title={asset.tag}
      />

      <div className="adp-hero">
        <div className="adp-stamps">
          <WStamp variant="ink">{asset.tag}</WStamp>
          {assetType && <WStamp>{assetType.name}</WStamp>}
          {currentSpace && <WStamp variant="blue">loc: {currentSpace.name}</WStamp>}
          <WStamp variant="outline">id: {asset.id.slice(0, 8)}</WStamp>
        </div>

        <div className="adp-title-row">
          <WH level={2}>{asset.tag}</WH>
          {asset.name && <WT size="lg" color="dim">{asset.name}</WT>}
        </div>

        <div className="adp-pills-row">
          <WPill variant={STATUS_VARIANT[asset.status]}>{asset.status}</WPill>
          {asset.vendor_name && (
            <WPill variant="outline">{asset.vendor_name}</WPill>
          )}
          {scheduledDate && (
            <WPill variant="default">Scheduled: {scheduledDate}</WPill>
          )}
          <WPill variant="ghost">{PHASE_LABEL[phase] ?? phase}</WPill>
        </div>
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
            {asset.manufacturer ?? '—'}
          </div>
          <div className="adp-kpi-label">Manufacturer</div>
        </div>
        <div className="adp-kpi-box">
          <div className="adp-kpi-val" style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>
            {asset.model ?? '—'}
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
              <WKV label="Name">{asset.name ?? '—'}</WKV>
              <WKV label="Status"><WPill variant={STATUS_VARIANT[asset.status]}>{asset.status}</WPill></WKV>
              <WKV label="Type">{assetType?.name ?? '—'}</WKV>
              <WKV label="Space">{spacePath}</WKV>
              <WKV label="Manufacturer">{asset.manufacturer ?? '—'}</WKV>
              <WKV label="Model">{asset.model ?? '—'}</WKV>
              <WKV label="Serial">{asset.serial ?? '—'}</WKV>
              <WKV label="Vendor">{asset.vendor_name ?? '—'}</WKV>
              <WKV label="Created">{new Date(asset.created_at).toLocaleDateString()}</WKV>
              {asset.retired_at && <WKV label="Retired">{new Date(asset.retired_at).toLocaleDateString()}</WKV>}
              {asset.decommissioned_at && <WKV label="Decommissioned">{new Date(asset.decommissioned_at).toLocaleDateString()}</WKV>}
              {nameplateEntries.map(([k, v]) => (
                <WKV key={k} label={k}>{String(v)}</WKV>
              ))}
            </WKVGrid>

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
