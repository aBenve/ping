import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card } from '@/components/ui'
import { AlertCard } from '@/components'
import { useAuth, useAlerts } from '@/hooks'
import { colors } from '@/constants'

export default function HomeScreen() {
  const { user } = useAuth()
  const { activeAlert, fetchActiveAlert, cancelAlert, markArrived } = useAlerts()
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchActiveAlert()
  }, [fetchActiveAlert])

  async function onRefresh() {
    setRefreshing(true)
    await fetchActiveAlert()
    setRefreshing(false)
  }

  async function handleCancel() {
    if (!activeAlert) return
    setActionLoading(true)
    try {
      await cancelAlert(activeAlert.id)
    } catch (error) {
      console.error('Error cancelling alert:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleArrived() {
    if (!activeAlert) return
    setActionLoading(true)
    try {
      await markArrived(activeAlert.id)
    } catch (error) {
      console.error('Error marking arrived:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const greeting = getGreeting()
  const displayName = user?.full_name || user?.username || 'Usuario'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{displayName} 👋</Text>
          </View>
        </View>

        {activeAlert ? (
          <AlertCard
            alert={activeAlert}
            onCancel={handleCancel}
            onArrived={handleArrived}
          />
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>Sin alertas activas</Text>
            <Text style={styles.emptyText}>
              Creá una alerta para que tus contactos sepan cuando llegues a destino
            </Text>
            <Button
              title="+ Crear alerta"
              onPress={() => router.push('/(app)/home/create')}
              style={styles.createButton}
            />
          </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cómo funciona</Text>
          
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>1️⃣</Text>
              <Text style={styles.infoText}>Creás una alerta con tu destino</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>2️⃣</Text>
              <Text style={styles.infoText}>Elegís a quién notificar</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>3️⃣</Text>
              <Text style={styles.infoText}>Cuando llegás, se avisa automáticamente</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días,'
  if (hour < 19) return 'Buenas tardes,'
  return 'Buenas noches,'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.gray[500],
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  createButton: {
    minWidth: 200,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
  },
  infoCard: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[700],
    flex: 1,
  },
})
