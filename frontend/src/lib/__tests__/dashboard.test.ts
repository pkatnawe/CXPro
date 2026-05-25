import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProjectDashboard } from '../dashboard'

// Mock the supabase module
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '../supabase'

describe('getProjectDashboard', () => {
  // In-memory fake data store
  let mockData: {
    test_procedure_instances: any[]
    agent_runs: any[]
    documents: any[]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset the fake data store
    mockData = {
      test_procedure_instances: [],
      agent_runs: [],
      documents: []
    }

    // Setup the mock chain for from().select().eq() etc
    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      const chainMethods = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        inner: vi.fn().mockReturnThis()
      }

      // Override select to handle the actual data return
      chainMethods.select.mockImplementation((columns?: string) => {
        const selectChain = {
          eq: vi.fn().mockImplementation((column: string, value: any) => {
            let filteredData: any[] = []
            let count: number | null = null

            if (table === 'test_procedure_instances') {
              filteredData = mockData.test_procedure_instances.filter(
                item => item.project_id === value
              )
              return {
                data: filteredData,
                error: null
              }
            }

            if (table === 'agent_runs') {
              // Handle the join with test_procedure_instances
              const tpiMap = new Map(
                mockData.test_procedure_instances.map(tpi => [tpi.id, tpi])
              )
              
              filteredData = mockData.agent_runs
                .filter(run => {
                  const tpi = tpiMap.get(run.test_procedure_instance_id)
                  return tpi && tpi.project_id === value
                })
                .map(run => {
                  const tpi = tpiMap.get(run.test_procedure_instance_id)
                  return {
                    ...run,
                    test_procedure_instances: tpi ? {
                      project_id: tpi.project_id,
                      equipment_type: tpi.equipment_type
                    } : null
                  }
                })
              
              // Apply ordering and limit
              const orderedData = filteredData.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              const limitedData = orderedData.slice(0, 5)
              
              return {
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    data: limitedData,
                    error: null
                  })
                })
              }
            }

            if (table === 'documents') {
              // Handle count query - check for head: true in the options
              const isCountQuery = columns === 'id'
              if (isCountQuery) {
                count = mockData.documents.filter(
                  doc => doc.project_id === value
                ).length
                return {
                  count,
                  error: null,
                  data: null
                }
              }
            }

            return {
              data: null,
              error: null
            }
          })
        }

        return selectChain
      })

      return chainMethods
    })
  })

  it('should return correct status_counts grouping', async () => {
    const projectId = 'project-123'
    
    mockData.test_procedure_instances = [
      { id: 'tpi-1', project_id: projectId, status: 'pending' },
      { id: 'tpi-2', project_id: projectId, status: 'pending' },
      { id: 'tpi-3', project_id: projectId, status: 'in_progress' },
      { id: 'tpi-4', project_id: projectId, status: 'completed' },
      { id: 'tpi-5', project_id: projectId, status: 'completed' },
      { id: 'tpi-6', project_id: projectId, status: 'completed' },
      { id: 'tpi-7', project_id: 'other-project', status: 'pending' }, // Different project
    ]

    const result = await getProjectDashboard(projectId)

    expect(result.status_counts).toEqual({
      pending: 2,
      in_progress: 1,
      completed: 3
    })
  })

  it('should return recent_agent_runs limit-5 latest-first ordering', async () => {
    const projectId = 'project-123'
    
    mockData.test_procedure_instances = [
      { id: 'tpi-1', project_id: projectId, equipment_type: 'Pump' },
      { id: 'tpi-2', project_id: projectId, equipment_type: 'Fan' }
    ]

    // Create 7 agent runs to test the limit
    mockData.agent_runs = [
      { 
        id: 'run-1', 
        test_procedure_instance_id: 'tpi-1',
        status: 'completed',
        model_version: 'v1',
        created_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:30:00Z'
      },
      { 
        id: 'run-2', 
        test_procedure_instance_id: 'tpi-1',
        status: 'completed',
        model_version: 'v1',
        created_at: '2024-01-02T10:00:00Z',
        completed_at: '2024-01-02T10:30:00Z'
      },
      { 
        id: 'run-3', 
        test_procedure_instance_id: 'tpi-2',
        status: 'running',
        model_version: 'v2',
        created_at: '2024-01-03T10:00:00Z',
        completed_at: null
      },
      { 
        id: 'run-4', 
        test_procedure_instance_id: 'tpi-1',
        status: 'failed',
        model_version: 'v2',
        created_at: '2024-01-04T10:00:00Z',
        completed_at: '2024-01-04T10:05:00Z'
      },
      { 
        id: 'run-5', 
        test_procedure_instance_id: 'tpi-2',
        status: 'completed',
        model_version: 'v2',
        created_at: '2024-01-05T10:00:00Z',
        completed_at: '2024-01-05T11:00:00Z'
      },
      { 
        id: 'run-6', 
        test_procedure_instance_id: 'tpi-1',
        status: 'pending',
        model_version: 'v3',
        created_at: '2024-01-06T10:00:00Z',
        completed_at: null
      },
      { 
        id: 'run-7', 
        test_procedure_instance_id: 'tpi-2',
        status: 'completed',
        model_version: 'v3',
        created_at: '2024-01-07T10:00:00Z',
        completed_at: '2024-01-07T12:00:00Z'
      }
    ]

    const result = await getProjectDashboard(projectId)

    // Should return latest 5 runs, ordered by created_at descending
    expect(result.recent_agent_runs).toHaveLength(5)
    expect(result.recent_agent_runs[0].id).toBe('run-7')
    expect(result.recent_agent_runs[1].id).toBe('run-6')
    expect(result.recent_agent_runs[2].id).toBe('run-5')
    expect(result.recent_agent_runs[3].id).toBe('run-4')
    expect(result.recent_agent_runs[4].id).toBe('run-3')

    // Check that equipment_type is populated from the join
    expect(result.recent_agent_runs[0].equipment_type).toBe('Fan')
    expect(result.recent_agent_runs[1].equipment_type).toBe('Pump')
  })

  it('should return document_count matching input fixture', async () => {
    const projectId = 'project-123'
    
    mockData.documents = [
      { id: 'doc-1', project_id: projectId },
      { id: 'doc-2', project_id: projectId },
      { id: 'doc-3', project_id: projectId },
      { id: 'doc-4', project_id: projectId },
      { id: 'doc-5', project_id: 'other-project' }, // Different project
    ]

    const result = await getProjectDashboard(projectId)

    expect(result.document_count).toBe(4)
  })

  it('should handle empty data gracefully', async () => {
    const projectId = 'empty-project'
    
    // No data in any of the tables for this project
    const result = await getProjectDashboard(projectId)

    expect(result.status_counts).toEqual({})
    expect(result.recent_agent_runs).toEqual([])
    expect(result.document_count).toBe(0)
  })

  it('should handle null status values', async () => {
    const projectId = 'project-123'
    
    mockData.test_procedure_instances = [
      { id: 'tpi-1', project_id: projectId, status: null },
      { id: 'tpi-2', project_id: projectId, status: 'completed' },
      { id: 'tpi-3', project_id: projectId, status: null }
    ]

    const result = await getProjectDashboard(projectId)

    expect(result.status_counts).toEqual({
      unknown: 2,
      completed: 1
    })
  })

  it('should filter agent runs by project correctly', async () => {
    const projectId = 'project-123'
    const otherProjectId = 'project-456'
    
    mockData.test_procedure_instances = [
      { id: 'tpi-1', project_id: projectId, equipment_type: 'Pump' },
      { id: 'tpi-2', project_id: otherProjectId, equipment_type: 'Fan' }
    ]

    mockData.agent_runs = [
      { 
        id: 'run-1', 
        test_procedure_instance_id: 'tpi-1', // Belongs to project-123
        status: 'completed',
        model_version: 'v1',
        created_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:30:00Z'
      },
      { 
        id: 'run-2', 
        test_procedure_instance_id: 'tpi-2', // Belongs to project-456
        status: 'completed',
        model_version: 'v1',
        created_at: '2024-01-02T10:00:00Z',
        completed_at: '2024-01-02T10:30:00Z'
      }
    ]

    const result = await getProjectDashboard(projectId)

    expect(result.recent_agent_runs).toHaveLength(1)
    expect(result.recent_agent_runs[0].id).toBe('run-1')
    expect(result.recent_agent_runs[0].equipment_type).toBe('Pump')
  })
})