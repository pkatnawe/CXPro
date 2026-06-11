'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  listTemplates,
  type Template,
  type TemplateLevel,
} from '@/contexts/commissioning_execution/api'
import {
  WFrame,
  WH,
  WT,
  WPill,
  WBtn,
  WSectionLabel,
  WSkeleton,
  WEmpty,
  WBox,
  WStamp,
} from '@/lib/frontend-kit'

const LEVELS: TemplateLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5']

const LEVEL_TONE: Record<TemplateLevel, 'ok' | 'primary' | 'ink' | 'warn'> = {
  L1: 'ink',
  L2: 'primary',
  L3: 'ok',
  L4: 'ok',
  L5: 'warn',
}

function TemplatesContent({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLevel, setActiveLevel] = useState<TemplateLevel | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listTemplates(projectId, activeLevel ? { level: activeLevel } : undefined)
    setTemplates(data)
    setLoading(false)
  }, [projectId, activeLevel])

  useEffect(() => { load() }, [load])

  const filtered = templates

  return (
    <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-panel)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <WSectionLabel tone="primary">Templates</WSectionLabel>
            <WH size={22} style={{ marginTop: 4 }}>Checklist Template Library</WH>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <WT size={11} mono color="ink-faint" style={{ marginRight: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>Level</WT>
          <button
            onClick={() => setActiveLevel(null)}
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: activeLevel === null ? 'var(--ui-primary)' : 'var(--ui-line-strong)',
              background: activeLevel === null ? 'var(--ui-primary-soft)' : 'transparent',
              color: activeLevel === null ? 'var(--ui-primary)' : 'var(--ui-ink-soft)',
              fontSize: 12,
              fontWeight: activeLevel === null ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level === activeLevel ? null : level)}
              style={{
                padding: '3px 10px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: activeLevel === level ? 'var(--ui-primary)' : 'var(--ui-line-strong)',
                background: activeLevel === level ? 'var(--ui-primary-soft)' : 'transparent',
                color: activeLevel === level ? 'var(--ui-primary)' : 'var(--ui-ink-soft)',
                fontSize: 12,
                fontWeight: activeLevel === level ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {loading ? (
          <WBox style={{ padding: 0, overflow: 'hidden' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-line)', display: 'flex', gap: 16, alignItems: 'center' }}>
                <WSkeleton width={40} />
                <WSkeleton width={220} />
                <WSkeleton width={80} />
                <WSkeleton width={100} />
              </div>
            ))}
          </WBox>
        ) : filtered.length === 0 ? (
          <WEmpty
            title="No templates found"
            subtitle={activeLevel ? `No ${activeLevel} templates exist yet.` : 'No test procedure templates have been created.'}
          />
        ) : (
          <WBox style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1.8fr 80px 1fr',
              padding: '8px 16px',
              borderBottom: '1px solid var(--ui-line)',
              background: 'var(--ui-panel-2)',
            }}>
              {['Level', 'Name', 'Steps', 'Description'].map(h => (
                <WT key={h} size={10.5} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</WT>
              ))}
            </div>
            {filtered.map((tmpl, i) => (
              <div
                key={tmpl.id}
                data-testid="template-row"
                onClick={() => router.push(`/project/${projectId}/test-procedure-templates/${tmpl.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1.8fr 80px 1fr',
                  padding: '10px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--ui-line)' : 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <WStamp k="lv" v={tmpl.level} />
                <WT size={13} weight={500}>{tmpl.name}</WT>
                <WT size={12} color="ink-soft">{Array.isArray(tmpl.steps) ? tmpl.steps.length : '—'}</WT>
                <WT size={12} color="ink-soft" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tmpl.description ?? '—'}
                </WT>
              </div>
            ))}
          </WBox>
        )}
      </div>
    </WFrame>
  )
}

function TemplatesPageInner() {
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

  return <TemplatesContent projectId={projectId} />
}

export default function TestProcedureTemplatesPage() {
  return (
    <Suspense>
      <TemplatesPageInner />
    </Suspense>
  )
}
