import { supabase } from './supabase'

export interface ProjectMember {
  user_id: string
  email: string
  full_name?: string
  role: string
  discipline_name: string | null
}

export interface PendingInvite {
  id: string
  email: string
  role: string
  discipline_name: string | null
  invited_by: string
  expires_at: string
  created_at: string
}

export async function getMembersForProject(projectId: string): Promise<ProjectMember[]> {
  try {
    // Step 1: Get participations for the project
    const { data: participations, error: participationsError } = await supabase
      .from('participations')
      .select('user_id')
      .eq('project_id', projectId)

    if (participationsError) throw participationsError
    
    // Return early if no participations found
    if (!participations || participations.length === 0) {
      return []
    }

    const userIds = participations.map(p => p.user_id)

    // Step 2: Get the project's org_id
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError
    const orgId = project.org_id

    // Step 3: Get user details
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds)

    if (usersError) throw usersError

    // Step 4: Get memberships for users in this specific org
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('user_id, role')
      .in('user_id', userIds)
      .eq('org_id', orgId)

    if (membershipsError) throw membershipsError

    // Step 5: Get discipline scopes for the project
    const { data: disciplineScopes, error: disciplineScopesError } = await supabase
      .from('discipline_scopes')
      .select('id, name')
      .eq('project_id', projectId)

    if (disciplineScopesError) throw disciplineScopesError
    
    const scopeIds = disciplineScopes?.map(ds => ds.id) || []

    // Step 6: Get assignments for users in project discipline scopes
    let assignments: any[] = []
    if (scopeIds.length > 0) {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('user_id, discipline_scope_id')
        .in('user_id', userIds)
        .in('discipline_scope_id', scopeIds)

      if (assignmentsError) throw assignmentsError
      assignments = assignmentsData || []
    }

    // Map everything together
    const members: ProjectMember[] = userIds.map(userId => {
      const user = users?.find(u => u.id === userId)
      const membership = memberships?.find(m => m.user_id === userId)
      const assignment = assignments.find(a => a.user_id === userId)
      const disciplineScope = assignment 
        ? disciplineScopes?.find(ds => ds.id === assignment.discipline_scope_id)
        : null

      return {
        user_id: userId,
        email: user?.email || '',
        full_name: user?.full_name,
        role: membership?.role || '',
        discipline_name: disciplineScope?.name || null
      }
    })

    return members
  } catch (error) {
    console.error('Error fetching members for project:', error)
    throw error
  }
}

export async function getPendingInvitesForProject(projectId: string): Promise<PendingInvite[]> {
  try {
    // Query pending invitations that are not accepted and not expired
    const { data, error } = await supabase
      .from('pending_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        created_at,
        users!pending_invitations_invited_by_fkey(
          email
        ),
        discipline_scopes(
          name
        )
      `)
      .eq('project_id', projectId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())

    if (error) throw error

    // Map to PendingInvite format
    const invites: PendingInvite[] = data?.map((invitation: any) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      discipline_name: invitation.discipline_scopes?.name || null,
      invited_by: invitation.users?.email || '',
      expires_at: invitation.expires_at,
      created_at: invitation.created_at
    })) || []

    return invites
  } catch (error) {
    console.error('Error fetching pending invites for project:', error)
    throw error
  }
}

export async function getCurrentUserRole(
  userId: string,
  projectId: string
): Promise<'OCA' | 'cx_engineer' | null> {
  try {
    // First get the project's org_id
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError
    
    const orgId = project.org_id

    // Then get the user's role in that org
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle()

    if (membershipError) throw membershipError
    
    if (!membership) return null
    
    return membership.role as 'OCA' | 'cx_engineer'
  } catch (error) {
    console.error('Error fetching user role:', error)
    throw error
  }
}

export async function updateDiscipline(
  userId: string, 
  projectId: string, 
  newDisciplineScopeId: string
): Promise<void> {
  try {
    // First, get all discipline scopes for this project to find existing assignments
    const { data: projectDisciplines, error: disciplinesError } = await supabase
      .from('discipline_scopes')
      .select('id')
      .eq('project_id', projectId)
    
    if (disciplinesError) throw disciplinesError
    
    // Delete all existing assignments for this user in this project
    // (an assignment links a user to a discipline_scope, and discipline_scopes belong to projects)
    if (projectDisciplines && projectDisciplines.length > 0) {
      const disciplineScopeIds = projectDisciplines.map(ds => ds.id)
      
      // Delete existing assignments for this user and project
      for (const dsId of disciplineScopeIds) {
        await supabase
          .from('assignments')
          .delete()
          .eq('user_id', userId)
          .eq('discipline_scope_id', dsId)
      }
    }
    
    // Insert the new assignment
    const { error: insertError } = await supabase
      .from('assignments')
      .insert({
        user_id: userId,
        discipline_scope_id: newDisciplineScopeId
      })
    
    if (insertError) {
      // If it's a duplicate key error, that's ok (idempotent)
      if (!insertError.message?.includes('duplicate')) {
        throw insertError
      }
    }
  } catch (error) {
    console.error('Error updating discipline:', error)
    throw error
  }
}