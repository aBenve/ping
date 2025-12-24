import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(app)/activity');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
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
          contentContainerClassName="flex-grow p-6 justify-center"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-full bg-foreground items-center justify-center mb-4">
              <MapPin color="#FFF" size={40} />
            </View>
            <Text className="text-4xl font-extrabold text-foreground mb-2">Ping</Text>
            <Text className="text-base text-muted-foreground text-center">
              Avisá cuando llegues, automáticamente
            </Text>
          </View>

          {/* Form */}
          <View className="w-full">
            <Input
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {error ? (
              <Text className="text-destructive text-sm text-center mb-4">{error}</Text>
            ) : null}

            <Button
              title="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              className="mt-2"
            />

            <View className="flex-row justify-center mt-6">
              <Text className="text-sm text-muted-foreground">¿No tenés cuenta? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="text-sm text-foreground font-semibold">Registrate</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
