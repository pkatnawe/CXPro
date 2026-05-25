import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMembersForProject, getPendingInvitesForProject } from '../members'

// Mock the supabase module
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}))

import { supabase } from '../supabase'

describe('getMembersForProject', () => {
  // In-memory fake data store
  let mockData: {
    users: any[]
    memberships: any[]
    participations: any[]
    assignments: any[]
    discipline_scopes: any[]
    currentUserId: string
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset the fake data store
    mockData = {
      users: [],
      memberships: [],
      participations: [],
      assignments: [],
      discipline_scopes: [],
      currentUserId: 'user-1'
    }

    // Setup the mock chain for from().select().eq()
    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'participations') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                if (column === 'project_id') {
                  // Get participations for the project
                  const projectParticipations = mockData.participations.filter(
                    p => p.project_id === value
                  )
                  
                  // Join with users, memberships, assignments, and discipline_scopes
                  const membersData = projectParticipations.map(participation => {
                    const user = mockData.users.find(u => u.id === participation.user_id)
                    const membership = mockData.memberships.find(
                      m => m.user_id === participation.user_id && 
                          m.org_id === participation.org_id
                    )
                    const assignment = mockData.assignments.find(
                      a => a.user_id === participation.user_id &&
                          mockData.discipline_scopes.find(
                            ds => ds.id === a.discipline_scope_id && 
                                  ds.project_id === value
                          )
                    )
                    const disciplineScope = assignment 
                      ? mockData.discipline_scopes.find(ds => ds.id === assignment.discipline_scope_id)
                      : null
                    
                    return {
                      user_id: participation.user_id,
                      users: user ? { email: user.email } : null,
                      memberships: membership ? { role: membership.role } : null,
                      assignments: assignment && disciplineScope ? {
                        discipline_scopes: {
                          name: disciplineScope.name
                        }
                      } : null
                    }
                  })
                  
                  return {
                    data: membersData,
                    error: null
                  }
                }
                return { data: [], error: null }
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

  it('returns joined rows with email, role, and discipline for project members', async () => {
    // Setup test data
    mockData.users = [
      { id: 'user-1', email: 'alice@example.com' },
      { id: 'user-2', email: 'bob@example.com' },
      { id: 'user-3', email: 'charlie@example.com' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-1', org_id: 'org-1', role: 'OCA' },
      { user_id: 'user-2', org_id: 'org-1', role: 'cx_engineer' },
      { user_id: 'user-3', org_id: 'org-2', role: 'OCA' }
    ]
    
    mockData.participations = [
      { user_id: 'user-1', project_id: 'project-1', org_id: 'org-1' },
      { user_id: 'user-2', project_id: 'project-1', org_id: 'org-1' },
      { user_id: 'user-3', project_id: 'project-2', org_id: 'org-2' } // Different project
    ]
    
    mockData.discipline_scopes = [
      { id: 'ds-1', project_id: 'project-1', name: 'Mechanical' },
      { id: 'ds-2', project_id: 'project-1', name: 'Electrical' },
      { id: 'ds-3', project_id: 'project-2', name: 'Controls' }
    ]
    
    mockData.assignments = [
      { user_id: 'user-1', discipline_scope_id: 'ds-1' },
      { user_id: 'user-2', discipline_scope_id: 'ds-2' },
      { user_id: 'user-3', discipline_scope_id: 'ds-3' }
    ]
    
    const result = await getMembersForProject('project-1')
    
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({
      user_id: 'user-1',
      email: 'alice@example.com',
      role: 'OCA',
      discipline_name: 'Mechanical'
    })
    expect(result).toContainEqual({
      user_id: 'user-2',
      email: 'bob@example.com',
      role: 'cx_engineer',
      discipline_name: 'Electrical'
    })
  })

  it('returns empty array for project with no members', async () => {
    mockData.participations = []
    
    const result = await getMembersForProject('project-1')
    
    expect(result).toEqual([])
  })

  it('handles members without discipline assignments', async () => {
    mockData.users = [
      { id: 'user-1', email: 'alice@example.com' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-1', org_id: 'org-1', role: 'OCA' }
    ]
    
    mockData.participations = [
      { user_id: 'user-1', project_id: 'project-1', org_id: 'org-1' }
    ]
    
    mockData.assignments = [] // No discipline assignment
    
    const result = await getMembersForProject('project-1')
    
    expect(result).toEqual([{
      user_id: 'user-1',
      email: 'alice@example.com',
      role: 'OCA',
      discipline_name: null
    }])
  })
})

describe('getPendingInvitesForProject', () => {
  let mockData: {
    pending_invitations: any[]
    users: any[]
    discipline_scopes: any[]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockData = {
      pending_invitations: [],
      users: [],
      discipline_scopes: []
    }

    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'pending_invitations') {
        let filters: any = {}
        
        const queryBuilder = {
          select: vi.fn().mockImplementation((columns?: string) => {
            return queryBuilder
          }),
          eq: vi.fn().mockImplementation((column: string, value: any) => {
            filters[column] = value
            return queryBuilder
          }),
          is: vi.fn().mockImplementation((column: string, value: any) => {
            filters[`${column}_is`] = value
            return queryBuilder
          }),
          gt: vi.fn().mockImplementation((column: string, value: any) => {
            filters[`${column}_gt`] = value
            
            // Apply filters and return data
            const projectId = filters['project_id']
            const now = new Date()
            
            // Filter pending invitations for the project
            const projectInvitations = mockData.pending_invitations.filter(
              inv => inv.project_id === projectId &&
                     inv.accepted_at === null &&
                     new Date(inv.expires_at) > now
            )
            
            // Join with users and discipline_scopes
            const invitationsData = projectInvitations.map(invitation => {
              const invitedByUser = mockData.users.find(u => u.id === invitation.invited_by)
              const disciplineScope = invitation.discipline_scope_id
                ? mockData.discipline_scopes.find(ds => ds.id === invitation.discipline_scope_id)
                : null
              
              return {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expires_at: invitation.expires_at,
                created_at: invitation.created_at,
                users: invitedByUser ? { email: invitedByUser.email } : null,
                discipline_scopes: disciplineScope ? { name: disciplineScope.name } : null
              }
            })
            
            return {
              data: invitationsData,
              error: null
            }
          })
        }
        
        return queryBuilder
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis()
      }
    })
  })

  it('returns unexpired unaccepted invitations for the project', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    
    mockData.users = [
      { id: 'user-admin', email: 'admin@example.com' }
    ]
    
    mockData.discipline_scopes = [
      { id: 'ds-1', project_id: 'project-1', name: 'Mechanical' },
      { id: 'ds-2', project_id: 'project-1', name: 'Electrical' }
    ]
    
    mockData.pending_invitations = [
      {
        id: 'inv-1',
        email: 'newuser1@example.com',
        project_id: 'project-1',
        role: 'cx_engineer',
        discipline_scope_id: 'ds-1',
        invited_by: 'user-admin',
        expires_at: futureDate.toISOString(),
        accepted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-2',
        email: 'newuser2@example.com',
        project_id: 'project-1',
        role: 'OCA',
        discipline_scope_id: 'ds-2',
        invited_by: 'user-admin',
        expires_at: futureDate.toISOString(),
        accepted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-3',
        email: 'expired@example.com',
        project_id: 'project-1',
        role: 'cx_engineer',
        discipline_scope_id: 'ds-1',
        invited_by: 'user-admin',
        expires_at: pastDate.toISOString(), // Expired
        accepted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-4',
        email: 'accepted@example.com',
        project_id: 'project-1',
        role: 'cx_engineer',
        discipline_scope_id: 'ds-1',
        invited_by: 'user-admin',
        expires_at: futureDate.toISOString(),
        accepted_at: new Date().toISOString(), // Already accepted
        created_at: new Date().toISOString()
      }
    ]
    
    const result = await getPendingInvitesForProject('project-1')
    
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({
      id: 'inv-1',
      email: 'newuser1@example.com',
      role: 'cx_engineer',
      discipline_name: 'Mechanical',
      invited_by: 'admin@example.com',
      expires_at: futureDate.toISOString(),
      created_at: expect.any(String)
    })
    expect(result).toContainEqual({
      id: 'inv-2',
      email: 'newuser2@example.com',
      role: 'OCA',
      discipline_name: 'Electrical',
      invited_by: 'admin@example.com',
      expires_at: futureDate.toISOString(),
      created_at: expect.any(String)
    })
  })

  it('returns empty array for project with no pending invitations', async () => {
    mockData.pending_invitations = []
    
    const result = await getPendingInvitesForProject('project-1')
    
    expect(result).toEqual([])
  })

  it('handles invitations without discipline scope', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    
    mockData.users = [
      { id: 'user-admin', email: 'admin@example.com' }
    ]
    
    mockData.pending_invitations = [
      {
        id: 'inv-1',
        email: 'newuser@example.com',
        project_id: 'project-1',
        role: 'OCA',
        discipline_scope_id: null, // No discipline scope
        invited_by: 'user-admin',
        expires_at: futureDate.toISOString(),
        accepted_at: null,
        created_at: new Date().toISOString()
      }
    ]
    
    const result = await getPendingInvitesForProject('project-1')
    
    expect(result).toEqual([{
      id: 'inv-1',
      email: 'newuser@example.com',
      role: 'OCA',
      discipline_name: null,
      invited_by: 'admin@example.com',
      expires_at: futureDate.toISOString(),
      created_at: expect.any(String)
    }])
  })
})