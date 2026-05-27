'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CommandPalette from '@/components/CommandPalette'
import AiChatDrawer from '@/components/AiChatDrawer'
import ActivityTab from '@/components/ActivityTab'
import CitationChip from '@/components/CitationChip'
import { getErrorMessage } from '@/lib/error'
import { canManageTeam, type Role } from '@/contexts/identity/api'

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
  role: Role
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
        const { data: participation, error: participationError } = await supabase
          .from('participations')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle()

        // If participation is null, the user doesn't have access to this entity
        if (!participation) {
          console.error('No participation found:', participationError)
          // Don't default to cx_engineer - show access error instead
          return
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: participation.role as Role
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
          const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('id, name, file_path')
            .eq('id', testProc.document_id)
            .single()

          if (docError) {
            console.error('Error loading document:', getErrorMessage(docError))
          } else {
            setDocument(doc)
          }
        }

        // Load agent run if exists
        if (testProc.agent_run_id) {
          const { data: run, error: runError } = await supabase
            .from('agent_runs')
            .select('*')
            .eq('id', testProc.agent_run_id)
            .single()

          if (runError) {
            console.error('Error loading agent run:', getErrorMessage(runError))
          } else {
            setAgentRun(run)
          }
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
    if (!testProcedure || !user || !canManageTeam(user.role)) return

    try {
      // Get inbox item ID if exists
      const { data: inboxItem } = await supabase
        .from('inbox_items')
        .select('id')
        .eq('test_procedure_instance_id', testProcedure.id)
        .eq('user_id', user.id)
        .maybeSingle()

      // Call the database function to handle the transaction
      const { error } = await supabase
        .rpc('accept_draft_test_procedure', {
          p_test_procedure_id: testProcedure.id,
          p_user_id: user.id,
          p_inbox_item_id: inboxItem?.id || null
        })

      if (error) throw error

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
      <div className="bp-loading">Loading test procedure...</div>
    )
  }

  // If no user after loading, they don't have access
  if (!user) {
    return (
      <div className="bp-error">You do not have access to this entity</div>
    )
  }

  if (!testProcedure) {
    return (
      <div className="bp-error">Test procedure not found</div>
    )
  }

  return (
    <>
      {/* Three-panel layout: main content + right drawer */}
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
            {testProcedure.status === 'draft' && canManageTeam(user?.role) && (
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
                userId={user?.id}
                orgId={testProcedure.org_id}
              />
            )}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <style jsx>{`
        .bp-entity-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          height: calc(100vh - 60px);
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .bp-entity-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
          }

          .bp-right-drawer {
            position: fixed;
            bottom: 0;
            left: 232px;
            right: 0;
            height: 40vh;
            border-top: 2px solid var(--bp-line);
            border-left: none !important;
          }
        }

        .bp-entity-content {
          overflow-y: auto;
          padding: 24px 32px;
        }

        .bp-entity-header {
          margin-bottom: 32px;
        }

        .bp-entity-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .bp-entity-type {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--bp-graphite);
          font-weight: 600;
        }

        .bp-status-badge {
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .bp-status-draft {
          background: var(--bp-amber);
          color: white;
        }

        .bp-status-active {
          background: var(--bp-ok);
          color: white;
        }

        .bp-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: var(--bp-blue-soft);
          color: var(--bp-blue);
          border-radius: 3px;
          font-size: 12px;
          font-weight: 500;
        }

        .bp-ai-icon {
          font-size: 12px;
        }

        .bp-entity-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .bp-asset-tag {
          font-size: 16px;
          color: var(--bp-graphite);
          font-weight: 400;
        }

        .bp-entity-details {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--bp-graphite);
          font-size: 14px;
        }

        .bp-dot {
          color: var(--bp-dim);
        }

        .bp-entity-actions {
          margin-top: 20px;
          display: flex;
          gap: 12px;
        }

        .bp-btn-primary {
          padding: 10px 20px;
          background: var(--bp-blue);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .bp-btn-primary:hover {
          background: #0E35D9;
          transform: translateY(-1px);
        }

        .bp-btn-ghost {
          padding: 10px 20px;
          background: transparent;
          color: var(--bp-graphite);
          border: 1px solid var(--bp-line-soft);
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .bp-btn-ghost:hover {
          background: var(--bp-card);
          border-color: var(--bp-line);
          color: var(--bp-ink);
        }

        .bp-refusal-card {
          margin-top: 20px;
          padding: 16px;
          background: var(--bp-warn-soft);
          border: 1px solid var(--bp-warn);
          border-radius: 4px;
          display: flex;
          gap: 12px;
        }

        .bp-refusal-icon {
          font-size: 24px;
        }

        .bp-refusal-content {
          flex: 1;
        }

        .bp-refusal-title {
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--bp-warn);
        }

        .bp-refusal-reason {
          color: var(--bp-ink);
          margin-bottom: 12px;
        }

        .bp-checklist-sections {
          margin-top: 32px;
        }

        .bp-checklist-section {
          margin-bottom: 32px;
        }

        .bp-section-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px dashed var(--bp-line-soft);
        }

        .bp-checklist-steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bp-checklist-step {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 16px;
          padding: 16px;
          background: var(--bp-card);
          border: 1px solid var(--bp-line-softer);
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .bp-checklist-step:hover {
          background: var(--bp-card-2);
          border-color: var(--bp-line-soft);
        }

        .bp-step-number {
          font-size: 16px;
          font-weight: 600;
          color: var(--bp-blue);
          text-align: center;
          line-height: 1.5;
        }

        .bp-mono {
          font-family: "JetBrains Mono", monospace !important;
        }

        .bp-step-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bp-step-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--bp-ink);
        }

        .bp-step-citations {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .bp-right-drawer {
          display: flex;
          flex-direction: column;
          background: var(--bp-card);
          border-left: 1px solid var(--bp-line-soft);
          overflow: hidden;
        }

        .bp-drawer-tabs {
          display: flex;
          border-bottom: 1px solid var(--bp-line-soft);
          background: var(--bp-paper-2);
        }

        .bp-drawer-tab {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          color: var(--bp-graphite);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          font-family: inherit;
        }

        .bp-drawer-tab:hover {
          background: var(--bp-card);
          color: var(--bp-ink);
        }

        .bp-drawer-tab.is-active {
          background: var(--bp-card);
          color: var(--bp-blue);
        }

        .bp-drawer-tab.is-active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--bp-blue);
        }

        .bp-drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .bp-loading, .bp-error {
          display: grid;
          place-items: center;
          height: calc(100vh - 120px);
          color: var(--bp-graphite);
          font-size: 14px;
        }
      `}</style>
    </>
  )
}