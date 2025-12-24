import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores/useStore'
import { RequestWithUsers } from '@/types/database'
import { config } from '@/constants'

interface SendRequestParams {
  to_user_id: string
  destination_name?: string
  destination_lat?: number
  destination_lng?: number
  message?: string
}

export function useRequests() {
  const { user, pendingRequests, setPendingRequests } = useStore()

  const fetchPendingRequests = useCallback(async (): Promise<RequestWithUsers[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          from_user:profiles!from_user_id(*),
          to_user:profiles!to_user_id(*)
        `)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      const requestsData = data as RequestWithUsers[]
      setPendingRequests(requestsData)
      return requestsData
    } catch (error) {
      console.error('Error fetching requests:', error)
      return []
    }
  }, [user, setPendingRequests])

  async function sendRequest(params: SendRequestParams): Promise<void> {
    if (!user) throw new Error('No user logged in')

    const expiresAt = new Date(Date.now() + config.requestExpirationHours * 60 * 60 * 1000)

    const { error } = await supabase
      .from('requests')
      .insert({
        from_user_id: user.id,
        to_user_id: params.to_user_id,
        destination_name: params.destination_name || null,
        destination_lat: params.destination_lat || null,
        destination_lng: params.destination_lng || null,
        message: params.message || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })

    if (error) throw error
  }

  async function respondToRequest(
    requestId: string, 
    action: 'accept' | 'reject'
  ): Promise<{ alert_id?: string }> {
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase.functions.invoke('handle-request', {
      body: {
        request_id: requestId,
        action,
        user_id: user.id,
      },
    })

    if (error) throw error

    await fetchPendingRequests()

    return data
  }

  async function getSentRequests(limit = 20): Promise<RequestWithUsers[]> {
    if (!user) return []

    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        from_user:profiles!from_user_id(*),
        to_user:profiles!to_user_id(*)
      `)
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as RequestWithUsers[]
  }

  return {
    pendingRequests,
    fetchPendingRequests,
    sendRequest,
    respondToRequest,
    getSentRequests,
  }
}
