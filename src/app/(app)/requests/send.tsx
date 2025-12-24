import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { Button, Input } from '@/components/ui'
import { ContactItem } from '@/components'
import { useContacts, useRequests } from '@/hooks'
import { colors } from '@/constants'

export default function SendRequestScreen() {
  const { contacts, fetchContacts } = useContacts()
  const { sendRequest } = useRequests()
  
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  async function handleSend() {
    if (!selectedContactId) {
      Alert.alert('Error', 'Seleccioná un contacto')
      return
    }

    setLoading(true)
    try {
      await sendRequest({
        to_user_id: selectedContactId,
        message: message || undefined,
      })
      Alert.alert('Listo', 'Solicitud enviada', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pedir que avise</Text>
      <Text style={styles.subtitle}>
        Enviá una solicitud para que un contacto te avise cuando llegue a destino
      </Text>

      <Text style={styles.label}>Seleccioná un contacto</Text>
      
      {contacts.length === 0 ? (
        <View style={styles.emptyContacts}>
          <Text style={styles.emptyContactsText}>
            No tenés contactos agregados
          </Text>
        </View>
      ) : (
        <View style={styles.contactsList}>
          {contacts.map(contact => (
            <ContactItem
              key={contact.id}
              contact={contact}
              selectable
              selected={selectedContactId === contact.contact_id}
              onSelect={() => setSelectedContactId(contact.contact_id)}
            />
          ))}
        </View>
      )}

      <Input
        label="Mensaje (opcional)"
        placeholder="Avisame cuando llegues a casa!"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
        containerStyle={styles.messageInput}
      />

      <Button
        title="Enviar solicitud"
        onPress={handleSend}
        loading={loading}
        disabled={!selectedContactId}
        style={styles.button}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 12,
  },
  contactsList: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 24,
  },
  emptyContacts: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 24,
  },
  emptyContactsText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  messageInput: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
})
