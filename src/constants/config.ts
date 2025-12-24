export const config = {
  // Geofencing
  defaultGeofenceRadius: 100, // metros
  minGeofenceRadius: 50,
  maxGeofenceRadius: 500,
  
  // Fallback options (minutos)
  fallbackOptions: [
    { label: '30 minutos', value: 30 },
    { label: '1 hora', value: 60 },
    { label: '2 horas', value: 120 },
    { label: '4 horas', value: 240 },
    { label: '24 horas', value: 1440 },
  ],
  
  // Location updates
  locationUpdateInterval: 5 * 60 * 1000, // 5 minutos
  locationDistanceInterval: 100, // metros
  
  // Request expiration
  requestExpirationHours: 24,
  
  // Tasks
  geofenceTaskName: 'ping-geofence-task',
  locationUpdateTaskName: 'ping-location-update-task',
}

export const STORAGE_KEYS = {
  activeAlertId: 'ping_active_alert_id',
  onboardingComplete: 'ping_onboarding_complete',
}
