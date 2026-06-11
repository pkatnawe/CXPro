'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSystem, listSystems, listSystemMembers, type System, type SystemMember } from '@/contexts/asset_registry/api'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'
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

function SystemDetailContent({ projectId, systemId }: { projectId: string; systemId: string }) {
  const router = useRouter()
  const { setEntityLabel } = useBreadcrumbLabel()
  const [system, setSystem] = useState<System | null>(null)
  const [childSystems, setChildSystems] = useState<System[]>([])
  const [members, setMembers] = useState<SystemMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getSystem(projectId, systemId),
      listSystems(projectId, { include_descendants: true }),
      listSystemMembers(projectId, systemId),
    ]).then(([systemData, allSystems, memberData]) => {
      setSystem(systemData)
      setEntityLabel(systemData.name)
      setChildSystems(allSystems.filter(s => s.parent_system_id === systemId))
      setMembers(memberData)
      setLoading(false)
    }).catch(() => { setError('Failed to load system.'); setLoading(false) })
  }, [projectId, systemId, setEntityLabel])

  if (loading) {
    return (
      <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--ui-line)', background: 'var(--ui-panel)' }}>
          <WSkeleton width={200} height="28px" />
        </div>
        <div style={{ padding: 18 }}><WSkeleton width="100%" height="80px" /></div>
      </WFrame>
    )
  }

  if (error || !system) {
    return (
      <WFrame style={{ padding: 24 }}>
        <WEmpty title="System not found" subtitle={error ?? 'This system may have been deleted.'} />
      </WFrame>
    )
  }

  return (
    <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-panel)',
        flexShrink: 0,
      }}>
        <WSectionLabel tone="primary">Setup · Systems</WSectionLabel>
        <WH size={22} style={{ marginTop: 4 }}>{system.name}</WH>
        {system.description && (
          <WT size={13} color="ink-soft" style={{ marginTop: 6 }}>{system.description}</WT>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {childSystems.length > 0 && (
          <div>
            <WSectionLabel tone="ink" style={{ marginBottom: 8 }}>Child Systems ({childSystems.length})</WSectionLabel>
            <WBox style={{ padding: 0, overflow: 'hidden' }}>
              {childSystems.map((child, i) => (
                <div
                  key={child.id}
                  onClick={() => router.push(`/project/${projectId}/systems/${child.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: i < childSystems.length - 1 ? '1px solid var(--ui-line)' : 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <WT size={13} weight={500}>{child.name}</WT>
                  {child.description && <WT size={12} color="ink-soft">{child.description}</WT>}
                </div>
              ))}
            </WBox>
          </div>
        )}

        <div>
          <WSectionLabel tone="ink" style={{ marginBottom: 8 }}>Member Assets ({members.length})</WSectionLabel>
          {members.length === 0 ? (
            <WEmpty title="No member assets" subtitle="Assets in this system will appear here." />
          ) : (
            <WBox style={{ padding: 0, overflow: 'hidden' }}>
              {members.map((member, i) => (
                <div
                  key={member.id}
                  onClick={() => router.push(`/project/${projectId}/assets/${member.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: i < members.length - 1 ? '1px solid var(--ui-line)' : 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <WT size={12} mono weight={500}>{member.tag}</WT>
                  {member.name && <WT size={12.5} color="ink-soft">{member.name}</WT>}
                </div>
              ))}
            </WBox>
          )}
        </div>

        <div>
          <WBtn tone="primary" onClick={() => router.push(`/project/${projectId}/assets?system=${systemId}`)}>
            View Assets in this System →
          </WBtn>
        </div>
      </div>
    </WFrame>
  )
}

function SystemDetailPageInner() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const systemId = params?.systemId as string
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

  return <SystemDetailContent projectId={projectId} systemId={systemId} />
}

export default function SystemDetailPage() {
  return (
    <Suspense>
      <SystemDetailPageInner />
    </Suspense>
  )
}
