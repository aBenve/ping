import { View, Text, StyleSheet } from 'react-native'
import { Card, Button } from '@/components/ui'
import { colors } from '@/constants'
import { RequestWithUsers } from '@/types/database'

interface RequestCardProps {
  request: RequestWithUsers
  onAccept: () => void
  onReject: () => void
  loading?: boolean
}

export function RequestCard({ request, onAccept, onReject, loading }: RequestCardProps) {
  const fromName = request.from_user?.full_name || request.from_user?.username || 'Alguien'
  const createdAt = new Date(request.created_at)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  let timeAgo: string
  if (diffMins < 1) {
    timeAgo = 'Ahora'
  } else if (diffMins < 60) {
    timeAgo = `Hace ${diffMins} min`
  } else {
    const diffHours = Math.floor(diffMins / 60)
    timeAgo = `Hace ${diffHours}h`
  }

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fromName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.fromName}>{fromName}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.message}>
        Te pide que avises cuando llegues
        {request.destination_name && (
          <Text style={styles.destination}> a "{request.destination_name}"</Text>
        )}
      </Text>

      {request.message && (
        <Text style={styles.customMessage}>"{request.message}"</Text>
      )}

      <View style={styles.actions}>
        <Button
          title="Rechazar"
          variant="ghost"
          size="sm"
          onPress={onReject}
          disabled={loading}
          style={styles.actionButton}
        />
        <Button
          title="Aceptar"
          variant="primary"
          size="sm"
          onPress={onAccept}
          loading={loading}
          style={styles.actionButton}
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[700],
  },
  headerText: {
    flex: 1,
  },
  fromName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  timeAgo: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  destination: {
    fontWeight: '600',
    color: colors.gray[900],
  },
  customMessage: {
    fontSize: 13,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginTop: 8,
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
