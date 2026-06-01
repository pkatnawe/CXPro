'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  listAssets,
  listAssetTypes,
  listSpaces,
  type Asset,
  type AssetType,
  type AssetStatus,
  type Space,
} from '@/contexts/asset_registry/api'
import { listInstances, type Instance } from '@/contexts/commissioning_execution/api'
import { useUrlFilters } from '@/contexts/asset_registry/useUrlFilters'
import { derivePhase } from '@/contexts/asset_registry/derivePhase'
import { CreateAssetModal } from '@/contexts/asset_registry/CreateAssetModal'
import {
  WFrame,
  WH,
  WT,
  WPill,
  WBtn,
  WLiveDot,
  WSectionLabel,
  WSkeleton,
  WEmpty,
  WAvatar,
  WBox,
} from '@/lib/frontend-kit'

const PHASE_LABEL: Record<string, string> = {
  'pre-install': 'Pre-install',
  L2: 'L2 / Pre-functional',
  L3: 'L3 / Functional',
  L4: 'L4 / Functional Performance',
  L5: 'L5 / IST',
}

const LIFECYCLE_FILTERS: { value: AssetStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'decommissioned', label: 'Decommissioned' },
]

const STATUS_TONE: Record<AssetStatus, string> = {
  active: 'ok',
  retired: 'warn',
  decommissioned: 'warn',
}

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

