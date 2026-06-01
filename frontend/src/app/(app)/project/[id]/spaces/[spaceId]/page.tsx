'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSpace, listSpaces, type Space } from '@/contexts/asset_registry/api'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'
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
} from '@/lib/frontend-kit'

function SpaceDetailContent({ projectId, spaceId }: { projectId: string; spaceId: string }) {
  const router = useRouter()
  const { setEntityLabel } = useBreadcrumbLabel()
  const [space, setSpace] = useState<Space | null>(null)
  const [parentSpace, setParentSpace] = useState<Space | null>(null)
  const [childSpaces, setChildSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getSpace(projectId, spaceId), listSpaces(projectId)])
      .then(([spaceData, allSpaces]) => {
        setSpace(spaceData)
        setEntityLabel(spaceData.name)
        setChildSpaces(allSpaces.filter(s => s.parent_space_id === spaceId))
        if (spaceData.parent_space_id) {
          setParentSpace(allSpaces.find(s => s.id === spaceData.parent_space_id) ?? null)
        }
        setLoading(false)
      })
      .catch(() => { setError('Failed to load space.'); setLoading(false) })
  }, [projectId, spaceId, setEntityLabel])

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

  if (error || !space) {
    return (
      <WFrame style={{ padding: 24 }}>
        <WEmpty title="Space not found" subtitle={error ?? 'This space may have been deleted.'} />
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
        <WSectionLabel tone="primary">Setup · Spaces</WSectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <WPill tone="ink" size="sm">{space.kind}</WPill>
          <WH size={22}>{space.name}</WH>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {parentSpace && (
          <div>
            <WSectionLabel tone="ink" style={{ marginBottom: 8 }}>Parent Space</WSectionLabel>
            <WBox style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => router.push(`/project/${projectId}/spaces/${parentSpace.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <WPill tone="ink" size="sm">{parentSpace.kind}</WPill>
                <WT size={13} weight={500}>{parentSpace.name}</WT>
              </div>
            </WBox>
          </div>
        )}

        {childSpaces.length > 0 && (
          <div>
            <WSectionLabel tone="ink" style={{ marginBottom: 8 }}>Child Spaces ({childSpaces.length})</WSectionLabel>
            <WBox style={{ padding: 0, overflow: 'hidden' }}>
              {childSpaces.map((child, i) => (
                <div
                  key={child.id}
                  onClick={() => router.push(`/project/${projectId}/spaces/${child.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: i < childSpaces.length - 1 ? '1px solid var(--ui-line)' : 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <WPill tone="ink" size="sm">{child.kind}</WPill>
                  <WT size={13} weight={500}>{child.name}</WT>
                </div>
              ))}
            </WBox>
          </div>
        )}

        <div>
          <WBtn tone="primary" onClick={() => router.push(`/project/${projectId}/assets?space=${spaceId}`)}>
            View Assets in this Space →
          </WBtn>
        </div>
      </div>
    </WFrame>
  )
}

function SpaceDetailPageInner() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const spaceId = params?.spaceId as string
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

  return <SpaceDetailContent projectId={projectId} spaceId={spaceId} />
}

export default function SpaceDetailPage() {
  return (
    <Suspense>
      <SpaceDetailPageInner />
    </Suspense>
  )
}
