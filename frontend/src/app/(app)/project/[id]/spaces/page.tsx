'use client'

import { useParams, useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { listSpaces, createSpace, type Space, type SpaceKind, SPACE_KINDS } from '@/contexts/asset_registry/api'
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

function buildTree(spaces: Space[]): (Space & { depth: number })[] {
  const map = new Map<string, Space>(spaces.map(s => [s.id, s]))
  const result: (Space & { depth: number })[] = []

  function visit(s: Space, depth: number) {
    result.push({ ...s, depth })
    spaces
      .filter(c => c.parent_space_id === s.id)
      .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
      .forEach(c => visit(c, depth + 1))
  }

  spaces
    .filter(s => !s.parent_space_id)
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    .forEach(s => visit(s, 0))

  return result
}

function SpacesContent({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formKind, setFormKind] = useState<SpaceKind>('floor')
  const [formParent, setFormParent] = useState('')
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listSpaces(projectId)
    setSpaces(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Name is required'); return }
    setFormSaving(true)
    setFormError('')
    try {
      await createSpace(projectId, {
        name: formName.trim(),
        kind: formKind,
        parent_space_id: formParent || null,
        ordinal: null,
      })
      setShowForm(false)
      load()
    } catch {
      setFormError('Failed to create space.')
    } finally {
      setFormSaving(false)
    }
  }

  const tree = buildTree(spaces)

  return (
    <WFrame style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ui-bg)' }}>
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--ui-line)',
        background: 'var(--ui-panel)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <WSectionLabel tone="primary">Setup</WSectionLabel>
          <WH size={22} style={{ marginTop: 4 }}>Spaces</WH>
        </div>
        <WBtn tone="primary" onClick={() => { setShowForm(true); setFormName(''); setFormKind('floor'); setFormParent(''); setFormError('') }}>
          + Add Space
        </WBtn>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {loading ? (
          <WBox style={{ padding: 0, overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--ui-line)', display: 'flex', gap: 16 }}>
                <WSkeleton width={50} />
                <WSkeleton width={180} />
              </div>
            ))}
          </WBox>
        ) : spaces.length === 0 ? (
          <WEmpty title="No spaces defined" subtitle="Add buildings, floors, and rooms using the button above." />
        ) : (
          <WBox style={{ padding: 0, overflow: 'hidden' }}>
            {tree.map((s, i) => (
              <div
                key={s.id}
                data-testid="space-row"
                onClick={() => router.push(`/project/${projectId}/spaces/${s.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  paddingLeft: 16 + s.depth * 20,
                  borderBottom: i < tree.length - 1 ? '1px solid var(--ui-line)' : 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ui-panel-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <WPill tone="ink" size="sm">{s.kind}</WPill>
                <WT size={13} weight={500}>{s.name}</WT>
              </div>
            ))}
          </WBox>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <WBox style={{ width: '100%', maxWidth: 440, padding: 24 }}>
            <WH size={15} style={{ marginBottom: 16 }}>Add Space</WH>
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: 12 }}>
                <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>Name *</WT>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ui-line-strong)', borderRadius: 6, fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>Kind</WT>
                <select value={formKind} onChange={e => setFormKind(e.target.value as SpaceKind)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ui-line-strong)', borderRadius: 6, fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)' }}>
                  {SPACE_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <WT size={11} mono color="ink-faint" style={{ textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>Parent Space</WT>
                <select value={formParent} onChange={e => setFormParent(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ui-line-strong)', borderRadius: 6, fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)' }}>
                  <option value="">— None (top level) —</option>
                  {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {formError && <WT size={12} color="warn" style={{ display: 'block', marginBottom: 10 }}>{formError}</WT>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <WBtn variant="ghost" onClick={() => setShowForm(false)} disabled={formSaving}>Cancel</WBtn>
                <WBtn tone="primary" disabled={formSaving}>{formSaving ? 'Saving…' : 'Save'}</WBtn>
              </div>
            </form>
          </WBox>
        </div>
      )}
    </WFrame>
  )
}

function SpacesPageInner() {
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

  return <SpacesContent projectId={projectId} />
}

export default function SpacesPage() {
  return (
    <Suspense>
      <SpacesPageInner />
    </Suspense>
  )
}
