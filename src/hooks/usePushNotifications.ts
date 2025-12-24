import { useEffect, useRef, useState } from 'react'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores/useStore'

// Verificar si estamos en Expo Go (no soporta push notifications desde SDK 53)
const isExpoGo = Constants.appOwnership === 'expo'

// Importar notifications solo si no estamos en Expo Go
let Notifications: typeof import('expo-notifications') | null = null
if (!isExpoGo) {
  Notifications = require('expo-notifications')
  // Configurar handler de notificaciones
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

export function usePushNotifications() {
  const { user } = useStore()
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    // Si estamos en Expo Go, no inicializar push notifications
    if (isExpoGo || !Notifications) {
      console.log('Push notifications disabled in Expo Go')
      return
    }

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
      if (notificationListener.current && Notifications) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current && Notifications) {
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
    // No disponible en Expo Go
    if (isExpoGo || !Notifications) {
      return null
    }

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
