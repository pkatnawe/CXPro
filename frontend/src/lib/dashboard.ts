import { supabase } from './supabase'

export interface DashboardSummary {
  status_counts: Record<string, number>
  recent_agent_runs: AgentRunSummary[]
  document_count: number
}

export interface AgentRunSummary {
  id: string
  test_procedure_instance_id: string | null
  equipment_type: string | null
  status: 'pending' | 'running' | 'completed' | 'failed'
  model_version: string
  created_at: string
  completed_at: string | null
}

export async function getProjectDashboard(projectId: string): Promise<DashboardSummary> {
  try {
    // Get status counts for test procedure instances
    const { data: statusData, error: statusError } = await supabase
      .from('test_procedure_instances')
      .select('status')
      .eq('project_id', projectId)

    if (statusError) throw statusError

    const status_counts: Record<string, number> = {}
    if (statusData) {
      statusData.forEach(item => {
        const status = item.status || 'unknown'
        status_counts[status] = (status_counts[status] || 0) + 1
      })
    }

    // Get recent agent runs (latest 5, ordered by created_at desc)
    const { data: agentRunsData, error: agentRunsError } = await supabase
      .from('agent_runs')
      .select(`
        id,
        test_procedure_instance_id,
        status,
        model_version,
        created_at,
        completed_at,
        test_procedure_instances!inner(
          project_id,
          equipment_type
        )
      `)
      .eq('test_procedure_instances.project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (agentRunsError) throw agentRunsError

    const recent_agent_runs: AgentRunSummary[] = agentRunsData?.map((run: any) => ({
      id: run.id,
      test_procedure_instance_id: run.test_procedure_instance_id,
      equipment_type: run.test_procedure_instances?.equipment_type || null,
      status: run.status,
      model_version: run.model_version,
      created_at: run.created_at,
      completed_at: run.completed_at
    })) || []

    // Get document count
    const { count: documentCount, error: documentError } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (documentError) throw documentError

    const document_count = documentCount || 0

    return {
      status_counts,
      recent_agent_runs,
      document_count
    }
  } catch (error) {
    console.error('Error fetching project dashboard:', error)
    throw error
  }
}