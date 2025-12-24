import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores/useStore'
import { AlertWithRecipients } from '@/types/database'
import { useGeofencing } from './useGeofencing'

interface CreateAlertParams {
  destination_name: string
  destination_lat: number
  destination_lng: number
  destination_radius?: number
  fallback_minutes: number
  recipient_ids: string[]
}

export function useAlerts() {
  const { user, activeAlert, setActiveAlert } = useStore()
  const { startGeofencing, stopGeofencing } = useGeofencing()

  const fetchActiveAlert = useCallback(async () => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          recipients:alert_recipients(
            *,
            recipient:profiles(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (data && !error) {
        setActiveAlert(data as AlertWithRecipients)
        return data
      }
      
      setActiveAlert(null)
      return null
    } catch (error) {
      console.error('Error fetching active alert:', error)
      setActiveAlert(null)
      return null
    }
  }, [user, setActiveAlert])

  async function createAlert(params: CreateAlertParams): Promise<AlertWithRecipients> {
    if (!user) throw new Error('No user logged in')

    const fallbackAt = new Date(Date.now() + params.fallback_minutes * 60 * 1000)
    const radius = params.destination_radius || 100

    // 1. Crear alerta
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        destination_name: params.destination_name,
        destination_lat: params.destination_lat,
        destination_lng: params.destination_lng,
        destination_radius: radius,
        fallback_minutes: params.fallback_minutes,
        fallback_at: fallbackAt.toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (alertError) throw alertError

    // 2. Agregar recipients
    const recipientInserts = params.recipient_ids.map(recipient_id => ({
      alert_id: alert.id,
      recipient_id,
    }))

    const { error: recipientsError } = await supabase
      .from('alert_recipients')
      .insert(recipientInserts)

    if (recipientsError) throw recipientsError

    // 3. Iniciar geofencing
    await startGeofencing({
      alertId: alert.id,
      latitude: params.destination_lat,
      longitude: params.destination_lng,
      radius,
    })

    // 4. Refrescar alerta activa
    await fetchActiveAlert()

    return alert as AlertWithRecipients
  }

  async function cancelAlert(alertId: string): Promise<void> {
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('alerts')
      .update({ status: 'cancelled' })
      .eq('id', alertId)
      .eq('user_id', user.id)

    if (error) throw error

    await stopGeofencing()
    setActiveAlert(null)
  }

  async function markArrived(alertId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('process-arrival', {
      body: { alert_id: alertId },
    })

    if (error) throw error

    await stopGeofencing()
    setActiveAlert(null)
  }

  async function getAlertHistory(limit = 20): Promise<AlertWithRecipients[]> {
    if (!user) return []

    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        recipients:alert_recipients(
          *,
          recipient:profiles(*)
        )
      `)
      .eq('user_id', user.id)
      .neq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as AlertWithRecipients[]
  }

  return {
    activeAlert,
    fetchActiveAlert,
    createAlert,
    cancelAlert,
    markArrived,
    getAlertHistory,
  }
}
