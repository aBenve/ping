import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

serve(async (req) => {
  try {
    const { alert_id } = await req.json()

    if (!alert_id) {
      return new Response(
        JSON.stringify({ error: 'alert_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get alert with user and recipients
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select(`
        *,
        user:profiles!user_id(*),
        recipients:alert_recipients(
          *,
          recipient:profiles(*)
        )
      `)
      .eq('id', alert_id)
      .single()

    if (alertError || !alert) {
      return new Response(
        JSON.stringify({ error: 'Alert not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update alert status
    const { error: updateError } = await supabase
      .from('alerts')
      .update({
        status: 'completed',
        triggered_at: new Date().toISOString(),
      })
      .eq('id', alert_id)

    if (updateError) {
      throw updateError
    }

    // Mark recipients as notified
    const now = new Date().toISOString()
    await supabase
      .from('alert_recipients')
      .update({ notified_at: now })
      .eq('alert_id', alert_id)

    // Send push notifications to recipients
    const userName = alert.user?.full_name || alert.user?.username || 'Alguien'
    const messages = alert.recipients
      .filter((r: any) => r.recipient?.push_token)
      .map((r: any) => ({
        to: r.recipient.push_token,
        title: '✅ Llegó bien',
        body: `${userName} llegó a ${alert.destination_name}`,
        data: {
          type: 'arrival',
          alert_id: alert.id,
        },
        sound: 'default',
        priority: 'high',
      }))

    if (messages.length > 0) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })
    }

    return new Response(
      JSON.stringify({ success: true, notified: messages.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing arrival:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
