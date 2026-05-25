import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProjectsForUser } from '../projects'

// Mock the supabase module
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '../supabase'

describe('getProjectsForUser', () => {
  // In-memory fake data store
  let mockData: {
    projects: any[]
    orgs: any[]
    memberships: any[] // To simulate RLS scoping
    currentUserId: string
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset the fake data store
    mockData = {
      projects: [],
      orgs: [],
      memberships: [],
      currentUserId: 'user-1'
    }

    // Setup the mock chain for from().select().order()
    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              order: vi.fn().mockImplementation((column: string, options?: any) => {
                // Simulate RLS: only return projects the user has membership to
                const userMemberships = mockData.memberships.filter(
                  m => m.user_id === mockData.currentUserId
                )
                const userProjectIds = new Set(userMemberships.map(m => m.project_id))
                
                // Filter projects based on membership
                const filteredProjects = mockData.projects.filter(
                  p => userProjectIds.has(p.id)
                )
                
                // Join with orgs
                const projectsWithOrgs = filteredProjects.map(project => {
                  const org = mockData.orgs.find(o => o.id === project.org_id)
                  return {
                    ...project,
                    orgs: org ? { name: org.name } : null
                  }
                })
                
                // Sort by created_at descending
                projectsWithOrgs.sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                
                return {
                  data: projectsWithOrgs,
                  error: null
                }
              })
            }
          })
        }
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      }
    })
  })

  it('user in one org sees only that org\'s projects', async () => {
    // Setup test data
    mockData.orgs = [
      { id: 'org-1', name: 'Acme Corp' },
      { id: 'org-2', name: 'Other Corp' }
    ]
    
    mockData.projects = [
      {
        id: 'project-1',
        org_id: 'org-1',
        name: 'Project Alpha',
        description: 'First project',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'project-2',
        org_id: 'org-1',
        name: 'Project Beta',
        description: null,
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: 'project-3',
        org_id: 'org-2',
        name: 'Other Project',
        description: 'Not visible',
        created_at: '2024-01-03T00:00:00Z'
      }
    ]
    
    // User only has membership to org-1 projects
    mockData.memberships = [
      { user_id: 'user-1', project_id: 'project-1' },
      { user_id: 'user-1', project_id: 'project-2' },
      { user_id: 'user-2', project_id: 'project-3' } // Different user
    ]
    
    const result = await getProjectsForUser()
    
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      project_id: 'project-2',
      name: 'Project Beta',
      org_name: 'Acme Corp',
      description: null,
      created_at: '2024-01-02T00:00:00Z'
    })
    expect(result[1]).toEqual({
      project_id: 'project-1',
      name: 'Project Alpha',
      org_name: 'Acme Corp',
      description: 'First project',
      created_at: '2024-01-01T00:00:00Z'
    })
  })

  it('user in two orgs sees projects from both', async () => {
    // Setup test data
    mockData.orgs = [
      { id: 'org-1', name: 'Acme Corp' },
      { id: 'org-2', name: 'Beta Corp' }
    ]
    
    mockData.projects = [
      {
        id: 'project-1',
        org_id: 'org-1',
        name: 'Acme Project',
        description: 'From org 1',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'project-2',
        org_id: 'org-2',
        name: 'Beta Project',
        description: 'From org 2',
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: 'project-3',
        org_id: 'org-1',
        name: 'Another Acme Project',
        description: null,
        created_at: '2024-01-03T00:00:00Z'
      }
    ]
    
    // User has membership to projects in both orgs
    mockData.memberships = [
      { user_id: 'user-1', project_id: 'project-1' },
      { user_id: 'user-1', project_id: 'project-2' },
      { user_id: 'user-1', project_id: 'project-3' }
    ]
    
    const result = await getProjectsForUser()
    
    expect(result).toHaveLength(3)
    expect(result[0].org_name).toBe('Acme Corp')
    expect(result[1].org_name).toBe('Beta Corp')
    expect(result[2].org_name).toBe('Acme Corp')
    
    // Verify all projects are included
    const projectIds = result.map(p => p.project_id)
    expect(projectIds).toContain('project-1')
    expect(projectIds).toContain('project-2')
    expect(projectIds).toContain('project-3')
  })

  it('user with no memberships sees empty list', async () => {
    // Setup test data
    mockData.orgs = [
      { id: 'org-1', name: 'Acme Corp' }
    ]
    
    mockData.projects = [
      {
        id: 'project-1',
        org_id: 'org-1',
        name: 'Project Alpha',
        description: 'A project',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
    
    // No memberships for the current user
    mockData.memberships = [
      { user_id: 'user-2', project_id: 'project-1' } // Different user
    ]
    
    const result = await getProjectsForUser()
    
    expect(result).toEqual([])
  })

  it('handles database error appropriately', async () => {
    // Setup mock to return an error
    const mockFrom = vi.mocked(supabase.from) as any
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        order: vi.fn().mockImplementation(() => ({
          data: null,
          error: new Error('Database connection failed')
        }))
      }))
    }))
    
    // Expect the function to throw
    await expect(getProjectsForUser()).rejects.toThrow('Database connection failed')
  })

  it('returns empty array when no projects exist', async () => {
    // No projects in the database
    mockData.projects = []
    mockData.orgs = []
    mockData.memberships = []
    
    const result = await getProjectsForUser()
    
    expect(result).toEqual([])
  })
})