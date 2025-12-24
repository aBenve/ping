import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { alert_id, lat, lng } = await req.json()

    if (!alert_id || lat === undefined || lng === undefined) {
      return new Response(
        JSON.stringify({ error: 'alert_id, lat, and lng are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update last known location
    const { error } = await supabase
      .from('alerts')
      .update({
        last_known_lat: lat,
        last_known_lng: lng,
        last_known_at: new Date().toISOString(),
      })
      .eq('id', alert_id)
      .eq('status', 'active')

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating location:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
