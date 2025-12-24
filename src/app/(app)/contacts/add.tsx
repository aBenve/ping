import { useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { Button, Input, Card } from '@/components/ui'
import { useContacts } from '@/hooks'
import { colors } from '@/constants'

export default function AddContactScreen() {
  const { addContact } = useContacts()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!username.trim()) {
      Alert.alert('Error', 'Ingresá un username')
      return
    }

    setLoading(true)
    try {
      await addContact(username.trim())
      Alert.alert('Listo', 'Contacto agregado', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo agregar el contacto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar contacto</Text>
      <Text style={styles.subtitle}>
        Ingresá el username de la persona que querés agregar
      </Text>

      <Input
        label="Username"
        placeholder="juanperez"
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Card variant="outlined" style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Tu contacto también debe tener la app instalada para poder recibir notificaciones
        </Text>
      </Card>

      <Button
        title="Agregar contacto"
        onPress={handleAdd}
        loading={loading}
        disabled={!username.trim()}
        style={styles.button}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
  },
})
