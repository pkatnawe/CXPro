'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Project } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/error'
import { getPrimaryOrg } from '@/lib/getPrimaryOrg'

export default function OrganizationPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [org, setOrg] = useState<{ id: string; name: string; role: 'OCA' | 'cx_engineer' } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const router = useRouter()

  // Form states
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  const loadUserData = async (userId: string) => {
    try {
      setLoadError(null)
      
      // Load primary org
      const primaryOrg = await getPrimaryOrg(userId)
      setOrg(primaryOrg)

      // Load projects filtered by org_id if org exists
      if (primaryOrg) {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('org_id', primaryOrg.id)

        if (projectsError) {
          setLoadError(getErrorMessage(projectsError))
        } else {
          setProjects(projectsData || [])
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setLoadError(getErrorMessage(error))
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
      await loadUserData(session.user.id)
    }

    getUser()
  }, [router])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!org) return

    try {
      const { error } = await supabase.rpc('create_project_with_discipline', {
        project_name: projectName,
        project_description: projectDescription,
        org_id: org.id
      })

      if (error) throw error

      setProjectName('')
      setProjectDescription('')
      setShowProjectForm(false)
      await loadUserData(user!.id)
    } catch (error) {
      alert('Error creating project: ' + getErrorMessage(error))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="bp-screen">
        <div className="bp-loading">Loading organization...</div>
      </div>
    )
  }

  return (
    <div className="bp-screen">
      <header className="bp-header">
        <div className="bp-header-inner">
          <div className="bp-header-content">
            <div className="bp-header-title">{org ? org.name : 'No organization yet'}</div>
            <div className="bp-header-tools">
              <span className="bp-subtle">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bp-btn-ghost"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="bp-content">
        <div className="bp-container">
          {/* Projects Section */}
          <div className="bp-card">
            <div className="bp-card-header">
              <h2 className="bp-h2">Projects</h2>
              {org && org.role === 'OCA' && (
                <button
                  onClick={() => setShowProjectForm(!showProjectForm)}
                  className="bp-btn-primary"
                >
                  Create Project
                </button>
              )}
            </div>

            {showProjectForm && (
              <form onSubmit={handleCreateProject} className="bp-form">
                <div className="bp-form-group">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    className="bp-input"
                  />
                </div>
                <div className="bp-form-group">
                  <textarea
                    placeholder="Project Description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="bp-textarea"
                    rows={3}
                  />
                </div>
                <div className="bp-form-actions">
                  <button type="submit" className="bp-btn-primary">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    className="bp-btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="bp-card-content">
              {projects.length > 0 ? (
                <div className="bp-list">
                  {projects.map(project => (
                    <div key={project.id} className="bp-list-item">
                      <div className="bp-list-item-content">
                        <h3 className="bp-list-item-title">{project.name}</h3>
                        {project.description && (
                          <p className="bp-list-item-desc">{project.description}</p>
                        )}
                      </div>
                      <div className="bp-list-item-actions">
                        <button
                          onClick={() => router.push(`/project/${project.id}`)}
                          className="bp-btn-secondary"
                        >
                          View
                        </button>
                        {org && org.role === 'OCA' && (
                          <button
                            onClick={() => router.push(`/project/${project.id}/members`)}
                            className="bp-btn-ghost"
                          >
                            Manage Team
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bp-empty">
                  {!org ? (
                    <p>No organization yet</p>
                  ) : loadError ? (
                    <>
                      <p>Could not load your projects</p>
                      <button
                        onClick={async () => {
                          setLoading(true)
                          await loadUserData(user!.id)
                        }}
                        className="bp-btn-secondary"
                      >
                        Retry
                      </button>
                    </>
                  ) : (
                    <p>No projects yet. Create one to get started</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}