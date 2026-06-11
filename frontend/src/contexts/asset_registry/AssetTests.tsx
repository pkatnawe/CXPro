'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  listInstances,
  listTemplates,
  type Instance,
  type Template,
} from '@/contexts/commissioning_execution/api'
import {
  WT,
  WH,
  WPill,
  WSectionLabel,
  WSkeleton,
  WEmpty,
  WBox,
  WStamp,
} from '@/lib/frontend-kit'

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'ink' | 'primary'> = {
  complete: 'ok',
  in_progress: 'primary',
  pending: 'ink',
}

const TEST_LEVELS = ['L3', 'L4', 'L5']

interface Props {
  projectId: string
  assetId: string
}

export function AssetTests({ projectId, assetId }: Props) {
  const [instances, setInstances] = useState<Instance[]>([])
  const [templateMap, setTemplateMap] = useState(new Map<string, Template>())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [allInstances, templates] = await Promise.all([
      listInstances(projectId, { asset_id: assetId }),
      listTemplates(projectId),
    ])
    const tests = allInstances.filter(i => TEST_LEVELS.includes(i.level))
    setInstances(tests)
    setTemplateMap(new Map(templates.map(t => [t.id, t])))
    setLoading(false)
  }, [projectId, assetId])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: 'var(--ui-bg)' }}>
      <div style={{ marginBottom: 12 }}>
        <WSectionLabel tone="primary">
          {loading ? 'Tests' : `${instances.length} functional test${instances.length !== 1 ? 's' : ''}`}
        </WSectionLabel>
        <WH size={18} style={{ marginTop: 6 }}>L3 / L4 / L5 Test Procedures</WH>
      </div>

      {loading ? (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--ui-line)', display: 'flex', gap: 16 }}>
              <WSkeleton width={40} />
              <WSkeleton width={180} />
              <WSkeleton width={80} />
              <WSkeleton width={100} />
            </div>
          ))}
        </WBox>
      ) : instances.length === 0 ? (
        <WEmpty
          title="No tests scheduled"
          subtitle="L3–L5 functional test procedure instances will appear here once assigned."
        />
      ) : (
        <WBox style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1.4fr 120px 110px',
            padding: '8px 14px',
            borderBottom: '1px solid var(--ui-line)',
            background: 'var(--ui-panel-2)',
          }}>
            {['Level', 'Template', 'Status', 'Created'].map(h => (
              <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
            ))}
          </div>
          {instances.map((inst, i) => {
            const tmpl = templateMap.get(inst.template_id)
            const tone = STATUS_TONE[inst.status] ?? 'ink'
            return (
              <div
                key={inst.id}
                data-testid="test-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1.4fr 120px 110px',
                  padding: '9px 14px',
                  borderBottom: i < instances.length - 1 ? '1px solid var(--ui-line)' : 'none',
                  alignItems: 'center',
                }}
              >
                <WStamp k="lv" v={inst.level} />
                <WT size={13} weight={500}>{tmpl?.name ?? inst.template_id}</WT>
                <WPill tone={tone} filled size="sm">{inst.status}</WPill>
                <WT size={11.5} color="ink-soft">{new Date(inst.created_at).toLocaleDateString()}</WT>
              </div>
            )
          })}
        </WBox>
      )}
    </div>
  )
}
