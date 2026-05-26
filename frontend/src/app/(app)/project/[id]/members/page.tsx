'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type DisciplineScope } from '@/lib/supabase'
import { getMembersForProject, getPendingInvitesForProject, updateDiscipline, getCurrentUserRole, type ProjectMember, type PendingInvite } from '@/lib/members'
import { getErrorMessage } from '@/lib/error'
import { ROLES, ROLE_LABELS } from '@/lib/roles'

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
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [updatingDiscipline, setUpdatingDiscipline] = useState<string | null>(null)
  const [isOCA, setIsOCA] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)

  // Check authentication and load disciplines
  useEffect(() => {
    const initialize = async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/auth')
        return
      }

      // Check if user is OCA
      try {
        const role = await getCurrentUserRole(session.user.id, projectId)
        setIsOCA(role === 'OCA')
      } catch (error) {
        console.error('Error checking user role:', error)
        setIsOCA(false)
      } finally {
        setRoleLoading(false)
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

  // Load members and pending invites
  useEffect(() => {
    const loadMembersData = async () => {
      setMembersLoading(true)
      try {
        const [membersData, invitesData] = await Promise.all([
          getMembersForProject(projectId),
          getPendingInvitesForProject(projectId)
        ])
        setMembers(membersData)
        setPendingInvites(invitesData)
      } catch (error) {
        console.error('Error loading members data:', error)
      } finally {
        setMembersLoading(false)
      }
    }

    if (projectId) {
      loadMembersData()
    }
  }, [projectId])

  const handleDisciplineChange = async (userId: string, newDisciplineScopeId: string) => {
    setUpdatingDiscipline(userId)
    try {
      await updateDiscipline(userId, projectId, newDisciplineScopeId)
      
      // Reload members to show the updated discipline
      const membersData = await getMembersForProject(projectId)
      setMembers(membersData)
    } catch (error) {
      console.error('Error updating discipline:', error)
      setError('Failed to update discipline')
    } finally {
      setUpdatingDiscipline(null)
    }
  }

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/invites`, {
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
      
      // Reload pending invites to show the new one
      const invitesData = await getPendingInvitesForProject(projectId)
      setPendingInvites(invitesData)
      
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Project Members</h1>

      {roleLoading ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="text-gray-500">Loading permissions...</div>
        </div>
      ) : isOCA ? (
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
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
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
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="text-gray-500 text-center py-4">
            Only OCAs can invite members
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Members</h2>
        
        {membersLoading ? (
          <div className="text-gray-500">Loading members...</div>
        ) : members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discipline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={disciplines.find(d => d.name === member.discipline_name)?.id || ''}
                        onChange={(e) => handleDisciplineChange(member.user_id, e.target.value)}
                        disabled={updatingDiscipline === member.user_id || disciplines.length === 0}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {disciplines.map((discipline) => (
                          <option key={discipline.id} value={discipline.id}>
                            {discipline.name}
                          </option>
                        ))}
                        {!member.discipline_name && (
                          <option value="" disabled>
                            Select discipline
                          </option>
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 py-8 text-center">
            No members yet. Use the form above to invite team members.
          </div>
        )}
      </div>

      {/* Pending Invitations Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
        
        {membersLoading ? (
          <div className="text-gray-500">Loading invitations...</div>
        ) : pendingInvites.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discipline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.discipline_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.invited_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 py-8 text-center">
            No pending invitations.
          </div>
        )}
      </div>
    </div>
  )
}