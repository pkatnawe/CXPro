'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CommandPalette from '@/components/CommandPalette'
import AiChatDrawer from '@/components/AiChatDrawer'
import ActivityTab from '@/components/ActivityTab'
import CitationChip from '@/components/CitationChip'
import './entity.css'

interface TestProcedureInstance {
  id: string
  project_id: string
  document_id: string | null
  extracted_spec_id: string | null
  agent_run_id: string | null
  equipment_type: string
  manufacturer: string | null
  model: string | null
  asset_tag: string | null
  status: 'draft' | 'active' | 'completed' | 'archived'
  actor_type: 'ai' | 'human'
  body: {
    sections: Array<{
      title: string
      steps: Array<{
        id: string
        content: string
        citations?: string[]
      }>
    }>
  }
  created_at: string
  updated_at: string
  org_id: string
}

interface Citation {
  id: string
  test_procedure_instance_id: string
  document_chunk_id: string
  step_id: string
  citation_text: string
  confidence_score: number
  page_number: number | null
  bbox: {
    x: number
    y: number
    width: number
    height: number
  } | null
}

interface Document {
  id: string
  name: string
  file_path: string
}

interface AgentRun {
  id: string
  agent_type: string
  status: string
  refusal_reason: string | null
  created_at: string
  completed_at: string | null
  input: Record<string, unknown>
  output: Record<string, unknown>
  model_version: string
  token_cost: {
    input_tokens: number
    output_tokens: number
    total_cost: number
  } | null
}

interface User {
  id: string
  email: string
  role: 'OCA' | 'cx_engineer'
}

