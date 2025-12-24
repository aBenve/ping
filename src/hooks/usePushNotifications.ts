import { useEffect, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores/useStore'

// Configurar handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function usePushNotifications() {
  const { user } = useStore()
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token)
        if (user) {
          savePushToken(token)
        }
      }
    })

    // Listener para notificaciones recibidas (app abierta)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
    })

    // Listener para cuando el usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as {
        type?: string
        alert_id?: string
        request_id?: string
      }

      // Navegar según el tipo de notificación
      if (data.type === 'arrival' || data.type === 'fallback') {
        if (data.alert_id) {
          router.push(`/alert/${data.alert_id}`)
        }
      } else if (data.type === 'request_accepted' || data.type === 'new_request') {
        router.push('/requests')
      }
    })

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [])

  // Guardar token cuando el user cambie
  useEffect(() => {
    if (user && expoPushToken) {
      savePushToken(expoPushToken)
    }
  }, [user, expoPushToken])

  async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device')
      return null
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted')
      return null
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      })
    }

    try {
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID
      if (!projectId) {
        console.warn('EXPO_PUBLIC_PROJECT_ID not set')
        return null
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      })

      return token.data
    } catch (error) {
      console.error('Error getting push token:', error)
      return null
    }
  }

  async function savePushToken(token: string): Promise<void> {
    if (!user) return

    try {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error saving push token:', error)
    }
  }

  return {
    expoPushToken,
  }
}
