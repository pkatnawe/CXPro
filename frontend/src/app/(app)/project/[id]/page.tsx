'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type Project, type Document } from '@/lib/supabase'
import { uploadPDF } from '@/lib/storage'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [userRole, setUserRole] = useState<'OCA' | 'cx_engineer' | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const loadProjectData = useCallback(async (userId: string) => {
    try {
      setLoading(true)

      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) {
        console.error('Project load error:', projectError)
        router.push('/dashboard')
        return
      }

      setProject(projectData)

      // Load user's role in this project's organization
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', projectData.org_id)
        .single()

      if (membershipError) {
        console.error('Membership load error:', membershipError)
        router.push('/dashboard')
        return
      }

      setUserRole(membershipData.role)

      // Load documents for this project
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (documentsError) {
        console.error('Documents load error:', documentsError)
      } else {
        setDocuments(documentsData || [])
      }

    } catch (error) {
      console.error('Error loading project data:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    const initialize = async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/auth')
        return
      }

      setUser(session.user)
      await loadProjectData(session.user.id)
    }

    initialize()
  }, [projectId, router, loadProjectData])

  useEffect(() => {
    if (!project) return

    // Subscribe to real-time document updates
    const subscription = supabase
      .channel(`documents-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Document status update:', payload)
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => [...prev, payload.new as Document])
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => prev.map(doc => 
              doc.id === payload.new.id ? payload.new as Document : doc
            ))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [project, projectId])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !project) return

    setUploading(true)
    setUploadError(null)

    try {
      const result = await uploadPDF(file, projectId, user.id)
      
      if (!result.success) {
        setUploadError(result.error || 'Upload failed')
      } else {
        // Clear the file input
        event.target.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Unexpected error during upload')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'indexed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Project not found</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 flex items-center"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="mt-1 text-gray-600">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {userRole}
              </span>
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Upload Section - OCA only */}
          {userRole === 'OCA' && (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload PDF Document</h3>
                
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {uploadError}
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  {uploading && (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  Only PDF files are allowed. Maximum file size: 25MB.
                </p>
              </div>
            </div>
          )}

          {/* Documents List */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
              
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-lg text-gray-500">No documents uploaded yet</p>
                  {userRole === 'OCA' && (
                    <p className="mt-2 text-gray-400">Upload a PDF above to get started</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {document.original_filename}
                          </h4>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatFileSize(document.file_size)}</span>
                            <span>•</span>
                            <span>{new Date(document.created_at).toLocaleString()}</span>
                            {document.failure_reason && (
                              <>
                                <span>•</span>
                                <span className="text-red-600">{document.failure_reason}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                            {document.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}