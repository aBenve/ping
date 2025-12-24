import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth, usePushNotifications } from '@/hooks'
import { Loading } from '@/components/ui'

export default function RootLayout() {
  const { isLoading } = useAuth()
  
  // Initialize push notifications
  usePushNotifications()

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <Loading fullScreen message="Cargando..." />
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen 
          name="alert/[id]" 
          options={{ 
            headerShown: true,
            title: 'Detalle de alerta',
            presentation: 'modal',
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  )
}
