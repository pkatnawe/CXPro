import { supabase } from './supabase'

export interface ProjectMember {
  user_id: string
  email: string
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
    // Query participations joined with users, memberships, and assignments/discipline_scopes
    const { data, error } = await supabase
      .from('participations')
      .select(`
        user_id,
        users!inner(
          email
        ),
        memberships!inner(
          role
        ),
        assignments(
          discipline_scopes!inner(
            name
          )
        )
      `)
      .eq('project_id', projectId)

    if (error) throw error

    // Map to ProjectMember format
    const members: ProjectMember[] = data?.map((participation: any) => ({
      user_id: participation.user_id,
      email: participation.users?.email || '',
      role: participation.memberships?.role || '',
      discipline_name: participation.assignments?.discipline_scopes?.name || null
    })) || []

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