export default function EntityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const entityId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [testProcedure, setTestProcedure] = useState<TestProcedureInstance | null>(null)
  const [citations, setCitations] = useState<Citation[]>([])
  const [document, setDocument] = useState<Document | null>(null)
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null)
  const [loading, setLoading] = useState(true)

  // UI state
  const [rightDrawerTab, setRightDrawerTab] = useState<'chat' | 'activity'>('chat')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Check auth and load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check auth
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth')
          return
        }

        // Get user role
        const { data: participation } = await supabase
          .from('participations')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: participation?.role || 'cx_engineer'
        })

        // Load test procedure instance
        const { data: testProc, error: testProcError } = await supabase
          .from('test_procedure_instances')
          .select('*')
          .eq('id', entityId)
          .single()

        if (testProcError || !testProc) {
          console.error('Error loading test procedure:', testProcError)
          router.push('/inbox')
          return
        }

        setTestProcedure(testProc)

        // Load citations
        const { data: citationsData } = await supabase
          .from('citations')
          .select('*')
          .eq('test_procedure_instance_id', entityId)

        setCitations(citationsData || [])

        // Load document if exists
        if (testProc.document_id) {
          const { data: doc } = await supabase
            .from('documents')
            .select('id, name, file_path')
            .eq('id', testProc.document_id)
            .single()

          setDocument(doc)
        }

        // Load agent run if exists
        if (testProc.agent_run_id) {
          const { data: run } = await supabase
            .from('agent_runs')
            .select('*')
            .eq('id', testProc.agent_run_id)
            .single()

          setAgentRun(run)
        }

      } catch (error) {
        console.error('Error loading entity data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [entityId, router])

  // Keyboard shortcut for Cmd-K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAcceptDraft = async () => {
    if (!testProcedure || !user || user.role !== 'OCA') return

    try {
      // Update test procedure status
      const { error: updateError } = await supabase
        .from('test_procedure_instances')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', testProcedure.id)

      if (updateError) throw updateError

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('audit_log_entries')
        .insert({
          project_id: testProcedure.project_id,
          actor_type: 'human',
          actor_id: user.id,
          action: 'accepted_draft',
          confirmed_ai_run_id: testProcedure.agent_run_id,
          metadata: {
            test_procedure_instance_id: testProcedure.id
          },
          org_id: testProcedure.org_id
        })

      if (auditError) throw auditError

      // Mark inbox item as acted
      const { error: inboxError } = await supabase
        .from('inbox_items')
        .update({
          action_state: 'acted',
          acted_at: new Date().toISOString()
        })
        .eq('test_procedure_instance_id', testProcedure.id)
        .eq('user_id', user.id)

      if (inboxError) throw inboxError

      // Emit event to outbox
      const { error: outboxError } = await supabase
        .from('outbox')
        .insert({
          event_type: 'TestProcedureInstanceActivated',
          payload: {
            test_procedure_instance_id: testProcedure.id,
            activated_by: user.id
          }
        })

      if (outboxError) throw outboxError

      // Update local state
      setTestProcedure(prev => prev ? { ...prev, status: 'active' } : null)

      // Navigate back to inbox
      router.push('/inbox')
    } catch (error) {
      console.error('Error accepting draft:', error)
      alert('Failed to accept draft. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="bp-app">
        <div className="bp-loading">Loading test procedure...</div>
      </div>
    )
  }

  if (!testProcedure) {
    return (
      <div className="bp-app">
        <div className="bp-error">Test procedure not found</div>
      </div>
    )
  }

  return (
    <div className="bp-app">
      {/* Left Sidebar Navigation */}
      <nav className="bp-sidebar">
        <div className="bp-brand" onClick={() => router.push('/dashboard')}>
          <div className="bp-brand-mark">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <div>
            <div className="bp-brand-name">CX·PRO</div>
            <div className="bp-brand-sub">COMMISSIONING</div>
          </div>
        </div>

        <div className="bp-nav">
          <button 
            className="bp-nav-item"
            onClick={() => router.push('/inbox')}
          >
            <span className="bp-nav-icon">📥</span>
            <span>Inbox</span>
          </button>
          <button 
            className="bp-nav-item"
            onClick={() => router.push('/dashboard')}
          >
            <span className="bp-nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button 
            className="bp-nav-item is-active"
          >
            <span className="bp-nav-icon">✓</span>
            <span>Checklists</span>
          </button>
          <button className="bp-nav-item">
            <span className="bp-nav-icon">⚙️</span>
            <span>Equipment</span>
          </button>
        </div>

        <div className="bp-nav-bottom">
          <button 
            className="bp-nav-item"
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/auth')
            }}
          >
            <span className="bp-nav-icon">↩</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="bp-main">
        {/* Top Bar */}
        <header className="bp-topbar">
          <div className="bp-breadcrumb">
            <button onClick={() => router.push('/inbox')}>Inbox</button>
            <span className="bp-breadcrumb-sep">/</span>
            <span>Test Procedure</span>
          </div>

          <div className="bp-topbar-right">
            <button 
              className="bp-search"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <span className="bp-search-icon">🔍</span>
              <span className="bp-search-text">Search</span>
              <span className="bp-kbd">⌘K</span>
            </button>
            <div className="bp-user-avatar">
              {user?.email.split(' ').map(s => s[0]).join('').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Entity Content + Right Drawer */}
        <div className="bp-entity-layout">
          {/* Center: Entity Detail */}
          <div className="bp-entity-content">
            {/* Entity Header */}
            <div className="bp-entity-header">
              <div className="bp-entity-meta">
                <span className="bp-entity-type">TEST PROCEDURE</span>
                {testProcedure.status === 'draft' && (
                  <span className="bp-status-badge bp-status-draft">DRAFT</span>
                )}
                {testProcedure.status === 'active' && (
                  <span className="bp-status-badge bp-status-active">ACTIVE</span>
                )}
                {testProcedure.actor_type === 'ai' && (
                  <span className="bp-ai-badge">
                    <span className="bp-ai-icon">⚡</span> AI Generated
                  </span>
                )}
              </div>
              
              <h1 className="bp-entity-title">
                {testProcedure.equipment_type}
                {testProcedure.asset_tag && (
                  <span className="bp-asset-tag bp-mono">{testProcedure.asset_tag}</span>
                )}
              </h1>
              
              <div className="bp-entity-details">
                {testProcedure.manufacturer && (
                  <span>{testProcedure.manufacturer}</span>
                )}
                {testProcedure.model && (
                  <>
                    <span className="bp-dot">•</span>
                    <span className="bp-mono">{testProcedure.model}</span>
                  </>
                )}
                {document && (
                  <>
                    <span className="bp-dot">•</span>
                    <span>Source: {document.name}</span>
                  </>
                )}
              </div>

              {/* Accept Draft Button (OCA only) */}
              {testProcedure.status === 'draft' && user?.role === 'OCA' && (
                <div className="bp-entity-actions">
                  <button 
                    className="bp-btn-primary"
                    onClick={handleAcceptDraft}
                  >
                    Accept Draft
                  </button>
                  <button className="bp-btn-ghost">Request Changes</button>
                </div>
              )}

              {/* Refusal State */}
              {agentRun?.status === 'refused' && (
                <div className="bp-refusal-card">
                  <div className="bp-refusal-icon">⚠️</div>
                  <div className="bp-refusal-content">
                    <div className="bp-refusal-title">AI needs more information</div>
                    <div className="bp-refusal-reason">{agentRun.refusal_reason}</div>
                    <button 
                      className="bp-btn-ghost"
                      onClick={() => router.push(`/project/${testProcedure.project_id}`)}
                    >
                      Provide more info →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist Sections */}
            <div className="bp-checklist-sections">
              {testProcedure.body.sections.map((section, sectionIdx) => (
                <div key={sectionIdx} className="bp-checklist-section">
                  <h2 className="bp-section-title">{section.title}</h2>
                  
                  <div className="bp-checklist-steps">
                    {section.steps.map((step) => {
                      const stepCitations = citations.filter(c => c.step_id === step.id)
                      
                      return (
                        <div key={step.id} className="bp-checklist-step">
                          <div className="bp-step-number bp-mono">{step.id}</div>
                          <div className="bp-step-content">
                            <div className="bp-step-text">{step.content}</div>
                            
                            {stepCitations.length > 0 && (
                              <div className="bp-step-citations">
                                {stepCitations.map(citation => (
                                  <CitationChip
                                    key={citation.id}
                                    citation={citation}
                                    document={document}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI Chat / Activity Drawer */}
          <div className="bp-right-drawer">
            <div className="bp-drawer-tabs">
              <button 
                className={`bp-drawer-tab ${rightDrawerTab === 'chat' ? 'is-active' : ''}`}
                onClick={() => setRightDrawerTab('chat')}
              >
                AI Chat
              </button>
              <button 
                className={`bp-drawer-tab ${rightDrawerTab === 'activity' ? 'is-active' : ''}`}
                onClick={() => setRightDrawerTab('activity')}
              >
                Activity
              </button>
            </div>

            <div className="bp-drawer-content">
              {rightDrawerTab === 'chat' && (
                <AiChatDrawer 
                  testProcedureId={testProcedure.id}
                  agentRunId={testProcedure.agent_run_id}
                  orgId={testProcedure.org_id}
                  userId={user?.id}
                />
              )}
              {rightDrawerTab === 'activity' && (
                <ActivityTab 
                  projectId={testProcedure.project_id}
                  testProcedureId={testProcedure.id}
                  agentRunId={testProcedure.agent_run_id}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  )
}