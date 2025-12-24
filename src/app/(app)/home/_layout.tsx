import { Stack } from 'expo-router'

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="create" 
        options={{ 
          headerShown: true,
          title: 'Crear alerta',
          presentation: 'modal',
        }} 
      />
    </Stack>
  )
}
