import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find alerts that have exceeded their fallback time
    const now = new Date().toISOString()
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select(`
        *,
        user:profiles!user_id(*),
        recipients:alert_recipients(
          *,
          recipient:profiles(*)
        )
      `)
      .eq('status', 'active')
      .lt('fallback_at', now)

    if (alertsError) {
      throw alertsError
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No fallbacks to process', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let notifiedCount = 0

    for (const alert of alerts) {
      // Update alert status
      await supabase
        .from('alerts')
        .update({
          status: 'fallback_triggered',
          triggered_at: now,
        })
        .eq('id', alert.id)

      // Mark recipients as notified
      await supabase
        .from('alert_recipients')
        .update({ notified_at: now })
        .eq('alert_id', alert.id)

      // Build notification message
      const userName = alert.user?.full_name || alert.user?.username || 'Alguien'
      let bodyText = `${userName} no llegó a ${alert.destination_name}.`
      
      if (alert.last_known_lat && alert.last_known_lng) {
        bodyText += ` Última ubicación conocida disponible.`
      } else {
        bodyText += ` Te recomendamos contactarlo/a.`
      }

      // Send push notifications
      const messages = alert.recipients
        .filter((r: any) => r.recipient?.push_token)
        .map((r: any) => ({
          to: r.recipient.push_token,
          title: '⚠️ No llegó a destino',
          body: bodyText,
          data: {
            type: 'fallback',
            alert_id: alert.id,
            last_lat: alert.last_known_lat,
            last_lng: alert.last_known_lng,
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
        notifiedCount += messages.length
      }

      processedCount++
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        notified: notifiedCount 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing fallbacks:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
