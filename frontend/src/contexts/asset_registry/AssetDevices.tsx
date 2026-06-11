'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  listAssets,
  listAssetTypes,
  type Asset,
  type AssetType,
  type AssetStatus,
} from './api'
import {
  WT,
  WH,
  WPill,
  WBtn,
  WSectionLabel,
  WSkeleton,
  WEmpty,
  WBox,
} from '@/lib/frontend-kit'

const STATUS_TONE: Record<AssetStatus, 'ok' | 'warn' | 'ink'> = {
  active: 'ok',
  retired: 'warn',
  decommissioned: 'warn',
}

interface Props {
  projectId: string
  assetId: string
}

export function AssetDevices({ projectId, assetId }: Props) {
  const router = useRouter()
  const [children, setChildren] = useState<Asset[]>([])
  const [typeMap, setTypeMap] = useState(new Map<string, AssetType>())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [childAssets, assetTypes] = await Promise.all([
      listAssets(projectId, { parent_asset_id: assetId }),
      listAssetTypes(projectId),
    ])
    setChildren(childAssets)
    setTypeMap(new Map(assetTypes.map(t => [t.id, t])))
    setLoading(false)
  }, [projectId, assetId])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <WSectionLabel tone="primary">
            {loading ? 'Sub-assets' : `${children.length} device${children.length !== 1 ? 's' : ''} · sub-assets`}
          </WSectionLabel>
          <WH size={18} style={{ marginTop: 6 }}>Devices mounted on this asset</WH>
        </div>
      </div>

      {loading ? (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--ui-line)', display: 'flex', gap: 16 }}>
              <WSkeleton width={60} />
              <WSkeleton width={140} />
              <WSkeleton width={90} />
              <WSkeleton width={80} />
            </div>
          ))}
        </WBox>
      ) : children.length === 0 ? (
        <WEmpty
          title="No sub-assets registered"
          subtitle="Child assets of this asset will appear here."
        />
      ) : (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1.4fr 110px 110px 90px',
            padding: '8px 14px',
            borderBottom: '1px solid var(--ui-line)',
            background: 'var(--ui-panel-2)',
          }}>
            {['Tag', 'Description', 'Type', 'Status', 'Phase'].map(h => (
              <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
            ))}
          </div>
          {children.map((child, i) => (
            <div
              key={child.id}
              data-testid="device-row"
              onClick={() => router.push(`/project/${projectId}/assets/${child.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1.4fr 110px 110px 90px',
                padding: '9px 14px',
                borderBottom: i < children.length - 1 ? '1px solid var(--ui-line)' : 'none',
                alignItems: 'center',
                cursor: 'pointer',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <WT size={12} mono weight={500}>{child.tag}</WT>
              <div>
                <WT size={12.5}>{child.name ?? child.tag}</WT>
              </div>
              <WT size={11.5} color="ink-soft">{typeMap.get(child.asset_type_id)?.name ?? '—'}</WT>
              <WPill tone={STATUS_TONE[child.status]} filled size="sm">{child.status}</WPill>
              <WT size={11.5} color="ink-soft">—</WT>
            </div>
          ))}
        </WBox>
      )}
    </div>
  )
}
