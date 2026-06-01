'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SpaceTree } from '@/contexts/asset_registry/ui'

export default function SpacesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth')
      } else {
        setReady(true)
      }
    })
  }, [router])

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--bp-text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .sp-page { padding: 32px; max-width: 800px; margin: 0 auto; }
        .sp-back { font-size: 0.875rem; color: var(--bp-text-secondary); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 4px; }
        .sp-back:hover { color: var(--bp-text-primary); }
        .sp-h1 { font-size: 1.5rem; font-weight: 600; color: var(--bp-text-primary); margin-bottom: 24px; }
      `}</style>
      <div className="sp-page">
        <button className="sp-back" onClick={() => router.push(`/project/${projectId}`)}>
          ← Back to Project
        </button>
        <h1 className="sp-h1">Space Tree</h1>
        <SpaceTree projectId={projectId} onNodeClick={(space) => router.push(`/project/${projectId}/spaces/${space.id}`)} />
      </div>
    </>
  )
}
