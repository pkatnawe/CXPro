import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMembersForProject, getPendingInvitesForProject, updateDiscipline, getCurrentUserRole } from './api'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}))

import { supabase } from '@/lib/supabase'

describe('getMembersForProject', () => {
  let mockData: {
    users: any[]
    memberships: any[]
    participations: any[]
    assignments: any[]
    discipline_scopes: any[]
    projects: any[]
    currentUserId: string
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockData = {
      users: [],
      memberships: [],
      participations: [],
      assignments: [],
      discipline_scopes: [],
      projects: [],
      currentUserId: 'user-1'
    }

    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'participations') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                if (column === 'project_id') {
                  const projectParticipations = mockData.participations.filter(
                    p => p.project_id === value
                  )
                  const data = projectParticipations.map(p => ({ user_id: p.user_id }))
                  return { data, error: null }
                }
                return { data: [], error: null }
              })
            }
          })
        }
      }
      
      if (table === 'projects') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                return {
                  single: vi.fn().mockImplementation(() => {
                    const project = mockData.projects.find(p => p.id === value)
                    return { data: project ? { org_id: project.org_id } : null, error: null }
                  })
                }
              })
            }
          })
        }
      }
      
      if (table === 'users') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              in: vi.fn().mockImplementation((column: string, values: any[]) => {
                const users = mockData.users.filter(u => values.includes(u.id))
                const data = users.map(u => ({ 
                  id: u.id, 
                  email: u.email, 
                  full_name: u.full_name 
                }))
                return { data, error: null }
              })
            }
          })
        }
      }
      
      if (table === 'memberships') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              in: vi.fn().mockImplementation((column: string, values: any[]) => {
                return {
                  eq: vi.fn().mockImplementation((column2: string, value2: any) => {
                    const memberships = mockData.memberships.filter(
                      m => values.includes(m.user_id) && m.org_id === value2
                    )
                    const data = memberships.map(m => ({ 
                      user_id: m.user_id, 
                      role: m.role 
                    }))
                    return { data, error: null }
                  })
                }
              })
            }
          })
        }
      }
      
      if (table === 'discipline_scopes') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                const scopes = mockData.discipline_scopes.filter(
                  ds => ds.project_id === value
                )
                const data = scopes.map(ds => ({ id: ds.id, name: ds.name }))
                return { data, error: null }
              })
            }
          })
        }
      }
      
      if (table === 'assignments') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              in: vi.fn().mockImplementation((column: string, values: any[]) => {
                return {
                  in: vi.fn().mockImplementation((column2: string, values2: any[]) => {
                    const assignments = mockData.assignments.filter(
                      a => values.includes(a.user_id) && values2.includes(a.discipline_scope_id)
                    )
                    const data = assignments.map(a => ({ 
                      user_id: a.user_id, 
                      discipline_scope_id: a.discipline_scope_id 
                    }))
                    return { data, error: null }
                  })
                }
              })
            }
          })
        }
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      }
    })
  })

  it('returns joined rows with email, role, and discipline for project members', async () => {
    mockData.projects = [
      { id: 'project-1', org_id: 'org-1' },
      { id: 'project-2', org_id: 'org-2' }
    ]
    
    mockData.users = [
      { id: 'user-1', email: 'alice@example.com', full_name: 'Alice Smith' },
      { id: 'user-2', email: 'bob@example.com', full_name: 'Bob Johnson' },
      { id: 'user-3', email: 'charlie@example.com', full_name: 'Charlie Brown' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-1', org_id: 'org-1', role: 'OCA' },
      { user_id: 'user-2', org_id: 'org-1', role: 'cx_engineer' },
      { user_id: 'user-3', org_id: 'org-2', role: 'OCA' }
    ]
    
    mockData.participations = [
      { user_id: 'user-1', project_id: 'project-1', org_id: 'org-1' },
      { user_id: 'user-2', project_id: 'project-1', org_id: 'org-1' },
      { user_id: 'user-3', project_id: 'project-2', org_id: 'org-2' }
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
      full_name: 'Alice Smith',
      role: 'OCA',
      discipline_name: 'Mechanical'
    })
    expect(result).toContainEqual({
      user_id: 'user-2',
      email: 'bob@example.com',
      full_name: 'Bob Johnson',
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
    mockData.projects = [
      { id: 'project-1', org_id: 'org-1' }
    ]
    
    mockData.users = [
      { id: 'user-1', email: 'alice@example.com', full_name: 'Alice Smith' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-1', org_id: 'org-1', role: 'OCA' }
    ]
    
    mockData.participations = [
      { user_id: 'user-1', project_id: 'project-1', org_id: 'org-1' }
    ]
    
    mockData.assignments = []
    
    const result = await getMembersForProject('project-1')
    
    expect(result).toEqual([{
      user_id: 'user-1',
      email: 'alice@example.com',
      full_name: 'Alice Smith',
      role: 'OCA',
      discipline_name: null
    }])
  })

  it('verifies org isolation - returns org-A role for user in both orgs when querying org-A project', async () => {
    mockData.projects = [
      { id: 'project-a1', org_id: 'org-a' },
      { id: 'project-b1', org_id: 'org-b' }
    ]
    
    mockData.users = [
      { id: 'user-1', email: 'alice@example.com', full_name: 'Alice Smith' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-1', org_id: 'org-a', role: 'OCA' },
      { user_id: 'user-1', org_id: 'org-b', role: 'cx_engineer' }
    ]
    
    mockData.participations = [
      { user_id: 'user-1', project_id: 'project-a1', org_id: 'org-a' },
      { user_id: 'user-1', project_id: 'project-b1', org_id: 'org-b' }
    ]
    
    mockData.discipline_scopes = []
    mockData.assignments = []
    
    const result = await getMembersForProject('project-a1')
    
    expect(result).toEqual([{
      user_id: 'user-1',
      email: 'alice@example.com',
      full_name: 'Alice Smith',
      role: 'OCA',
      discipline_name: null
    }])
    
    const resultB = await getMembersForProject('project-b1')
    
    expect(resultB).toEqual([{
      user_id: 'user-1',
      email: 'alice@example.com',
      full_name: 'Alice Smith',
      role: 'cx_engineer',
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
            
            const projectId = filters['project_id']
            const now = new Date()
            
            const projectInvitations = mockData.pending_invitations.filter(
              inv => inv.project_id === projectId &&
                     inv.accepted_at === null &&
                     new Date(inv.expires_at) > now
            )
            
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
        expires_at: pastDate.toISOString(),
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
        accepted_at: new Date().toISOString(),
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
        discipline_scope_id: null,
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

describe('updateDiscipline', () => {
  let mockData: {
    assignments: any[]
    discipline_scopes: any[]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockData = {
      assignments: [],
      discipline_scopes: []
    }

    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assignments') {
        const queryBuilder = {
          delete: vi.fn().mockImplementation(() => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                if (column === 'user_id') {
                  const userId = value
                  return {
                    eq: vi.fn().mockImplementation((column2: string, value2: any) => {
                      if (column2 === 'discipline_scope_id') {
                        const disciplineScopeId = value2
                        const projectDiscipline = mockData.discipline_scopes.find(
                          ds => ds.id === disciplineScopeId
                        )
                        
                        if (projectDiscipline) {
                          mockData.assignments = mockData.assignments.filter(
                            a => !(a.user_id === userId && 
                                   mockData.discipline_scopes.some(
                                     ds => ds.id === a.discipline_scope_id && 
                                           ds.project_id === projectDiscipline.project_id
                                   ))
                          )
                        }
                        
                        return {
                          data: null,
                          error: null
                        }
                      }
                      return { data: null, error: null }
                    })
                  }
                }
                return { data: null, error: null }
              })
            }
          }),
          insert: vi.fn().mockImplementation((data: any) => {
            mockData.assignments.push(data)
            return {
              data: data,
              error: null
            }
          }),
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                if (column === 'user_id') {
                  const userId = value
                  return {
                    eq: vi.fn().mockImplementation((column2: string, value2: any) => {
                      const userAssignments = mockData.assignments.filter(
                        a => a.user_id === userId
                      )
                      return {
                        data: userAssignments,
                        error: null
                      }
                    })
                  }
                }
                return { data: [], error: null }
              })
            }
          })
        }
        return queryBuilder
      }
      
      if (table === 'discipline_scopes') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                if (column === 'project_id') {
                  const projectScopes = mockData.discipline_scopes.filter(
                    ds => ds.project_id === value
                  )
                  return {
                    data: projectScopes,
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
        delete: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      }
    })
  })

  it('replaces user assignment with new discipline_scope_id', async () => {
    mockData.discipline_scopes = [
      { id: 'ds-1', project_id: 'project-1', name: 'Mechanical' },
      { id: 'ds-2', project_id: 'project-1', name: 'Electrical' },
      { id: 'ds-3', project_id: 'project-2', name: 'Controls' }
    ]
    
    mockData.assignments = [
      { user_id: 'user-1', discipline_scope_id: 'ds-1' },
      { user_id: 'user-2', discipline_scope_id: 'ds-3' }
    ]
    
    await updateDiscipline('user-1', 'project-1', 'ds-2')
    
    expect(mockData.assignments).not.toContainEqual(
      { user_id: 'user-1', discipline_scope_id: 'ds-1' }
    )
    expect(mockData.assignments).toContainEqual(
      { user_id: 'user-1', discipline_scope_id: 'ds-2' }
    )
    expect(mockData.assignments).toContainEqual(
      { user_id: 'user-2', discipline_scope_id: 'ds-3' }
    )
  })

  it('is idempotent - calling with same value twice produces exactly one row', async () => {
    mockData.discipline_scopes = [
      { id: 'ds-1', project_id: 'project-1', name: 'Mechanical' },
      { id: 'ds-2', project_id: 'project-1', name: 'Electrical' }
    ]
    
    mockData.assignments = []
    
    await updateDiscipline('user-1', 'project-1', 'ds-2')
    await updateDiscipline('user-1', 'project-1', 'ds-2')
    
    const userAssignments = mockData.assignments.filter(
      a => a.user_id === 'user-1' && a.discipline_scope_id === 'ds-2'
    )
    expect(userAssignments).toHaveLength(1)
  })

  it('handles user with no prior assignment', async () => {
    mockData.discipline_scopes = [
      { id: 'ds-1', project_id: 'project-1', name: 'Mechanical' }
    ]
    
    mockData.assignments = []
    
    await updateDiscipline('user-1', 'project-1', 'ds-1')
    
    expect(mockData.assignments).toContainEqual(
      { user_id: 'user-1', discipline_scope_id: 'ds-1' }
    )
  })
})

