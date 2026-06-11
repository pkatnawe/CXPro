'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  listSystems,
  type System,
} from './api'
import {
  WT,
  WH,
  WSectionLabel,
  WSkeleton,
  WEmpty,
  WBox,
} from '@/lib/frontend-kit'

interface Props {
  projectId: string
  assetId: string
}

export function AssetLinked({ projectId, assetId }: Props) {
  const router = useRouter()
  const [systems, setSystems] = useState<System[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await listSystems(projectId, { asset_id: assetId })
    setSystems(data)
    setLoading(false)
  }, [projectId, assetId])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={{ marginBottom: 12 }}>
        <WSectionLabel tone="primary">
          {loading ? 'Systems' : `${systems.length} system${systems.length !== 1 ? 's' : ''}`}
        </WSectionLabel>
        <WH size={18} style={{ marginTop: 6 }}>System Memberships</WH>
      </div>

      {loading ? (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--ui-line)', display: 'flex', gap: 16 }}>
              <WSkeleton width={180} />
              <WSkeleton width={120} />
            </div>
          ))}
        </WBox>
      ) : systems.length === 0 ? (
        <WEmpty
          title="Not a member of any system"
          subtitle="Systems this asset belongs to will appear here once assigned."
        />
      ) : (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            padding: '8px 14px',
            borderBottom: '1px solid var(--ui-line)',
            background: 'var(--ui-panel-2)',
          }}>
            {['System', 'Description'].map(h => (
              <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
            ))}
          </div>
          {systems.map((system, i) => (
            <div
              key={system.id}
              data-testid="linked-system-row"
              onClick={() => router.push(`/project/${projectId}/systems/${system.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                padding: '9px 14px',
                borderBottom: i < systems.length - 1 ? '1px solid var(--ui-line)' : 'none',
                alignItems: 'center',
                cursor: 'pointer',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <WT size={13} weight={500}>{system.name}</WT>
              <WT size={12} color="ink-soft">{system.description ?? '—'}</WT>
            </div>
          ))}
        </WBox>
      )}
    </div>
  )
}
