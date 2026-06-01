'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getSystem,
  listSystems,
  listSystemMembers,
  type System,
  type SystemMember,
} from '@/contexts/asset_registry/api'
import { useBreadcrumbLabel } from '@/contexts/navigation/breadcrumbLabel'

export default function SystemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const systemId = params?.systemId as string

  const { setEntityLabel } = useBreadcrumbLabel()

  const [system, setSystem] = useState<System | null>(null)
  const [childSystems, setChildSystems] = useState<System[]>([])
  const [members, setMembers] = useState<SystemMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      try {
        const [systemData, allSystems, memberData] = await Promise.all([
          getSystem(projectId, systemId),
          listSystems(projectId, { include_descendants: true }),
          listSystemMembers(projectId, systemId),
        ])
        setSystem(systemData)
        setEntityLabel(systemData.name)
        setChildSystems(allSystems.filter(s => s.parent_system_id === systemId))
        setMembers(memberData)
      } catch {
        setError('Failed to load system.')
      } finally {
        setLoading(false)
      }
    })
  }, [projectId, systemId, router, setEntityLabel])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  if (error || !system) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>{error ?? 'System not found.'}</span>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .sydp-page { padding: 32px; max-width: 800px; margin: 0 auto; }
        .sydp-back { font-size: 0.875rem; color: var(--bp-text-secondary); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 4px; }
        .sydp-back:hover { color: var(--bp-text-primary); }
        .sydp-h1 { font-size: 1.5rem; font-weight: 600; color: var(--bp-text-primary); margin: 0 0 8px 0; }
        .sydp-desc { font-size: 0.875rem; color: var(--bp-text-secondary); margin-bottom: 24px; }
        .sydp-section { margin-top: 24px; }
        .sydp-section-title { font-size: 0.875rem; font-weight: 600; color: var(--bp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .sydp-link { font-size: 0.875rem; color: var(--bp-accent); text-decoration: none; display: block; padding: 6px 10px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .sydp-link:hover { text-decoration: underline; background: var(--bp-bg-tertiary); }
        .sydp-member-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 4px; background: var(--bp-bg-secondary); margin-bottom: 4px; }
        .sydp-member-tag { font-family: monospace; font-size: 0.875rem; font-weight: 600; color: var(--bp-text-primary); min-width: 80px; }
        .sydp-member-name { flex: 1; font-size: 0.875rem; color: var(--bp-text-secondary); }
        .sydp-empty { font-size: 0.875rem; color: var(--bp-text-secondary); }
        .sydp-action-link { display: inline-flex; align-items: center; gap: 4px; padding: 8px 16px; background: var(--bp-accent); color: white; border-radius: 4px; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
        .sydp-action-link:hover { opacity: 0.9; }
      `}</style>
      <div className="sydp-page">
        <button className="sydp-back" onClick={() => router.push(`/project/${projectId}/systems`)}>
          ← Back to Systems
        </button>

        <h1 className="sydp-h1">{system.name}</h1>
        {system.description && <div className="sydp-desc">{system.description}</div>}

        {childSystems.length > 0 && (
          <div className="sydp-section">
            <div className="sydp-section-title">Child Systems</div>
            {childSystems.map(child => (
              <Link key={child.id} className="sydp-link" href={`/project/${projectId}/systems/${child.id}`}>
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <div className="sydp-section">
          <div className="sydp-section-title">Member Assets ({members.length})</div>
          {members.length === 0 ? (
            <div className="sydp-empty">No member assets.</div>
          ) : (
            members.map(member => (
              <Link key={member.id} className="sydp-link" href={`/project/${projectId}/assets/${member.id}`}>
                <span className="sydp-member-tag">{member.tag}</span>
                {member.name && <span className="sydp-member-name">{member.name}</span>}
              </Link>
            ))
          )}
        </div>

        <div className="sydp-section">
          <Link className="sydp-action-link" href={`/project/${projectId}/assets?system=${systemId}`}>
            View Assets in this System →
          </Link>
        </div>
      </div>
    </>
  )
}
