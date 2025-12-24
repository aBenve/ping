import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!email || !password || !username) {
      setError('Completá todos los campos obligatorios');
      return;
    }

    if (username.length < 3) {
      setError('El username debe tener al menos 3 caracteres');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(email, password, username.toLowerCase(), fullName || undefined);
      router.replace('/(app)/activity');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow p-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mt-6 mb-8">
            <Text className="text-3xl font-extrabold text-foreground mb-2">
              Crear cuenta
            </Text>
            <Text className="text-base text-muted-foreground">
              Unite a Ping y empezá a cuidar a los tuyos
            </Text>
          </View>

          {/* Form */}
          <View className="w-full">
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
              onChangeText={(text) =>
                setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))
              }
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

            {error ? (
              <Text className="text-destructive text-sm text-center mb-4">{error}</Text>
            ) : null}

            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              className="mt-2"
            />

            <View className="flex-row justify-center mt-6">
              <Text className="text-sm text-muted-foreground">¿Ya tenés cuenta? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-sm text-foreground font-semibold">Iniciá sesión</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
