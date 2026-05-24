'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Org, type Project, type Membership } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const router = useRouter()

  // Form states
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedOrgForProject, setSelectedOrgForProject] = useState('')
  const [selectedOrgForInvite, setSelectedOrgForInvite] = useState('')
  const [selectedProjectForInvite, setSelectedProjectForInvite] = useState('')

  const loadUserData = async () => {
    try {
      // Load orgs
      const { data: orgsData } = await supabase
        .from('orgs')
        .select('*')

      // Load memberships
      const { data: membershipsData } = await supabase
        .from('memberships')
        .select('*')

      // Load projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')

      setOrgs(orgsData || [])
      setMemberships(membershipsData || [])
      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/auth')
        return
      }

      setUser(session.user)
      await loadUserData()
    }

    getUser()
  }, [router])


  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase.rpc('create_org_with_membership', {
        org_name: orgName,
        org_slug: orgSlug
      })

      if (error) throw error

      setOrgName('')
      setOrgSlug('')
      setShowOrgForm(false)
      await loadUserData()
    } catch (error) {
      alert('Error creating organization: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase.rpc('create_project_with_discipline', {
        project_name: projectName,
        project_description: projectDescription,
        org_id: selectedOrgForProject
      })

      if (error) throw error

      setProjectName('')
      setProjectDescription('')
      setSelectedOrgForProject('')
      setShowProjectForm(false)
      await loadUserData()
    } catch (error) {
      alert('Error creating project: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase.rpc('invite_user_by_email', {
        invite_email: inviteEmail,
        org_id: selectedOrgForInvite,
        project_id: selectedProjectForInvite
      })

      if (error) throw error

      setInviteEmail('')
      setSelectedOrgForInvite('')
      setSelectedProjectForInvite('')
      setShowInviteForm(false)
      alert('User invited successfully!')
      await loadUserData()
    } catch (error) {
      alert('Error inviting user: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const getUserRole = (orgId: string) => {
    const membership = memberships.find(m => m.org_id === orgId)
    return membership?.role || 'cx_engineer'
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  const ocaMemberships = memberships.filter(m => m.role === 'OCA')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">CXPro Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organizations */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Organizations</h3>
                  <button
                    onClick={() => setShowOrgForm(!showOrgForm)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Create Org
                  </button>
                </div>

                {showOrgForm && (
                  <form onSubmit={handleCreateOrg} className="mb-4 p-4 bg-gray-50 rounded">
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        placeholder="Organization Name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                        className="px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Organization Slug (unique)"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value)}
                        required
                        className="px-3 py-2 border rounded"
                      />
                      <div className="flex space-x-2">
                        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOrgForm(false)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {orgs.map(org => (
                    <div key={org.id} className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{org.name}</h4>
                          <p className="text-sm text-gray-600">@{org.slug}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {getUserRole(org.id)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orgs.length === 0 && (
                    <p className="text-gray-500 text-sm">No organizations yet. Create one to get started!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                  {ocaMemberships.length > 0 && (
                    <button
                      onClick={() => setShowProjectForm(!showProjectForm)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Create Project
                    </button>
                  )}
                </div>

                {showProjectForm && (
                  <form onSubmit={handleCreateProject} className="mb-4 p-4 bg-gray-50 rounded">
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        value={selectedOrgForProject}
                        onChange={(e) => setSelectedOrgForProject(e.target.value)}
                        required
                        className="px-3 py-2 border rounded"
                      >
                        <option value="">Select Organization</option>
                        {orgs.filter(org => getUserRole(org.id) === 'OCA').map(org => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        required
                        className="px-3 py-2 border rounded"
                      />
                      <textarea
                        placeholder="Project Description"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="px-3 py-2 border rounded"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowProjectForm(false)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {projects.map(project => {
                    const org = orgs.find(o => o.id === project.org_id)
                    return (
                      <div key={project.id} className="p-3 border rounded hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-gray-600">{org?.name}</p>
                            {project.description && (
                              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => router.push(`/project/${project.id}`)}
                            className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {projects.length === 0 && (
                    <p className="text-gray-500 text-sm">No projects yet. Create one to get started!</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invite Users */}
          {ocaMemberships.length > 0 && projects.length > 0 && (
            <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Invite Users</h3>
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Send Invite
                  </button>
                </div>

                {showInviteForm && (
                  <form onSubmit={handleInviteUser} className="p-4 bg-gray-50 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        className="px-3 py-2 border rounded"
                      />
                      <select
                        value={selectedOrgForInvite}
                        onChange={(e) => {
                          setSelectedOrgForInvite(e.target.value)
                          setSelectedProjectForInvite('')
                        }}
                        required
                        className="px-3 py-2 border rounded"
                      >
                        <option value="">Select Organization</option>
                        {orgs.filter(org => getUserRole(org.id) === 'OCA').map(org => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                      <select
                        value={selectedProjectForInvite}
                        onChange={(e) => setSelectedProjectForInvite(e.target.value)}
                        required
                        className="px-3 py-2 border rounded"
                        disabled={!selectedOrgForInvite}
                      >
                        <option value="">Select Project</option>
                        {projects
                          .filter(p => p.org_id === selectedOrgForInvite)
                          .map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                          ))}
                      </select>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                        Send Invite
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInviteForm(false)}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}