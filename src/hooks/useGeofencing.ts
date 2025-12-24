import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { config, STORAGE_KEYS } from '@/constants'

interface GeofenceParams {
  alertId: string
  latitude: number
  longitude: number
  radius: number
}

// Task para geofencing
TaskManager.defineTask(config.geofenceTaskName, async ({ data, error }) => {
  if (error) {
    console.error('Geofence error:', error)
    return
  }

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType
    region: Location.LocationRegion
  }

  if (eventType === Location.GeofencingEventType.Enter) {
    const alertId = region.identifier

    try {
      await supabase.functions.invoke('process-arrival', {
        body: { alert_id: alertId },
      })

      // Detener geofencing
      await Location.stopGeofencingAsync(config.geofenceTaskName)
      
      const isUpdating = await Location.hasStartedLocationUpdatesAsync(config.locationUpdateTaskName)
      if (isUpdating) {
        await Location.stopLocationUpdatesAsync(config.locationUpdateTaskName)
      }

      await AsyncStorage.removeItem(STORAGE_KEYS.activeAlertId)
    } catch (err) {
      console.error('Error processing arrival:', err)
    }
  }
})

// Task para actualizar ubicación periódicamente
TaskManager.defineTask(config.locationUpdateTaskName, async ({ data, error }) => {
  if (error) {
    console.error('Location update error:', error)
    return
  }

  const { locations } = data as { locations: Location.LocationObject[] }
  const location = locations[0]

  if (location) {
    try {
      const alertId = await AsyncStorage.getItem(STORAGE_KEYS.activeAlertId)
      
      if (alertId) {
        await supabase.functions.invoke('update-location', {
          body: {
            alert_id: alertId,
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
        })
      }
    } catch (err) {
      console.error('Error updating location:', err)
    }
  }
})

export function useGeofencing() {
  async function requestPermissions(): Promise<boolean> {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync()
    
    if (foreground !== 'granted') {
      return false
    }

    const { status: background } = await Location.requestBackgroundPermissionsAsync()
    
    return background === 'granted'
  }

  async function checkPermissions(): Promise<boolean> {
    const { status: foreground } = await Location.getForegroundPermissionsAsync()
    const { status: background } = await Location.getBackgroundPermissionsAsync()
    
    return foreground === 'granted' && background === 'granted'
  }

  async function startGeofencing(params: GeofenceParams): Promise<void> {
    const hasPermissions = await requestPermissions()
    
    if (!hasPermissions) {
      throw new Error('Location permissions not granted')
    }

    // Guardar alertId para los background tasks
    await AsyncStorage.setItem(STORAGE_KEYS.activeAlertId, params.alertId)

    // Iniciar geofencing
    await Location.startGeofencingAsync(config.geofenceTaskName, [
      {
        identifier: params.alertId,
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius,
        notifyOnEnter: true,
        notifyOnExit: false,
      },
    ])

    // Iniciar actualizaciones de ubicación para fallback
    await Location.startLocationUpdatesAsync(config.locationUpdateTaskName, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: config.locationUpdateInterval,
      distanceInterval: config.locationDistanceInterval,
      foregroundService: {
        notificationTitle: 'Ping',
        notificationBody: 'Monitoreando tu viaje...',
        notificationColor: '#4F46E5',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    })
  }

  async function stopGeofencing(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.activeAlertId)

    try {
      const isGeofencing = await Location.hasStartedGeofencingAsync(config.geofenceTaskName)
      if (isGeofencing) {
        await Location.stopGeofencingAsync(config.geofenceTaskName)
      }
    } catch (err) {
      console.error('Error stopping geofencing:', err)
    }

    try {
      const isUpdating = await Location.hasStartedLocationUpdatesAsync(config.locationUpdateTaskName)
      if (isUpdating) {
        await Location.stopLocationUpdatesAsync(config.locationUpdateTaskName)
      }
    } catch (err) {
      console.error('Error stopping location updates:', err)
    }
  }

  async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    const hasPermissions = await requestPermissions()

    if (!hasPermissions) {
      throw new Error('Location permissions not granted')
    }

    try {
      // Try with balanced accuracy first (works better in simulators)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        mayShowUserSettingsDialog: true,
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
    } catch (error) {
      // Fallback: try getLastKnownPositionAsync
      const lastKnown = await Location.getLastKnownPositionAsync()

      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        }
      }

      // Final fallback for simulator testing - use a default location
      if (__DEV__) {
        console.warn('Using fallback location for development')
        return {
          latitude: 37.7749,
          longitude: -122.4194,
        }
      }

      throw error
    }
  }

  return {
    requestPermissions,
    checkPermissions,
    startGeofencing,
    stopGeofencing,
    getCurrentLocation,
  }
}
