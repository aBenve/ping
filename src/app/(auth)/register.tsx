import { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks'
import { colors } from '@/constants'

export default function RegisterScreen() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
    if (!email || !password || !username) {
      setError('Completá todos los campos obligatorios')
      return
    }

    if (username.length < 3) {
      setError('El username debe tener al menos 3 caracteres')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signUp(email, password, username.toLowerCase(), fullName || undefined)
      router.replace('/(app)/home')
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Unite a Ping y empezá a cuidar a los tuyos</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />

            <Input
              label="Username *"
              placeholder="juanperez"
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoCapitalize="none"
              autoComplete="username"
              hint="Solo letras minúsculas, números y guiones bajos"
            />

            <Input
              label="Email *"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Contraseña *"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              hint="Mínimo 6 caracteres"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.loginLink}>
              <Text style={styles.loginText}>¿Ya tenés cuenta? </Text>
              <Link href="/(auth)/login" asChild>
                <Text style={styles.loginLinkText}>Iniciá sesión</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
  },
  form: {
    width: '100%',
  },
  error: {
    color: colors.error.main,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
})
