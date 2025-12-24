import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Card, Loading } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { AlertWithRecipients } from '@/types/database'
import { colors } from '@/constants'

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [alert, setAlert] = useState<AlertWithRecipients | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlert()
  }, [id])

  async function fetchAlert() {
    if (!id) return

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
        .eq('id', id)
        .single()

      if (data && !error) {
        setAlert(data as AlertWithRecipients)
      }
    } catch (error) {
      console.error('Error fetching alert:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading fullScreen message="Cargando alerta..." />
  }

  if (!alert) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Alerta no encontrada</Text>
      </View>
    )
  }

  const statusConfig = {
    active: { label: 'Activa', color: colors.success.main, bg: colors.success.light },
    completed: { label: 'Completada', color: colors.success.dark, bg: colors.success.light },
    fallback_triggered: { label: 'Fallback activado', color: colors.warning.dark, bg: colors.warning.light },
    cancelled: { label: 'Cancelada', color: colors.gray[500], bg: colors.gray[100] },
  }

  const status = statusConfig[alert.status]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </View>

      <Text style={styles.destination}>{alert.destination_name}</Text>
      
      <Card variant="outlined" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Creada</Text>
          <Text style={styles.infoValue}>
            {new Date(alert.created_at).toLocaleString('es-AR')}
          </Text>
        </View>

        {alert.triggered_at && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {alert.status === 'completed' ? 'Llegó' : 'Activada'}
            </Text>
            <Text style={styles.infoValue}>
              {new Date(alert.triggered_at).toLocaleString('es-AR')}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fallback configurado</Text>
          <Text style={styles.infoValue}>{alert.fallback_minutes} minutos</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Destinatarios</Text>
      <Card variant="outlined">
        {alert.recipients?.map((r, index) => (
          <View key={r.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.recipientRow}>
              <View style={styles.recipientAvatar}>
                <Text style={styles.recipientInitial}>
                  {(r.recipient?.full_name || r.recipient?.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>
                  {r.recipient?.full_name || r.recipient?.username}
                </Text>
                {r.notified_at && (
                  <Text style={styles.notifiedAt}>
                    Notificado: {new Date(r.notified_at).toLocaleString('es-AR')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </Card>

      {alert.last_known_lat && alert.last_known_lng && (
        <>
          <Text style={styles.sectionTitle}>Última ubicación conocida</Text>
          <Card variant="outlined">
            <Text style={styles.locationText}>
              📍 {alert.last_known_lat.toFixed(4)}, {alert.last_known_lng.toFixed(4)}
            </Text>
            {alert.last_known_at && (
              <Text style={styles.locationTime}>
                Actualizada: {new Date(alert.last_known_at).toLocaleString('es-AR')}
              </Text>
            )}
          </Card>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: colors.gray[500],
    marginTop: 40,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  destination: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 20,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  infoValue: {
    fontSize: 14,
    color: colors.gray[900],
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipientInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[700],
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[900],
  },
  notifiedAt: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
  locationText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  locationTime: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
})
