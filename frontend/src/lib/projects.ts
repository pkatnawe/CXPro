import { supabase } from './supabase'

export interface ProjectCard {
  project_id: string
  name: string
  org_name: string
  description: string | null
  created_at: string
}

export async function getProjectsForUser(): Promise<ProjectCard[]> {
  try {
    // Query projects with org join
    // RLS policies will ensure only projects the user has membership access to are returned
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        created_at,
        orgs!inner(
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (projectsError) throw projectsError

    // Map to ProjectCard format
    const projects: ProjectCard[] = projectsData?.map((project: any) => ({
      project_id: project.id,
      name: project.name,
      org_name: project.orgs?.name || '',
      description: project.description || null,
      created_at: project.created_at
    })) || []

    return projects
  } catch (error) {
    console.error('Error fetching projects for user:', error)
    throw error
  }
}