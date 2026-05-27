'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type Project } from '@/lib/supabase'
import { getProjectDashboard, type DashboardSummary, type AgentRunSummary } from '@/lib/dashboard'
import UploadModal from '@/components/UploadModal'
import { getErrorMessage } from '@/lib/error'
import { canManageTeam, type Role } from '@/contexts/identity/api'

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const loadProjectData = useCallback(async (userId: string) => {
    try {
      setLoading(true)

      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle()

      if (!projectData) {
        console.error('Project not found or no access:', getErrorMessage(projectError))
        // Don't redirect - show error message instead
        setProject(null)
        return
      }

      setProject(projectData)

      // Load user's role in this project's organization
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', projectData.org_id)
        .maybeSingle()

      if (!membershipData) {
        console.error('Membership not found:', getErrorMessage(membershipError))
        // Don't redirect - show error message instead
        setUserRole(null)
        return
      }

      setUserRole(membershipData.role as Role)

      // Load dashboard data
      const dashboardData = await getProjectDashboard(projectId)
      setDashboard(dashboardData)

    } catch (error) {
      console.error('Error loading project data:', error)
      router.push('/organization')
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    const initialize = async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/auth')
        return
      }

      setUser(session.user)
      await loadProjectData(session.user.id)
    }

    initialize()
  }, [projectId, router, loadProjectData])

  // Realtime subscription for status updates
  useEffect(() => {
    if (!project) return

    // Subscribe to test_procedure_instances updates
    const tpiSubscription = supabase
      .channel(`tpi-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_procedure_instances',
          filter: `project_id=eq.${projectId}`
        },
        async () => {
          // Reload dashboard data when TPIs change
          const dashboardData = await getProjectDashboard(projectId)
          setDashboard(dashboardData)
        }
      )
      .subscribe()

    // Subscribe to agent_runs updates
    const agentRunSubscription = supabase
      .channel(`agent-runs-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_runs'
        },
        async () => {
          // Reload dashboard data when agent runs change
          const dashboardData = await getProjectDashboard(projectId)
          setDashboard(dashboardData)
        }
      )
      .subscribe()

    // Subscribe to documents updates  
    const docsSubscription = supabase
      .channel(`docs-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`
        },
        async () => {
          // Reload dashboard data when documents change
          const dashboardData = await getProjectDashboard(projectId)
          setDashboard(dashboardData)
        }
      )
      .subscribe()

    return () => {
      tpiSubscription.unsubscribe()
      agentRunSubscription.unsubscribe()
      docsSubscription.unsubscribe()
    }
  }, [project, projectId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bp-status-success'
      case 'running':
      case 'in_progress':
        return 'bp-status-warning'
      case 'failed':
        return 'bp-status-error'
      case 'pending':
      case 'not_started':
      default:
        return 'bp-status-neutral'
    }
  }

  const formatAgentRunStatus = (run: AgentRunSummary) => {
    switch (run.status) {
      case 'completed':
        return 'Complete'
      case 'running':
        return 'Running'
      case 'failed':
        return 'Failed'
      case 'pending':
      default:
        return 'Pending'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="bp-screen">
        <style jsx>{`
          .bp-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .bp-loading {
            text-align: center;
          }
          .bp-spinner {
            display: inline-block;
            width: 48px;
            height: 48px;
            border: 3px solid var(--bp-border);
            border-top-color: var(--bp-accent);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .bp-loading-text {
            margin-top: 16px;
            color: var(--bp-text-secondary);
          }
        `}</style>
        <div className="bp-loading">
          <div className="bp-spinner" />
          <p className="bp-loading-text">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!project || !userRole) {
    return (
      <div className="bp-screen">
        <style jsx>{`
          .bp-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .bp-error-text {
            font-size: 1.25rem;
            color: var(--bp-text-secondary);
            margin-bottom: 24px;
          }
          .bp-btn-ghost {
            padding: 8px 16px;
            background: transparent;
            color: var(--bp-accent);
            border: 1px solid var(--bp-accent);
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
          }
          .bp-btn-ghost:hover {
            background: var(--bp-accent);
            color: white;
          }
        `}</style>
        <div>
          <p className="bp-error-text">You do not have access to this project</p>
          <a 
            href="/organization"
            className="bp-btn-ghost"
          >
            Back to Organization
          </a>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="bp-screen">
        <style jsx>{`
          .bp-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .bp-error-text {
            font-size: 1.25rem;
            color: var(--bp-text-secondary);
            margin-bottom: 24px;
          }
        `}</style>
        <div>
          <p className="bp-error-text">Unable to load project data</p>
        </div>
      </div>
    )
  }

  // Calculate total TPIs and completion percentage
  const totalTPIs = Object.values(dashboard.status_counts).reduce((sum, count) => sum + count, 0)
  const completedTPIs = dashboard.status_counts.completed || 0
  const completionPercentage = totalTPIs > 0 ? Math.round((completedTPIs / totalTPIs) * 100) : 0

  return (
    <>
      <style jsx>{`
        .bp-screen {
          min-height: 100vh;
          padding: 0;
        }

        .bp-page-head {
          padding: 32px;
          border-bottom: 1px solid var(--bp-border);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .bp-eyebrow {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--bp-text-secondary);
          margin-bottom: 8px;
        }

        .bp-h1 {
          font-size: 2rem;
          font-weight: 600;
          color: var(--bp-text-primary);
          margin: 0 0 8px 0;
        }

        .bp-subtle {
          font-size: 0.875rem;
          color: var(--bp-text-secondary);
        }

        .bp-page-tools {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .bp-btn-primary {
          padding: 10px 20px;
          background: var(--bp-accent);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bp-btn-primary:hover {
          background: var(--bp-accent-hover);
        }

        .bp-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bp-stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          padding: 32px;
        }

        .bp-stat-card {
          background: var(--bp-bg-secondary);
          border-radius: 8px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .bp-stat-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--bp-text-secondary);
          margin-bottom: 8px;
        }

        .bp-stat-value {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 8px;
        }

        .bp-stat-num {
          font-size: 2.5rem;
          font-weight: 600;
          color: var(--bp-text-primary);
          font-family: var(--font-jetbrains-mono);
        }

        .bp-stat-unit {
          font-size: 1.5rem;
          color: var(--bp-text-secondary);
        }

        .bp-stat-sub {
          font-size: 0.875rem;
          color: var(--bp-text-secondary);
        }

        .bp-stat-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--bp-border);
        }

        .bp-stat-bar i {
          display: block;
          height: 100%;
          background: var(--bp-accent);
          transition: width 0.5s ease;
        }

        .bp-section {
          padding: 32px;
        }

        .bp-section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--bp-text-primary);
          margin-bottom: 16px;
        }

        .bp-agent-runs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bp-agent-run {
          background: var(--bp-bg-secondary);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s;
        }

        .bp-agent-run:hover {
          background: var(--bp-bg-tertiary);
        }

        .bp-agent-run-info {
          flex: 1;
        }

        .bp-agent-run-equipment {
          font-weight: 500;
          color: var(--bp-text-primary);
          margin-bottom: 4px;
        }

        .bp-agent-run-meta {
          font-size: 0.875rem;
          color: var(--bp-text-secondary);
          display: flex;
          gap: 12px;
        }

        .bp-status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .bp-status-success {
          background: var(--bp-success-bg);
          color: var(--bp-success-text);
        }

        .bp-status-warning {
          background: var(--bp-warning-bg);
          color: var(--bp-warning-text);
        }

        .bp-status-error {
          background: var(--bp-error-bg);
          color: var(--bp-error-text);
        }

        .bp-status-neutral {
          background: var(--bp-bg-tertiary);
          color: var(--bp-text-secondary);
        }

        .bp-empty-state {
          text-align: center;
          padding: 48px;
          color: var(--bp-text-secondary);
        }

        .bp-empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          opacity: 0.5;
        }

        .bp-upload-icon {
          width: 16px;
          height: 16px;
        }

        .bp-ai-icon {
          width: 14px;
          height: 14px;
          display: inline-block;
          margin-right: 4px;
        }

        .bp-mono {
          font-family: var(--font-jetbrains-mono);
        }
      `}</style>

      <div className="bp-screen">
        <div className="bp-page-head">
          <div>
            <div className="bp-eyebrow">PROJECT · {project.id.slice(0, 8).toUpperCase()}</div>
            <h1 className="bp-h1">{project.name}</h1>
            {project.description && (
              <div className="bp-subtle">{project.description}</div>
            )}
          </div>
          <div className="bp-page-tools">
            {canManageTeam(userRole) && (
              <button 
                className="bp-btn-primary"
                onClick={() => setUploadModalOpen(true)}
              >
                <svg className="bp-upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload submittal
              </button>
            )}
          </div>
        </div>

        <div className="bp-stats-row">
          <div className="bp-stat-card">
            <div className="bp-stat-label">Equipment Progress</div>
            <div className="bp-stat-value">
              <span className="bp-stat-num">{completionPercentage}</span>
              <span className="bp-stat-unit">%</span>
            </div>
            <div className="bp-stat-sub">
              {completedTPIs} of {totalTPIs} complete
            </div>
            <div className="bp-stat-bar">
              <i style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>

          <div className="bp-stat-card">
            <div className="bp-stat-label">Equipment Status</div>
            <div className="bp-stat-value">
              <span className="bp-stat-num">{totalTPIs}</span>
              <span className="bp-stat-unit">items</span>
            </div>
            <div className="bp-stat-sub">
              {Object.entries(dashboard.status_counts)
                .filter(([_, count]) => count > 0)
                .map(([status, count]) => `${count} ${status}`)
                .join(' · ')}
            </div>
          </div>

          <div className="bp-stat-card">
            <div className="bp-stat-label">Documents</div>
            <div className="bp-stat-value">
              <span className="bp-stat-num">{dashboard.document_count}</span>
              <span className="bp-stat-unit">files</span>
            </div>
            <div className="bp-stat-sub">
              Submittal PDFs uploaded
            </div>
          </div>
        </div>

        <div className="bp-section">
          <h2 className="bp-section-title">Recent Agent Activity</h2>
          {dashboard.recent_agent_runs.length > 0 ? (
            <div className="bp-agent-runs">
              {dashboard.recent_agent_runs.map((run) => (
                <div key={run.id} className="bp-agent-run">
                  <div className="bp-agent-run-info">
                    <div className="bp-agent-run-equipment">
                      <span className="bp-ai-icon">⚡</span>
                      {run.equipment_type || 'Equipment Processing'}
                    </div>
                    <div className="bp-agent-run-meta">
                      <span className="bp-mono">{run.model_version}</span>
                      <span>{formatDate(run.created_at)}</span>
                    </div>
                  </div>
                  <span className={`bp-status-badge ${getStatusColor(run.status)}`}>
                    {formatAgentRunStatus(run)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bp-empty-state">
              <svg className="bp-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p>No agent activity yet</p>
              <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                Agent runs will appear here when processing begins
              </p>
            </div>
          )}
        </div>
      </div>

      {userRole === 'OCA' && (
        <UploadModal 
          projectId={projectId}
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </>
  )
}