describe('getCurrentUserRole', () => {
  let mockData: {
    projects: any[]
    memberships: any[]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockData = {
      projects: [],
      memberships: []
    }

    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            return {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                return {
                  single: vi.fn().mockImplementation(() => {
                    const project = mockData.projects.find(p => p.id === value)
                    if (!project) {
                      return { data: null, error: new Error('Project not found') }
                    }
                    return { data: { org_id: project.org_id }, error: null }
                  })
                }
              })
            }
          })
        }
      }
      
      if (table === 'memberships') {
        return {
          select: vi.fn().mockImplementation((columns?: string) => {
            let filters: any = {}
            const queryBuilder = {
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                filters[column] = value
                return queryBuilder
              }),
              maybeSingle: vi.fn().mockImplementation(() => {
                const membership = mockData.memberships.find(
                  m => m.user_id === filters.user_id && m.org_id === filters.org_id
                )
                if (!membership) {
                  return { data: null, error: null }
                }
                return { data: { role: membership.role }, error: null }
              })
            }
            return queryBuilder
          })
        }
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis()
      }
    })
  })

  it('returns OCA for a user with OCA role', async () => {
    mockData.projects = [
      { id: 'project-1', org_id: 'org-1' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-1', org_id: 'org-1', role: 'OCA' }
    ]
    
    const result = await getCurrentUserRole('user-1', 'project-1')
    
    expect(result).toBe('OCA')
  })

  it('returns cx_engineer for a user with cx_engineer role', async () => {
    mockData.projects = [
      { id: 'project-1', org_id: 'org-1' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-2', org_id: 'org-1', role: 'cx_engineer' }
    ]
    
    const result = await getCurrentUserRole('user-2', 'project-1')
    
    expect(result).toBe('cx_engineer')
  })

  it('returns null when user has no membership in the project org', async () => {
    mockData.projects = [
      { id: 'project-1', org_id: 'org-1' }
    ]
    
    mockData.memberships = [
      { user_id: 'user-3', org_id: 'org-2', role: 'OCA' }
    ]
    
    const result = await getCurrentUserRole('user-3', 'project-1')
    
    expect(result).toBe(null)
  })
})
