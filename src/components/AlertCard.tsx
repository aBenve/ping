import { View, Text, StyleSheet } from 'react-native'
import { Card, Button } from '@/components/ui'
import { colors } from '@/constants'
import { AlertWithRecipients } from '@/types/database'

interface AlertCardProps {
  alert: AlertWithRecipients
  onCancel: () => void
  onArrived: () => void
}

export function AlertCard({ alert, onCancel, onArrived }: AlertCardProps) {
  const fallbackTime = new Date(alert.fallback_at)
  const now = new Date()
  const timeRemaining = Math.max(0, fallbackTime.getTime() - now.getTime())
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
  
  const timeString = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m`

  const recipientCount = alert.recipients?.length || 0

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Alerta activa</Text>
        </View>
      </View>

      <Text style={styles.destination}>{alert.destination_name}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Notificando a:</Text>
        <Text style={styles.infoValue}>
          {recipientCount} {recipientCount === 1 ? 'persona' : 'personas'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Fallback en:</Text>
        <Text style={styles.infoValue}>{timeString}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          variant="outline"
          size="sm"
          onPress={onCancel}
          style={styles.actionButton}
        />
        <Button
          title="Ya llegué ✓"
          variant="primary"
          size="sm"
          onPress={onArrived}
          style={styles.actionButton}
          testID="btn-arrived"
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success.dark,
  },
  destination: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
})
