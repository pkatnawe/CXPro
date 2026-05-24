'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ActivityEntry {
  id: string
  actor_type: 'ai' | 'human'
  actor_name: string
  action: string
  target: string
  metadata?: Record<string, unknown>
  created_at: string
}

interface ActivityTabProps {
  projectId: string
  testProcedureId: string
  agentRunId: string | null
  userId?: string
  orgId?: string
}

export default function ActivityTab({ projectId, testProcedureId, agentRunId, userId, orgId }: ActivityTabProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'thumbs_up' | 'thumbs_down' | null>>({})

  const loadActivities = async () => {
    try {
      const activityList: ActivityEntry[] = []

      // Load agent run if exists
      if (agentRunId) {
        const { data: agentRun } = await supabase
          .from('agent_runs')
          .select('*')
          .eq('id', agentRunId)
          .single()

        if (agentRun) {
          activityList.push({
            id: agentRun.id,
            actor_type: 'ai',
            actor_name: 'CX·Pro AI',
            action: agentRun.status === 'completed' ? 'generated draft' : 'attempted generation',
            target: 'test procedure',
            metadata: {
              model: agentRun.model_version,
              duration: agentRun.completed_at 
                ? Math.round((new Date(agentRun.completed_at).getTime() - new Date(agentRun.created_at).getTime()) / 1000)
                : null
            },
            created_at: agentRun.created_at
          })
        }
      }

      // Load test procedure updates
      const { data: testProcedure } = await supabase
        .from('test_procedure_instances')
        .select('created_at, updated_at, status, actor_type')
        .eq('id', testProcedureId)
        .single()

      if (testProcedure) {
        activityList.push({
          id: `tp-created-${testProcedureId}`,
          actor_type: testProcedure.actor_type,
          actor_name: testProcedure.actor_type === 'ai' ? 'CX·Pro AI' : 'User',
          action: 'created',
          target: 'test procedure',
          created_at: testProcedure.created_at
        })

        if (testProcedure.status === 'active') {
          activityList.push({
            id: `tp-activated-${testProcedureId}`,
            actor_type: 'human',
            actor_name: 'OCA',
            action: 'accepted draft',
            target: 'test procedure',
            created_at: testProcedure.updated_at
          })
        }
      }

      // Sort by date, newest first
      activityList.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setActivities(activityList)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, testProcedureId])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const handleFeedback = async (activityId: string, agentRunId: string, feedbackType: 'thumbs_up' | 'thumbs_down') => {
    if (!userId || !orgId) {
      console.error('Missing userId or orgId for feedback')
      return
    }

    try {
      // Call the database function to record feedback
      const { error } = await supabase
        .rpc('record_feedback', {
          p_agent_run_id: agentRunId,
          p_user_id: userId,
          p_feedback_type: feedbackType,
          p_feedback_text: null,
          p_message_id: null
        })

      if (error) throw error

      // Update local state
      setFeedbackGiven(prev => ({ ...prev, [activityId]: feedbackType }))

      // If thumbs down, prompt for additional feedback
      if (feedbackType === 'thumbs_down') {
        const reason = prompt('What was wrong with this AI generation?')
        if (reason) {
          await supabase
            .from('feedback_records')
            .update({ feedback_text: reason })
            .eq('agent_run_id', agentRunId)
            .eq('created_by', userId)
            .order('created_at', { ascending: false })
            .limit(1)
        }
      }
    } catch (error) {
      console.error('Error saving feedback:', error)
    }
  }

  if (loading) {
    return <div className="bp-activity-loading">Loading activity...</div>
  }

  return (
    <div className="bp-activity-list">
      {activities.length === 0 ? (
        <div className="bp-activity-empty">No activity yet</div>
      ) : (
        activities.map(activity => (
          <div key={activity.id} className={`bp-activity-item ${activity.actor_type === 'ai' ? 'is-ai' : ''}`}>
            <div className="bp-activity-actor">
              {activity.actor_type === 'ai' ? (
                <div className="bp-activity-ai-icon">⚡</div>
              ) : (
                <div className="bp-activity-human-icon">
                  {activity.actor_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="bp-activity-content">
              <div className="bp-activity-main">
                <span className="bp-activity-name">{activity.actor_name}</span>
                <span className="bp-activity-action">{activity.action}</span>
                <span className="bp-activity-target">{activity.target}</span>
              </div>
              
              {(() => {
                if (!activity.metadata) return null
                const model = activity.metadata['model']
                const duration = activity.metadata['duration']
                
                if (!model && !duration) return null
                
                return (
                  <div className="bp-activity-meta">
                    {model ? (
                      <span className="bp-activity-meta-item">
                        Model: <span className="bp-mono">{String(model)}</span>
                      </span>
                    ) : null}
                    {duration ? (
                      <span className="bp-activity-meta-item">
                        Duration: <span className="bp-mono">{String(duration)}s</span>
                      </span>
                    ) : null}
                  </div>
                )
              })()}
              
              {activity.actor_type === 'human' && activity.action === 'accepted draft' && agentRunId && (
                <div className="bp-activity-confirmation">
                  Confirmed AI draft from <span className="bp-mono">{agentRunId.slice(0, 8)}</span>
                </div>
              )}
              
              {activity.actor_type === 'ai' && activity.id === agentRunId && userId && orgId && (
                <div className="bp-activity-feedback">
                  <button
                    className={`bp-feedback-btn ${feedbackGiven[activity.id] === 'thumbs_up' ? 'is-active' : ''}`}
                    onClick={() => handleFeedback(activity.id, activity.id, 'thumbs_up')}
                    title="Helpful"
                    disabled={!!feedbackGiven[activity.id]}
                  >
                    👍
                  </button>
                  <button
                    className={`bp-feedback-btn ${feedbackGiven[activity.id] === 'thumbs_down' ? 'is-active' : ''}`}
                    onClick={() => handleFeedback(activity.id, activity.id, 'thumbs_down')}
                    title="Not helpful"
                    disabled={!!feedbackGiven[activity.id]}
                  >
                    👎
                  </button>
                </div>
              )}
            </div>
            
            <div className="bp-activity-time bp-mono">
              {formatTime(activity.created_at)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// CSS for activity tab
const styles = `
.bp-activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bp-activity-loading,
.bp-activity-empty {
  text-align: center;
  color: var(--bp-graphite);
  padding: 40px 20px;
  font-size: 14px;
}

.bp-activity-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bp-paper-2);
  border-radius: 4px;
  transition: all 0.15s ease;
}

.bp-activity-item:hover {
  background: var(--bp-card);
}

.bp-activity-item.is-ai {
  background: var(--bp-blue-tint);
}

.bp-activity-item.is-ai:hover {
  background: var(--bp-blue-soft);
}

.bp-activity-actor {
  flex-shrink: 0;
}

.bp-activity-ai-icon {
  width: 32px;
  height: 32px;
  background: var(--bp-blue);
  color: white;
  border-radius: 4px;
  display: grid;
  place-items: center;
  font-size: 16px;
}

.bp-activity-human-icon {
  width: 32px;
  height: 32px;
  background: var(--bp-graphite);
  color: white;
  border-radius: 4px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
}

.bp-activity-content {
  flex: 1;
  min-width: 0;
}

.bp-activity-main {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.bp-activity-name {
  font-weight: 600;
  margin-right: 6px;
}

.bp-activity-action {
  color: var(--bp-ink-2);
  margin-right: 6px;
}

.bp-activity-target {
  color: var(--bp-blue);
}

.bp-activity-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--bp-graphite);
  margin-top: 4px;
}

.bp-activity-meta-item .bp-mono {
  color: var(--bp-ink-2);
}

.bp-activity-confirmation {
  font-size: 12px;
  color: var(--bp-graphite);
  margin-top: 4px;
}

.bp-activity-confirmation .bp-mono {
  color: var(--bp-blue);
}

.bp-activity-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--bp-dim);
  text-align: right;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}