"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getProjectsForUser, type ProjectCard } from "@/lib/projects"
import { supabase } from "@/lib/supabase"

// ProjectThumb SVG component matching blueprint-app.jsx pattern
function ProjectThumb({ kind }: { kind?: string }) {
  const palettes: Record<string, string[]> = {
    aurora:    ["#E6E1D4", "#1240FF", "#1a1a1a"],
    meridian:  ["#1a1a1a", "#1240FF", "#3a3a3a"],
    northpoint:["#E6E1D4", "#1a1a1a", "#1240FF"],
    foundry:   ["#1240FF", "#1a1a1a", "#E6E1D4"],
  }
  
  // Rotate through palette kinds based on project index
  const colors = palettes[kind || "aurora"] || palettes.aurora
  
  // Simplified version of the SVG from blueprint-app.jsx
  return (
    <svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="110" fill={colors[0]}/>
      <path d="M0 90 L200 90" stroke={colors[2]} strokeWidth="0.5" opacity="0.3"/>
      {[...Array(20)].map((_, i) => (
        <line key={i} x1={i*10} y1="90" x2={i*10} y2="110" stroke={colors[2]} strokeWidth="0.3" opacity="0.2"/>
      ))}
      <rect x="50" y="40" width="40" height="50" fill="none" stroke={colors[2]} strokeWidth="0.8"/>
      <rect x="55" y="48" width="6" height="8" fill={colors[1]} opacity="0.7"/>
      <rect x="65" y="48" width="6" height="8" fill={colors[2]} opacity="0.4"/>
      <rect x="75" y="48" width="6" height="8" fill={colors[2]} opacity="0.4"/>
      <rect x="100" y="30" width="60" height="60" fill="none" stroke={colors[2]} strokeWidth="0.8"/>
      <rect x="105" y="36" width="6" height="6" fill={colors[1]} opacity="0.7"/>
      <path d="M40 90 L40 25 L100 25" fill="none" stroke={colors[1]} strokeWidth="1" strokeDasharray="3 2"/>
      <circle cx="40" cy="25" r="2" fill={colors[1]}/>
    </svg>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await getProjectsForUser()
      setProjects(data)
    } catch (err) {
      console.error("Failed to load projects:", err)
      setError("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const paletteKinds = ["aurora", "meridian", "northpoint", "foundry"]

  if (loading) {
    return (
      <div className="bp-screen">
        <div className="bp-loading">Loading projects...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bp-screen">
        <div className="bp-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="bp-screen">
      <div className="bp-page-head">
        <div>
          <div className="bp-eyebrow">— ALL PROJECTS</div>
          <h1 className="bp-h1">Projects</h1>
          <div className="bp-subtle">{projects.length} active project{projects.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="bp-page-tools">
          <button className="bp-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bp-empty">
          <p>No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        <div className="bp-proj-grid">
          {projects.map((project, index) => (
            <Link 
              key={project.project_id} 
              href={`/project/${project.project_id}`}
              className="bp-proj-tile"
            >
              <div className="bp-proj-tile-thumb">
                <ProjectThumb kind={paletteKinds[index % paletteKinds.length]} />
              </div>
              <div className="bp-proj-tile-body">
                <div className="bp-proj-tile-name">{project.name}</div>
                <div className="bp-proj-tile-meta">
                  <span>{project.org_name}</span>
                  {project.description && (
                    <>
                      <span className="bp-dot"/>
                      <span>{project.description}</span>
                    </>
                  )}
                </div>
                <div className="bp-proj-tile-foot">
                  <span className="bp-mono">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .bp-screen {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .bp-page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
        }

        .bp-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--bp-text-secondary);
          margin-bottom: 12px;
        }

        .bp-h1 {
          font-size: 32px;
          font-weight: 600;
          margin: 0;
          color: var(--bp-text);
        }

        .bp-subtle {
          font-size: 14px;
          color: var(--bp-text-tertiary);
          margin-top: 8px;
        }

        .bp-page-tools {
          display: flex;
          gap: 12px;
        }

        .bp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--bp-accent);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .bp-btn-primary:hover {
          background: var(--bp-accent-hover);
          transform: translateY(-1px);
        }

        .bp-loading, .bp-error, .bp-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--bp-text-secondary);
        }

        .bp-proj-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }

        .bp-proj-tile {
          display: block;
          background: var(--bp-surface);
          border: 1px solid var(--bp-border);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .bp-proj-tile:hover {
          border-color: var(--bp-accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .bp-proj-tile-thumb {
          height: 110px;
          background: var(--bp-bg-secondary);
          border-bottom: 1px solid var(--bp-border);
        }

        .bp-proj-tile-body {
          padding: 20px;
        }

        .bp-proj-tile-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--bp-text);
          margin-bottom: 8px;
        }

        .bp-proj-tile-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--bp-text-secondary);
          margin-bottom: 16px;
        }

        .bp-dot {
          width: 3px;
          height: 3px;
          background: var(--bp-text-tertiary);
          border-radius: 50%;
        }

        .bp-proj-tile-foot {
          padding-top: 12px;
          border-top: 1px solid var(--bp-border-subtle);
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--bp-text-tertiary);
        }

        .bp-mono {
          font-family: var(--font-jetbrains-mono);
        }
      `}</style>
    </div>
  )
}