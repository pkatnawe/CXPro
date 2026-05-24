'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface InboxItem {
  id: string
  user_id: string
  project_id: string
  source_event_type: string
  source_resource_id: string | null
  source_resource_type: string | null
  title: string
  description: string | null
  item_type: 'ai_draft' | 'ai_refusal' | 'other'
  action_state: 'pending' | 'acted' | 'dismissed'
  test_procedure_instance_id: string | null
  document_id: string | null
  agent_run_id: string | null
  metadata: Record<string, unknown> | null
  priority: number
  bucket_date: string
  created_at: string
  acted_at: string | null
}

interface Project {
  id: string
  name: string
}

export default function InboxPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [projects, setProjects] = useState<Map<string, Project>>(new Map())
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadInboxItems = async () => {
    try {
      // Load pending inbox items for the current user
      const { data: items, error } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('action_state', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading inbox items:', error)
        return
      }

      setInboxItems(items || [])

      // Load project names for the items
      if (items && items.length > 0) {
        const projectIds = [...new Set(items.map(item => item.project_id))]
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds)

        if (projectsData) {
          const projectMap = new Map(projectsData.map(p => [p.id, p]))
          setProjects(projectMap)
        }
      }
    } catch (error) {
      console.error('Error loading inbox:', error)
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
      await loadInboxItems()
      setLoading(false)
    }

    getUser()
  }, [router])

  // Set up Realtime subscription for inbox updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`inbox_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inbox_items',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Inbox update:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Add new item if it's pending
            if (payload.new && (payload.new as InboxItem).action_state === 'pending') {
              setInboxItems(prev => [payload.new as InboxItem, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing item
            const updated = payload.new as InboxItem
            if (updated.action_state !== 'pending') {
              // Remove from inbox if no longer pending
              setInboxItems(prev => prev.filter(item => item.id !== updated.id))
            } else {
              // Update the item
              setInboxItems(prev => prev.map(item => 
                item.id === updated.id ? updated : item
              ))
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted item
            setInboxItems(prev => prev.filter(item => item.id !== (payload.old as InboxItem).id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  const handleReviewDraft = (item: InboxItem) => {
    if (item.test_procedure_instance_id) {
      // Navigate to the entity detail page for the test procedure
      router.push(`/entity/${item.test_procedure_instance_id}`)
    }
  }

  const handleUploadMoreDocs = (item: InboxItem) => {
    if (item.project_id) {
      // Navigate to project page to upload more documents
      router.push(`/project/${item.project_id}`)
    }
  }

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'ai_draft':
        return '🤖'
      case 'ai_refusal':
        return '⚠️'
      default:
        return '📋'
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
              <p className="text-sm text-gray-600 mt-1">Your action items across all projects</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </button>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/auth')
                }}
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
          {inboxItems.length === 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nothing needs your attention</h3>
              <p className="text-gray-600 mb-6">Upload a document to get started.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Daily bucket header */}
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Today&apos;s Items
              </div>
              
              {/* Inbox items */}
              {inboxItems.map((item) => {
                const project = projects.get(item.project_id)
                const isRefusal = item.item_type === 'ai_refusal'
                
                return (
                  <div
                    key={item.id}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="text-2xl">{getItemIcon(item.item_type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                              {item.item_type === 'ai_draft' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  AI Draft
                                </span>
                              )}
                              {item.item_type === 'ai_refusal' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Needs Info
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mt-1">{item.description}</p>
                            
                            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                              {project && (
                                <span>Project: {project.name}</span>
                              )}
                              {item.metadata?.asset_tag && (
                                <span>Asset: {item.metadata.asset_tag}</span>
                              )}
                              {item.metadata?.document_name && (
                                <span>Source: {item.metadata.document_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {isRefusal ? (
                            <button
                              onClick={() => handleUploadMoreDocs(item)}
                              className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
                            >
                              Upload more docs
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReviewDraft(item)}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                              Review draft
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}