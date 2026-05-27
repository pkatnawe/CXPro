"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProjectsForUser, type ProjectCard } from "@/lib/projects"

export function ProjectSwitcher() {
  const router = useRouter()
  const params = useParams()
  const currentProjectId = params.id as string
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await getProjectsForUser()
      setProjects(data)
    } catch (err) {
      console.error("Failed to load projects for switcher:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (newProjectId: string) => {
    if (newProjectId !== currentProjectId) {
      router.push(`/project/${newProjectId}/members`)
    }
  }

  // Hide switcher if user has fewer than 2 projects
  if (loading || projects.length < 2) {
    return null
  }

  return (
    <div className="project-switcher">
      <label htmlFor="project-select" className="switcher-label">
        Project:
      </label>
      <select
        id="project-select"
        className="bp-select"
        value={currentProjectId}
        onChange={(e) => handleProjectChange(e.target.value)}
      >
        {projects.map((project) => (
          <option key={project.project_id} value={project.project_id}>
            {project.name} - {project.org_name}
          </option>
        ))}
      </select>
      
      <style jsx>{`
        .project-switcher {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .switcher-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--bp-text-secondary);
        }
        
        .bp-select {
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid var(--bp-border);
          border-radius: 6px;
          background: var(--bp-surface);
          color: var(--bp-text);
          cursor: pointer;
          min-width: 250px;
        }
        
        .bp-select:hover {
          border-color: var(--bp-accent);
        }
        
        .bp-select:focus {
          outline: none;
          border-color: var(--bp-accent);
          box-shadow: 0 0 0 3px var(--bp-accent-alpha);
        }
      `}</style>
    </div>
  )
}