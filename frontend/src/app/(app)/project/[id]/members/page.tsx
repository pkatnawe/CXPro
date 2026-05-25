'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type DisciplineScope } from '@/lib/supabase'

export default function MembersPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [disciplines, setDisciplines] = useState<DisciplineScope[]>([])
  const [formData, setFormData] = useState({
    email: '',
    role: 'cx_engineer',
    discipline_scope_id: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check authentication and load disciplines
  useEffect(() => {
    const initialize = async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/auth')
        return
      }

      // Load discipline scopes for this project
      const { data: disciplineData, error: disciplineError } = await supabase
        .from('discipline_scopes')
        .select('*')
        .eq('project_id', projectId)
        .order('name')

      if (disciplineError) {
        console.error('Error loading disciplines:', disciplineError)
        setError('Failed to load disciplines')
      } else {
        setDisciplines(disciplineData || [])
        // Set default discipline if available
        if (disciplineData && disciplineData.length > 0) {
          setFormData(prev => ({ ...prev, discipline_scope_id: disciplineData[0].id }))
        }
      }
    }

    initialize()
  }, [projectId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get current session for JWT
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('Authentication required')
        return
      }

      // Get project's org_id
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .single()

      if (projectError || !projectData) {
        setError('Failed to load project information')
        return
      }

      // Call the backend API
      const response = await fetch('http://localhost:8000/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: formData.email,
          org_id: projectData.org_id,
          project_id: projectId,
          role: formData.role,
          discipline_scope_id: formData.discipline_scope_id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `Failed to send invitation (${response.status})`)
      }

      const result = await response.json()
      
      // Clear form and show success
      setFormData({
        email: '',
        role: 'cx_engineer',
        discipline_scope_id: disciplines[0]?.id || ''
      })
      setSuccess(`Invitation sent successfully to ${formData.email}`)
      
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Project Members</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="teammate@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="cx_engineer">CX Engineer</option>
              <option value="OCA">OCA</option>
            </select>
          </div>

          <div>
            <label htmlFor="discipline" className="block text-sm font-medium text-gray-700 mb-1">
              Discipline
            </label>
            <select
              id="discipline"
              value={formData.discipline_scope_id}
              onChange={(e) => setFormData(prev => ({ ...prev, discipline_scope_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={disciplines.length === 0}
            >
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded p-3">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || disciplines.length === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}