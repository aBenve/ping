import { Stack } from 'expo-router'

export default function ContactsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="add" 
        options={{ 
          headerShown: true,
          title: 'Agregar contacto',
          presentation: 'modal',
        }} 
      />
    </Stack>
  )
}