function AssetsPageContent() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const { filters, setFilter, clearFilter } = useUrlFilters()

  const [assets, setAssets] = useState<Asset[]>([])
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const load = useCallback(async () => {
    const [assetsData, typesData, spacesData, instancesData] = await Promise.all([
      listAssets(projectId),
      listAssetTypes(projectId),
      listSpaces(projectId),
      listInstances(projectId),
    ])
    setAssets(assetsData)
    setAssetTypes(typesData)
    setSpaces(spacesData)
    setInstances(instancesData)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      load()
    })
  }, [router, load])

  const typeMap = new Map(assetTypes.map(t => [t.id, t]))
  const spaceMap = new Map(spaces.map(s => [s.id, s]))
  const instancesByAsset = new Map<string, Instance[]>()
  for (const inst of instances) {
    if (inst.asset_id) {
      const arr = instancesByAsset.get(inst.asset_id) ?? []
      arr.push(inst)
      instancesByAsset.set(inst.asset_id, arr)
    }
  }

  const filteredAssets = assets.filter(a => {
    if (filters.status && a.status !== filters.status) return false
    if (filters.space && a.space_id !== filters.space) return false
    if (filters.type && a.asset_type_id !== filters.type) return false
    return true
  })

  const childCount = new Map<string, number>()
  for (const a of assets) {
    if (a.parent_asset_id) {
      childCount.set(a.parent_asset_id, (childCount.get(a.parent_asset_id) ?? 0) + 1)
    }
  }

  const typeGroups = assetTypes.reduce<Record<string, AssetType[]>>((acc, t) => {
    const group = t.name.split(' ')[0] ?? 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(t)
    return acc
  }, {})

  return (
    <WFrame style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--ui-line)',
          background: 'var(--ui-panel-2)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 14px 8px' }}>
            <WSectionLabel tone="primary">Filter · by type</WSectionLabel>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 14px' }}>
            <div
              onClick={() => clearFilter('type')}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                background: !filters.type ? 'var(--ui-primary-soft)' : 'var(--ui-panel)',
                border: !filters.type ? '1px solid var(--ui-primary-line)' : '1px solid var(--ui-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                cursor: 'pointer',
                color: !filters.type ? 'var(--ui-primary)' : 'var(--ui-ink)',
              }}
            >
              <WT size={13} weight={!filters.type ? 600 : 400} color={!filters.type ? 'primary' : 'ink'}>All assets</WT>
              <WT size={11} mono color={!filters.type ? 'primary' : 'ink-soft'}>{assets.length}</WT>
            </div>

            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} style={{ padding: '5px 10px', marginBottom: 2 }}>
                  <WSkeleton width={120} />
                </div>
              ))
            ) : Object.entries(typeGroups).map(([group, types]) => {
              const groupCount = types.reduce((n, t) => n + assets.filter(a => a.asset_type_id === t.id).length, 0)
              return (
                <div key={group} style={{ marginBottom: 14 }}>
                  <div style={{ padding: '0 6px 4px', display: 'flex', justifyContent: 'space-between' }}>
                    <WT size={10} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1.2px' }}>{group}</WT>
                    <WT size={10} mono color="ink-faint">{groupCount}</WT>
                  </div>
                  {types.map(type => {
                    const count = assets.filter(a => a.asset_type_id === type.id).length
                    const active = filters.type === type.id
                    return (
                      <div
                        key={type.id}
                        onClick={() => setFilter('type', type.id)}
                        data-testid={`type-filter-${type.id}`}
                        style={{
                          padding: '5px 10px',
                          marginTop: 2,
                          borderRadius: 6,
                          background: active ? 'var(--ui-primary-soft)' : 'transparent',
                          border: active ? '1px solid var(--ui-primary-line)' : '1px solid transparent',
                          color: active ? 'var(--ui-primary)' : 'var(--ui-ink)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12.5,
                          fontWeight: active ? 500 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: active ? 'var(--ui-primary)' : 'var(--ui-line-strong)', flexShrink: 0 }} />
                          {type.name}
                        </span>
                        <WT size={11} mono color={active ? 'primary' : 'ink-soft'}>{count}</WT>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </aside>

        <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
            <div>
              <WH size={22}>
                {filters.type ? (typeMap.get(filters.type)?.name ?? 'Assets') : 'Asset Register'}
              </WH>
              <WT size={12} color="ink-soft" style={{ marginTop: 4 }}>
                {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
                {assets.length !== filteredAssets.length ? ` of ${assets.length}` : ''}
              </WT>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <WBtn tone="primary" onClick={() => setShowCreateModal(true)}>+ add asset</WBtn>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Lifecycle</WT>
            {LIFECYCLE_FILTERS.map(lc => (
              <WPill
                key={lc.value}
                tone={filters.status === lc.value ? 'primary' : 'ink'}
                filled={filters.status === lc.value}
                style={{ cursor: 'pointer' }}
                onClick={() => filters.status === lc.value ? clearFilter('status') : setFilter('status', lc.value)}
              >
                {lc.label}
              </WPill>
            ))}
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <WLiveDot tone={loading ? undefined : 'ok'} size={6} />
              <WT size={11} mono color="ink-faint">{loading ? '…' : `${filteredAssets.length} results · live`}</WT>
            </span>
          </div>

          {loading ? (
            <WBox style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel-2)' }}>
                <WSkeleton width="100%" height="16px" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--ui-line)', display: 'flex', gap: 16 }}>
                  <WSkeleton width={80} />
                  <WSkeleton width={140} />
                  <WSkeleton width={100} />
                  <WSkeleton width={70} />
                </div>
              ))}
            </WBox>
          ) : filteredAssets.length === 0 ? (
            <WEmpty
              title={filters.type || filters.status ? 'No assets match filters' : 'No assets yet'}
              subtitle={filters.type || filters.status ? 'Try clearing a filter' : 'Create your first asset to get started'}
            />
          ) : (
            <WBox style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 120px 140px 110px 110px 80px 70px',
                padding: '8px 14px',
                borderBottom: '1px solid var(--ui-line)',
                background: 'var(--ui-panel-2)',
                alignItems: 'center',
              }}>
                {['Tag · Description', 'Type', 'Space', 'Status', 'Phase', 'Devices', 'Owner'].map(h => (
                  <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
                ))}
              </div>
              {filteredAssets.map((asset, i) => {
                const phase = derivePhase(instancesByAsset.get(asset.id) ?? [])
                const spacePath = buildSpacePath(asset.space_id, spaceMap)
                const assetTypeName = typeMap.get(asset.asset_type_id)?.name ?? '—'
                const kids = childCount.get(asset.id) ?? 0
                const tone = STATUS_TONE[asset.status] ?? 'ink'
                return (
                  <div
                    key={asset.id}
                    data-testid="asset-row"
                    onClick={() => router.push(`/project/${projectId}/assets/${asset.id}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 120px 140px 110px 110px 80px 70px',
                      padding: '9px 14px',
                      borderBottom: i < filteredAssets.length - 1 ? '1px solid var(--ui-line)' : 'none',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <WT size={13} weight={600}>{asset.tag}</WT>
                      {asset.name && <WT size={11} color="ink-soft" style={{ marginTop: 1 }}>{asset.name}</WT>}
                    </div>
                    <WT size={11.5} color="ink-soft">{assetTypeName}</WT>
                    <WT size={11.5} color="ink-soft">{spacePath}</WT>
                    <WPill tone={tone as 'ok' | 'warn' | 'ink'} filled size="sm">{asset.status}</WPill>
                    <WT size={11.5} color="ink-soft">{PHASE_LABEL[phase] ?? phase}</WT>
                    <WT size={12} mono color={kids > 0 ? 'ink' : 'ink-faint'}>{kids > 0 ? kids : '—'}</WT>
                    <WAvatar initials={asset.vendor_name ? asset.vendor_name.slice(0, 2).toUpperCase() : '—'} size={22} seed={asset.id} />
                  </div>
                )
              })}
            </WBox>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateAssetModal
          projectId={projectId}
          assetTypes={assetTypes}
          spaces={spaces}
          assets={assets}
          onClose={() => setShowCreateModal(false)}
          onCreated={newAsset => {
            setAssets(prev => [newAsset, ...prev])
            setShowCreateModal(false)
          }}
        />
      )}
    </WFrame>
  )
}

export default function AssetsPage() {
  return (
    <Suspense>
      <AssetsPageContent />
    </Suspense>
  )
}
