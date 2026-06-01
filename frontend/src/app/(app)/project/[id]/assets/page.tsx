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
  type Space,
  type AssetStatus,
} from '@/contexts/asset_registry/api'
import { listInstances, type Instance } from '@/contexts/commissioning_execution/api'
import { useUrlFilters } from '@/contexts/asset_registry/useUrlFilters'
import { derivePhase } from '@/contexts/asset_registry/derivePhase'
import {
  WFrame,
  WHeader,
  WPill,
  WT,
  WLiveDot,
  WSkeleton,
  WEmpty,
  WBox,
} from '@/lib/frontend-kit'

const PHASE_LABEL: Record<string, string> = {
  'pre-install': 'Pre-install',
  L2: 'L2 / Pre-functional',
  L3: 'L3 / Functional',
  L4: 'L4 / Functional Performance',
  L5: 'L5 / IST',
}

const STATUS_VARIANT: Record<AssetStatus, 'default' | 'ok' | 'amber' | 'warn'> = {
  active: 'ok',
  retired: 'amber',
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
  const { filters, clearFilter } = useUrlFilters()

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

  const activeFilters = Object.entries(filters).filter(([, v]) => v !== undefined)

  return (
    <WFrame variant="padded">
      <style jsx>{`
        .al-page { display: flex; flex-direction: column; gap: 0; min-height: 100vh; }
        .al-ai-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bp-paper-2); border: 1px solid var(--bp-line-softer); border-radius: 8px; margin-bottom: 12px; }
        .al-ai-bar input { flex: 1; background: none; border: none; outline: none; font-size: 13px; color: var(--bp-ink); }
        .al-ai-bar input::placeholder { color: var(--bp-text-secondary); }
        .al-ai-glyph { font-size: 16px; color: var(--bp-blue); flex-shrink: 0; }
        .al-actions { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
        .al-filters { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
        .al-count { margin-left: auto; display: flex; align-items: center; gap: 6px; }
        .al-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .al-table th { text-align: left; padding: 6px 10px; color: var(--bp-text-secondary); font-weight: 500; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; border-bottom: 1px solid var(--bp-line-softer); white-space: nowrap; }
        .al-table td { padding: 7px 10px; border-bottom: 1px solid var(--bp-line-softest, var(--bp-line-softer)); vertical-align: middle; }
        .al-table tr.al-row { cursor: pointer; }
        .al-table tr.al-row:hover td { background: var(--bp-paper-2); }
        .al-tag { font-weight: 600; color: var(--bp-ink); font-size: 12px; }
        .al-desc { color: var(--bp-text-secondary); font-size: 12px; }
        .al-check { color: var(--bp-line-soft); }
        .al-skeleton-row td { padding: 8px 10px; }
        .al-stub-btn { background: none; border: 1px solid var(--bp-line-soft); border-radius: 100px; padding: 3px 10px; font-size: 12px; color: var(--bp-graphite); cursor: default; white-space: nowrap; }
      `}</style>

      <div className="al-page">
        <WHeader
          crumbs={[
            { label: 'Project', onClick: () => router.push(`/project/${projectId}`) },
            { label: 'Assets' },
          ]}
          title="Assets"
        />

        <div className="al-ai-bar">
          <span className="al-ai-glyph">✦</span>
          <input
            placeholder="Ask anything about your assets…"
            onKeyDown={e => { if (e.key === 'Enter') alert('Coming soon') }}
          />
        </div>

        <div className="al-actions">
          <WPill
            variant="chip"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowCreateModal(true)}
          >
            + new
          </WPill>
          <button className="al-stub-btn" title="Import BIM (coming soon)">Import BIM</button>
          <button className="al-stub-btn" title="Export (coming soon)">Export</button>
        </div>

        <div className="al-filters">
          {spaces.length > 0 && (
            <WPill
              variant="chip"
              active={!!filters.space}
              style={{ cursor: 'pointer' }}
              onClick={() => filters.space ? clearFilter('space') : undefined}
            >
              Space{filters.space ? `: ${spaceMap.get(filters.space)?.name ?? filters.space} ×` : ''}
            </WPill>
          )}
          {assetTypes.length > 0 && (
            <WPill
              variant="chip"
              active={!!filters.type}
              style={{ cursor: 'pointer' }}
              onClick={() => filters.type ? clearFilter('type') : undefined}
            >
              Type{filters.type ? `: ${typeMap.get(filters.type)?.name ?? filters.type} ×` : ''}
            </WPill>
          )}
          <WPill
            variant="chip"
            active={!!filters.status}
            style={{ cursor: 'pointer' }}
            onClick={() => filters.status ? clearFilter('status') : undefined}
          >
            Status{filters.status ? `: ${filters.status} ×` : ''}
          </WPill>

          <span className="al-count">
            <WLiveDot color={loading ? 'dim' : 'ok'} />
            <WT size="xs" color="dim">
              {loading ? '…' : `${filteredAssets.length} of ${assets.length} · live`}
            </WT>
          </span>
        </div>

        {loading ? (
          <table className="al-table">
            <thead>
              <tr>
                <th></th>
                <th>Tag · Description</th>
                <th>Type</th>
                <th>Space</th>
                <th>Status</th>
                <th>Phase</th>
                <th>Children</th>
                <th>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="al-skeleton-row">
                  <td><WSkeleton width={16} /></td>
                  <td><WSkeleton width={120} /></td>
                  <td><WSkeleton width={80} /></td>
                  <td><WSkeleton width={100} /></td>
                  <td><WSkeleton width={60} /></td>
                  <td><WSkeleton width={90} /></td>
                  <td><WSkeleton width={30} /></td>
                  <td><WSkeleton width={80} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filteredAssets.length === 0 ? (
          <WEmpty
            icon="📦"
            title={activeFilters.length > 0 ? 'No assets match filters' : 'No assets yet'}
            subtitle={activeFilters.length > 0 ? 'Try clearing a filter' : 'Create your first asset to get started'}
          />
        ) : (
          <table className="al-table">
            <thead>
              <tr>
                <th className="al-check">☐</th>
                <th>Tag · Description</th>
                <th>Type</th>
                <th>Space</th>
                <th>Status</th>
                <th>Phase</th>
                <th>Children</th>
                <th>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => {
                const phase = derivePhase(instancesByAsset.get(asset.id) ?? [])
                const spacePath = buildSpacePath(asset.space_id, spaceMap)
                const assetTypeName = typeMap.get(asset.asset_type_id)?.name ?? '—'
                const kids = childCount.get(asset.id) ?? 0
                return (
                  <tr
                    key={asset.id}
                    className="al-row"
                    onClick={() => router.push(`/project/${projectId}/assets/${asset.id}`)}
                  >
                    <td className="al-check">☐</td>
                    <td>
                      <span className="al-tag">{asset.tag}</span>
                      {asset.name && <span className="al-desc"> · {asset.name}</span>}
                    </td>
                    <td><WT size="xs" color="dim">{assetTypeName}</WT></td>
                    <td><WT size="xs" color="dim">{spacePath}</WT></td>
                    <td>
                      <WPill variant={STATUS_VARIANT[asset.status]}>
                        {asset.status}
                      </WPill>
                    </td>
                    <td>
                      <WT size="xs" color="dim">{PHASE_LABEL[phase] ?? phase}</WT>
                    </td>
                    <td>
                      <WT size="xs" color={kids > 0 ? 'default' : 'dim'}>{kids > 0 ? kids : '—'}</WT>
                    </td>
                    <td><WT size="xs" color="dim">{asset.vendor_name ?? '—'}</WT></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
        >
          <WBox style={{ minWidth: 320, maxWidth: 480, width: '100%' }}>
            <WT weight="bold" as="p" style={{ marginBottom: 8 }}>New Asset</WT>
            <WT color="dim" size="sm" as="p">Create asset modal — coming in US-007</WT>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <WPill
                variant="outline"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </WPill>
            </div>
          </WBox>
        </div>
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
