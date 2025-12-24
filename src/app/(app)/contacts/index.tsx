import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card } from '@/components/ui'
import { ContactItem } from '@/components'
import { useContacts } from '@/hooks'
import { colors } from '@/constants'

export default function ContactsScreen() {
  const { contacts, trustedContacts, fetchContacts, toggleTrusted, removeContact } = useContacts()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchContacts()
    setRefreshing(false)
  }, [fetchContacts])

  async function handleToggleTrusted(contactId: string, currentValue: boolean) {
    try {
      await toggleTrusted(contactId, !currentValue)
    } catch (error) {
      console.error('Error toggling trusted:', error)
    }
  }

  function handleRemove(contactId: string, name: string) {
    Alert.alert(
      'Eliminar contacto',
      `¿Estás seguro de que querés eliminar a ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeContact(contactId)
            } catch (error) {
              console.error('Error removing contact:', error)
            }
          }
        },
      ]
    )
  }

  const regularContacts = contacts.filter(c => !c.is_trusted)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Contactos</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => router.push('/(app)/contacts/add')}
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
        {contacts.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Sin contactos</Text>
            <Text style={styles.emptyText}>
              Agregá contactos para poder notificarles cuando llegues a destino
            </Text>
          </Card>
        ) : (
          <>
            {trustedContacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  ⭐ Círculo de confianza ({trustedContacts.length})
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Pueden enviarte solicitudes sin aprobación
                </Text>
                <View style={styles.contactsList}>
                  {trustedContacts.map(contact => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      onToggleTrusted={(value) => handleToggleTrusted(contact.contact_id, contact.is_trusted)}
                      onPress={() => handleRemove(
                        contact.contact_id,
                        contact.contact?.full_name || contact.contact?.username || 'contacto'
                      )}
                    />
                  ))}
                </View>
              </View>
            )}

            {regularContacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Contactos ({regularContacts.length})
                </Text>
                <View style={styles.contactsList}>
                  {regularContacts.map(contact => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      onToggleTrusted={(value) => handleToggleTrusted(contact.contact_id, contact.is_trusted)}
                      onPress={() => handleRemove(
                        contact.contact_id,
                        contact.contact?.full_name || contact.contact?.username || 'contacto'
                      )}
                    />
                  ))}
                </View>
              </View>
            )}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.gray[400],
    marginBottom: 12,
  },
  contactsList: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
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
