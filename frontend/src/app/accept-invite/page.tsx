'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Processing invitation...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processInvitation = async () => {
      // Check if token is present
      if (!token) {
        setError('Invalid invitation link - no token provided')
        setLoading(false)
        setTimeout(() => router.push('/'), 3000)
        return
      }

      try {
        // Wait for auth session to be established
        // This is important because Supabase magic link auth happens asynchronously
        let retries = 0
        const maxRetries = 20 // 10 seconds total (20 * 500ms)
        let session = null

        while (retries < maxRetries) {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            session = data.session
            break
          }
          await new Promise(resolve => setTimeout(resolve, 500))
          retries++
        }

        if (!session) {
          setMessage('Waiting for authentication...')
          // Subscribe to auth changes for when the session is established
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (newSession) {
                subscription.unsubscribe()
                await handleInvitationWithSession(token)
              }
            }
          )
          
          // Set a timeout to handle if auth never completes
          setTimeout(() => {
            subscription.unsubscribe()
            if (loading) {
              setError('Authentication timeout. Please try the link again.')
              setLoading(false)
              setTimeout(() => router.push('/'), 3000)
            }
          }, 30000) // 30 second timeout
          
          return
        }

        // If we already have a session, process the invitation
        await handleInvitationWithSession(token)
        
      } catch (err) {
        console.error('Error processing invitation:', err)
        setError('An error occurred while processing your invitation')
        setLoading(false)
        setTimeout(() => router.push('/'), 3000)
      }
    }

    const handleInvitationWithSession = async (inviteToken: string) => {
      try {
        // Query pending_invitations to get the project_id
        // First, check if the invitation exists and get its details
        const { data: invitation, error: invitationError } = await supabase
          .from('pending_invitations')
          .select('*, projects!pending_invitations_project_id_fkey(id, name)')
          .eq('token', inviteToken)
          .single()

        if (invitationError || !invitation) {
          // Check if it's an expired or already accepted invitation
          const { data: expiredInvite } = await supabase
            .from('pending_invitations')
            .select('expires_at, accepted_at')
            .eq('token', inviteToken)
            .single()

          if (expiredInvite?.accepted_at) {
            setMessage('This invitation has already been accepted. Redirecting...')
            // Try to find the project through participations
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: participation } = await supabase
                .from('participations')
                .select('project_id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
              
              if (participation?.project_id) {
                setTimeout(() => router.push(`/project/${participation.project_id}`), 2000)
                return
              }
            }
            setTimeout(() => router.push('/dashboard'), 2000)
            return
          } else if (expiredInvite && new Date(expiredInvite.expires_at) < new Date()) {
            setError('This invitation has expired')
            setLoading(false)
            setTimeout(() => router.push('/'), 3000)
            return
          } else {
            setError('This invitation is invalid or has expired')
            setLoading(false)
            setTimeout(() => router.push('/'), 3000)
            return
          }
        }

        // Check if invitation is expired
        if (new Date(invitation.expires_at) < new Date()) {
          setError('This invitation has expired')
          setLoading(false)
          setTimeout(() => router.push('/'), 3000)
          return
        }

        // The invitation should have been automatically redeemed by the handle_new_user trigger
        // Check if user now has participation in the project
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: participation } = await supabase
            .from('participations')
            .select('project_id')
            .eq('user_id', user.id)
            .eq('project_id', invitation.project_id)
            .single()

          if (participation) {
            setMessage(`Welcome to ${invitation.projects?.name || 'the project'}! Redirecting...`)
            setLoading(false)
            setTimeout(() => router.push(`/project/${invitation.project_id}`), 2000)
          } else {
            // Redemption might still be processing
            setMessage('Setting up your access...')
            // Wait a bit and check again
            setTimeout(async () => {
              const { data: retryParticipation } = await supabase
                .from('participations')
                .select('project_id')
                .eq('user_id', user.id)
                .eq('project_id', invitation.project_id)
                .single()
              
              if (retryParticipation) {
                setMessage(`Welcome to ${invitation.projects?.name || 'the project'}! Redirecting...`)
                setTimeout(() => router.push(`/project/${invitation.project_id}`), 2000)
              } else {
                setError('Unable to verify your project access. Please contact support.')
                setTimeout(() => router.push('/dashboard'), 3000)
              }
              setLoading(false)
            }, 2000)
          }
        } else {
          setError('Unable to verify your authentication')
          setLoading(false)
          setTimeout(() => router.push('/auth'), 3000)
        }
        
      } catch (err) {
        console.error('Error handling invitation:', err)
        setError('An error occurred while processing your invitation')
        setLoading(false)
        setTimeout(() => router.push('/'), 3000)
      }
    }

    processInvitation()
  }, [token, router, loading])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {loading && !error && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-700">{message}</p>
              </>
            )}
            
            {error && (
              <>
                <div className="text-red-600 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <p className="text-gray-500 text-sm">Redirecting...</p>
              </>
            )}
            
            {!loading && !error && (
              <p className="text-green-600">{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}