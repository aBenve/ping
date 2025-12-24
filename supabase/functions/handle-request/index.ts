import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

serve(async (req) => {
  try {
    const { request_id, action, user_id } = await req.json()

    if (!request_id || !action || !user_id) {
      return new Response(
        JSON.stringify({ error: 'request_id, action, and user_id are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!['accept', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'action must be "accept" or "reject"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request with users
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        from_user:profiles!from_user_id(*),
        to_user:profiles!to_user_id(*)
      `)
      .eq('id', request_id)
      .single()

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is the recipient
    if (request.to_user_id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()

    if (action === 'reject') {
      // Just update the request status
      await supabase
        .from('requests')
        .update({
          status: 'rejected',
          responded_at: now,
        })
        .eq('id', request_id)

      return new Response(
        JSON.stringify({ success: true, status: 'rejected' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Accept: Create alert and notify requester
    const fallbackMinutes = 60 // Default 1 hour
    const fallbackAt = new Date(Date.now() + fallbackMinutes * 60 * 1000)

    // Create alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        user_id: request.to_user_id,
        destination_name: request.destination_name || 'Destino solicitado',
        destination_lat: request.destination_lat || 0,
        destination_lng: request.destination_lng || 0,
        destination_radius: 100,
        fallback_minutes: fallbackMinutes,
        fallback_at: fallbackAt.toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (alertError) {
      throw alertError
    }

    // Add requester as recipient
    await supabase
      .from('alert_recipients')
      .insert({
        alert_id: alert.id,
        recipient_id: request.from_user_id,
      })

    // Update request
    await supabase
      .from('requests')
      .update({
        status: 'accepted',
        responded_at: now,
        created_alert_id: alert.id,
      })
      .eq('id', request_id)

    // Notify requester that request was accepted
    const toUserName = request.to_user?.full_name || request.to_user?.username || 'Alguien'
    
    if (request.from_user?.push_token) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          to: request.from_user.push_token,
          title: '✅ Solicitud aceptada',
          body: `${toUserName} aceptó avisarte cuando llegue`,
          data: {
            type: 'request_accepted',
            request_id: request.id,
            alert_id: alert.id,
          },
          sound: 'default',
        }]),
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: 'accepted',
        alert_id: alert.id 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error handling request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
