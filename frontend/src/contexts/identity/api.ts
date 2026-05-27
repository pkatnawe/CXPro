import { supabase } from '@/lib/supabase'

export const ROLES = [
  'OCA',
  'CM',
  'cx_engineer',
  'field_technician',
  'design_engineer',
  'owner_fm'
] as const

export type Role = typeof ROLES[number]

export const ROLE_LABELS: Record<Role, string> = {
  'OCA': 'Owner\'s Commissioning Agent',
  'CM': 'Construction Manager',
  'cx_engineer': 'Cx Engineer',
  'field_technician': 'Field Technician',
  'design_engineer': 'Design Engineer',
  'owner_fm': 'Owner/FM'
}

export function isValidRole(s: unknown): s is Role {
  return typeof s === 'string' && (ROLES as readonly string[]).includes(s)
}

export function canManageTeam(role: Role | null | undefined): boolean {
  return role === 'OCA' || role === 'CM'
}

export function canCreateProject(role: Role | null | undefined): boolean {
  return role === 'OCA' || role === 'CM'
}

export function getInitials(fullName: string | undefined, email: string): string {
  if (!fullName || fullName.trim() === '') {
    return email.charAt(0).toUpperCase()
  }

  const trimmedName = fullName.trim()
  const words = trimmedName.split(/\s+/)

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  } else if (words.length === 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  } else {
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }
}

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
  send_count: number
}

export async function getMembersForProject(projectId: string): Promise<ProjectMember[]> {
  try {
    const { data: participations, error: participationsError } = await supabase
      .from('participations')
      .select('user_id')
      .eq('project_id', projectId)

    if (participationsError) throw participationsError

    if (!participations || participations.length === 0) {
      return []
    }

    const userIds = participations.map(p => p.user_id)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError
    const orgId = project.org_id

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds)

    if (usersError) throw usersError

    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('user_id, role')
      .in('user_id', userIds)
      .eq('org_id', orgId)

    if (membershipsError) throw membershipsError

    const { data: disciplineScopes, error: disciplineScopesError } = await supabase
      .from('discipline_scopes')
      .select('id, name')
      .eq('project_id', projectId)

    if (disciplineScopesError) throw disciplineScopesError

    const scopeIds = disciplineScopes?.map(ds => ds.id) || []

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
    const { data, error } = await supabase
      .from('pending_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        created_at,
        send_count,
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

    const invites: PendingInvite[] = data?.map((invitation: any) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      discipline_name: invitation.discipline_scopes?.name || null,
      invited_by: invitation.users?.email || '',
      expires_at: invitation.expires_at,
      created_at: invitation.created_at,
      send_count: invitation.send_count || 1
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
): Promise<Role | null> {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError

    const orgId = project.org_id

    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle()

    if (membershipError) throw membershipError

    if (!membership) return null

    return membership.role as Role
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
    const { data: projectDisciplines, error: disciplinesError } = await supabase
      .from('discipline_scopes')
      .select('id')
      .eq('project_id', projectId)

    if (disciplinesError) throw disciplinesError

    if (projectDisciplines && projectDisciplines.length > 0) {
      const disciplineScopeIds = projectDisciplines.map(ds => ds.id)

      for (const dsId of disciplineScopeIds) {
        await supabase
          .from('assignments')
          .delete()
          .eq('user_id', userId)
          .eq('discipline_scope_id', dsId)
      }
    }

    const { error: insertError } = await supabase
      .from('assignments')
      .insert({
        user_id: userId,
        discipline_scope_id: newDisciplineScopeId
      })

    if (insertError) {
      if (!insertError.message?.includes('duplicate')) {
        throw insertError
      }
    }
  } catch (error) {
    console.error('Error updating discipline:', error)
    throw error
  }
}
