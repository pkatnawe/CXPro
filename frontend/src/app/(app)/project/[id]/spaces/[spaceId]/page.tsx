'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getSpace,
  listSpaces,
  type Space,
} from '@/contexts/asset_registry/api'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'

export default function SpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const spaceId = params?.spaceId as string

  const { setEntityLabel } = useBreadcrumbLabel()

  const [space, setSpace] = useState<Space | null>(null)
  const [parentSpace, setParentSpace] = useState<Space | null>(null)
  const [childSpaces, setChildSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      try {
        const [spaceData, allSpaces] = await Promise.all([
          getSpace(projectId, spaceId),
          listSpaces(projectId),
        ])
        setSpace(spaceData)
        setEntityLabel(spaceData.name)
        setChildSpaces(allSpaces.filter(s => s.parent_space_id === spaceId))
        if (spaceData.parent_space_id) {
          const parent = allSpaces.find(s => s.id === spaceData.parent_space_id)
          setParentSpace(parent ?? null)
        }
      } catch {
        setError('Failed to load space.')
      } finally {
        setLoading(false)
      }
    })
  }, [projectId, spaceId, router, setEntityLabel])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  if (error || !space) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>{error ?? 'Space not found.'}</span>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .sdp-page { padding: 32px; max-width: 800px; margin: 0 auto; }
        .sdp-back { font-size: 0.875rem; color: var(--bp-text-secondary); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 4px; }
        .sdp-back:hover { color: var(--bp-text-primary); }
        .sdp-header { margin-bottom: 24px; }
        .sdp-kind-badge { font-size: 0.65rem; text-transform: uppercase; background: var(--bp-bg-tertiary); color: var(--bp-text-secondary); padding: 2px 6px; border-radius: 3px; margin-right: 8px; }
        .sdp-h1 { font-size: 1.5rem; font-weight: 600; color: var(--bp-text-primary); margin: 8px 0 0 0; }
        .sdp-section { margin-top: 24px; }
        .sdp-section-title { font-size: 0.875rem; font-weight: 600; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .sdp-link { font-size: 0.875rem; color: var(--bp-accent); text-decoration: none; display: block; padding: 6px 10px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .sdp-link:hover { text-decoration: underline; background: var(--bp-bg-tertiary); }
        .sdp-empty { font-size: 0.875rem; color: var(--bp-text-secondary); }
        .sdp-action-link { display: inline-flex; align-items: center; gap: 4px; padding: 8px 16px; background: var(--bp-accent); color: white; border-radius: 4px; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
        .sdp-action-link:hover { opacity: 0.9; }
      `}</style>
      <div className="sdp-page">
        <button className="sdp-back" onClick={() => router.push(`/project/${projectId}/spaces`)}>
          ← Back to Spaces
        </button>

        <div className="sdp-header">
          <span className="sdp-kind-badge">{space.kind}</span>
          <h1 className="sdp-h1">{space.name}</h1>
        </div>

        {parentSpace && (
          <div className="sdp-section">
            <div className="sdp-section-title">Parent Space</div>
            <Link className="sdp-link" href={`/project/${projectId}/spaces/${parentSpace.id}`}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--bp-text-secondary)', marginRight: 6 }}>{parentSpace.kind}</span>
              {parentSpace.name}
            </Link>
          </div>
        )}

        {childSpaces.length > 0 && (
          <div className="sdp-section">
            <div className="sdp-section-title">Child Spaces</div>
            {childSpaces.map(child => (
              <Link key={child.id} className="sdp-link" href={`/project/${projectId}/spaces/${child.id}`}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--bp-text-secondary)', marginRight: 6 }}>{child.kind}</span>
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <div className="sdp-section">
          <Link className="sdp-action-link" href={`/project/${projectId}/assets?space=${spaceId}`}>
            View Assets in this Space →
          </Link>
        </div>
      </div>
    </>
  )
}
