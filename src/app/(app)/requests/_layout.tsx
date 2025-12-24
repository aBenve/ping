import { Stack } from 'expo-router'

export default function RequestsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="send" 
        options={{ 
          headerShown: true,
          title: 'Enviar solicitud',
          presentation: 'modal',
        }} 
      />
    </Stack>
  )
}
