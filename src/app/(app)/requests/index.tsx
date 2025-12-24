import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card } from '@/components/ui'
import { RequestCard } from '@/components'
import { useRequests } from '@/hooks'
import { colors } from '@/constants'

export default function RequestsScreen() {
  const { pendingRequests, fetchPendingRequests, respondToRequest } = useRequests()
  const [refreshing, setRefreshing] = useState(false)
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingRequests()
  }, [fetchPendingRequests])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPendingRequests()
    setRefreshing(false)
  }, [fetchPendingRequests])

  async function handleRespond(requestId: string, action: 'accept' | 'reject') {
    setLoadingRequestId(requestId)
    try {
      await respondToRequest(requestId, action)
    } catch (error) {
      console.error('Error responding to request:', error)
    } finally {
      setLoadingRequestId(null)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Solicitudes</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => router.push('/(app)/requests/send')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingRequests.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📨</Text>
            <Text style={styles.emptyTitle}>Sin solicitudes pendientes</Text>
            <Text style={styles.emptyText}>
              Cuando alguien te pida que avises cuando llegues, aparecerá acá
            </Text>
          </Card>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Pendientes ({pendingRequests.length})
            </Text>
            {pendingRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={() => handleRespond(request.id, 'accept')}
                onReject={() => handleRespond(request.id, 'reject')}
                loading={loadingRequestId === request.id}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
})
