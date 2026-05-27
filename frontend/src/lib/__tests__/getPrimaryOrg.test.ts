import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPrimaryOrg } from '../getPrimaryOrg'

// Mock the supabase module
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '../supabase'

describe('getPrimaryOrg', () => {
  // In-memory fake data store
  let mockData: {
    memberships: any[]
    orgs: any[]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset the fake data store
    mockData = {
      memberships: [],
      orgs: []
    }

    // Setup the mock chain for from().select().eq().order()
    const mockFrom = vi.mocked(supabase.from) as any
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') {
        let filters: any = {}
        
        const queryBuilder = {
          select: vi.fn().mockImplementation((columns?: string) => {
            return queryBuilder
          }),
          eq: vi.fn().mockImplementation((column: string, value: any) => {
            filters[column] = value
            return queryBuilder
          }),
          order: vi.fn().mockImplementation((column: string, options?: any) => {
            // Filter memberships for the user
            const userMemberships = mockData.memberships.filter(
              m => m.user_id === filters['user_id']
            )
            
            // Sort by created_at ascending
            userMemberships.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime()
              const dateB = new Date(b.created_at).getTime()
              return options?.ascending === false ? dateB - dateA : dateA - dateB
            })
            
            // Join with orgs data
            const data = userMemberships.map(membership => {
              const org = mockData.orgs.find(o => o.id === membership.org_id)
              return {
                org_id: membership.org_id,
                role: membership.role,
                created_at: membership.created_at,
                orgs: org ? {
                  id: org.id,
                  name: org.name
                } : null
              }
            })
            
            return {
              data,
              error: null
            }
          })
        }
        
        return queryBuilder
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      }
    })
  })

  it('returns the org for a single membership', async () => {
    // Setup test data
    mockData.orgs = [
      { id: 'org-1', name: 'Test Organization' }
    ]
    
    mockData.memberships = [
      { 
        user_id: 'user-1', 
        org_id: 'org-1', 
        role: 'OCA',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
    
    const result = await getPrimaryOrg('user-1')
    
    expect(result).toEqual({
      id: 'org-1',
      name: 'Test Organization',
      role: 'OCA'
    })
  })

  it('returns null when the user has zero memberships', async () => {
    // No memberships for user-2
    mockData.memberships = []
    mockData.orgs = []
    
    const result = await getPrimaryOrg('user-2')
    
    expect(result).toEqual(null)
  })

  it('returns the first org by created_at when user has multiple memberships', async () => {
    // Setup test data with multiple memberships
    mockData.orgs = [
      { id: 'org-1', name: 'First Organization' },
      { id: 'org-2', name: 'Second Organization' },
      { id: 'org-3', name: 'Third Organization' }
    ]
    
    mockData.memberships = [
      { 
        user_id: 'user-1', 
        org_id: 'org-2', 
        role: 'cx_engineer',
        created_at: '2024-02-01T00:00:00Z' // Second chronologically
      },
      { 
        user_id: 'user-1', 
        org_id: 'org-1', 
        role: 'OCA',
        created_at: '2024-01-01T00:00:00Z' // First chronologically
      },
      { 
        user_id: 'user-1', 
        org_id: 'org-3', 
        role: 'OCA',
        created_at: '2024-03-01T00:00:00Z' // Third chronologically
      }
    ]
    
    const result = await getPrimaryOrg('user-1')
    
    // Should return org-1 as it has the earliest created_at
    expect(result).toEqual({
      id: 'org-1',
      name: 'First Organization',
      role: 'OCA'
    })
  })

  it('handles cx_engineer role correctly', async () => {
    mockData.orgs = [
      { id: 'org-1', name: 'Engineering Org' }
    ]
    
    mockData.memberships = [
      { 
        user_id: 'user-1', 
        org_id: 'org-1', 
        role: 'cx_engineer',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
    
    const result = await getPrimaryOrg('user-1')
    
    expect(result).toEqual({
      id: 'org-1',
      name: 'Engineering Org',
      role: 'cx_engineer'
    })
  })

  it('returns the correct primary org when user has memberships in different orgs with same created_at date but different times', async () => {
    mockData.orgs = [
      { id: 'org-1', name: 'Morning Org' },
      { id: 'org-2', name: 'Evening Org' }
    ]
    
    mockData.memberships = [
      { 
        user_id: 'user-1', 
        org_id: 'org-2', 
        role: 'OCA',
        created_at: '2024-01-01T18:00:00Z' // Same date, later time
      },
      { 
        user_id: 'user-1', 
        org_id: 'org-1', 
        role: 'cx_engineer',
        created_at: '2024-01-01T09:00:00Z' // Same date, earlier time
      }
    ]
    
    const result = await getPrimaryOrg('user-1')
    
    // Should return org-1 as it has the earlier time on the same date
    expect(result).toEqual({
      id: 'org-1',
      name: 'Morning Org',
      role: 'cx_engineer'
    })
  })
})