import { supabase } from './supabase'

export async function getPrimaryOrg(
  userId: string
): Promise<{ id: string; name: string; role: 'OCA' | 'cx_engineer' } | null> {
  try {
    // Query memberships joined with orgs, ordered by memberships.created_at ASC
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        org_id,
        role,
        created_at,
        orgs (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Return null when the user has zero memberships
    if (!data || data.length === 0) {
      return null
    }
    
    // Get the first membership (oldest by created_at)
    const firstMembership = data[0] as any
    
    // Map to the expected return shape
    return {
      id: firstMembership.orgs.id,
      name: firstMembership.orgs.name,
      role: firstMembership.role as 'OCA' | 'cx_engineer'
    }
  } catch (error) {
    console.error('Error fetching primary org:', error)
    throw error
  }
}