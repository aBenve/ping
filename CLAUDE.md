# CLAUDE.md - Contexto del proyecto Ping

Este archivo contiene el contexto necesario para que cualquier LLM pueda entender y trabajar con este proyecto.

## Qué es Ping

Ping es una app móvil que automatiza avisos de llegada mediante geofencing. Resuelve el problema de olvidarse de avisar cuando uno llega a destino (especialmente cuando está cansado, apurado, o en situaciones donde más se necesita).

## Problema que resuelve

- Usuarios olvidan avisar cuando llegan
- Familiares/amigos se preocupan innecesariamente
- El aviso manual requiere acción consciente en momentos de distracción

## Solución

1. Usuario crea una alerta con destino y contactos
2. La app monitorea ubicación en background
3. Al llegar, notifica automáticamente a los contactos
4. Si no llega en tiempo configurado (fallback), alerta a contactos con última ubicación

## Stack tecnológico

- **Frontend**: React Native + Expo SDK 54 + Expo Router v6
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **State management**: Zustand
- **Lenguaje**: TypeScript
- **Geofencing**: expo-location + expo-task-manager

## Estructura del proyecto

```
src/
├── app/                    # Screens con Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout con providers
│   ├── index.tsx           # Redirect según auth state
│   ├── (auth)/             # Grupo de rutas de autenticación
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/              # Grupo de rutas autenticadas (tabs)
│   │   ├── home/           # Tab principal
│   │   │   ├── index.tsx   # Lista alertas activas
│   │   │   └── create.tsx  # Wizard crear alerta (3 pasos)
│   │   ├── requests/       # Tab solicitudes
│   │   ├── contacts/       # Tab contactos
│   │   └── profile/        # Tab perfil
│   └── alert/[id].tsx      # Detalle de alerta (deep link)
├── components/
│   ├── ui/                 # Componentes base (Button, Input, Card, Loading)
│   ├── AlertCard.tsx       # Card de alerta activa
│   ├── RequestCard.tsx     # Card de solicitud pendiente
│   └── ContactItem.tsx     # Item de lista de contactos
├── hooks/
│   ├── useAuth.ts          # Autenticación con Supabase
│   ├── useAlerts.ts        # CRUD de alertas
│   ├── useContacts.ts      # CRUD de contactos
│   ├── useRequests.ts      # CRUD de solicitudes
│   ├── useGeofencing.ts    # Geofencing y location tracking
│   └── usePushNotifications.ts # Push notifications (solo dev builds)
├── stores/
│   └── useStore.ts         # Zustand store global
├── lib/
│   └── supabase.ts         # Cliente Supabase configurado
├── constants/
│   ├── colors.ts           # Paleta de colores y temas
│   └── config.ts           # Configuración (radios, tiempos, etc)
└── types/
    └── database.ts         # Tipos de las tablas de Supabase
```

## Modelo de datos (PostgreSQL)

### profiles
Extiende auth.users de Supabase:
- `id` (UUID, FK auth.users)
- `username` (unique)
- `full_name`, `phone`, `push_token`

### contacts
Relación entre usuarios:
- `user_id`, `contact_id` (FKs a profiles)
- `is_trusted` (círculo de confianza)

### alerts
Alertas de llegada:
- `destination_name`, `destination_lat`, `destination_lng`, `destination_radius`
- `fallback_minutes`, `fallback_at`
- `status`: 'active' | 'completed' | 'fallback_triggered' | 'cancelled'
- `last_known_lat`, `last_known_lng`, `last_known_at`

### alert_recipients
Quién recibe notificación de una alerta:
- `alert_id`, `recipient_id`
- `notified_at`

### requests
Solicitudes "avisame cuando llegues":
- `from_user_id`, `to_user_id`
- `destination_*` (opcional)
- `message`
- `status`: 'pending' | 'accepted' | 'rejected' | 'expired'

## Flujos principales

### Crear alerta (3 pasos)
1. **Destino**: Seleccionar ubicación (actual o buscar)
2. **Contactos**: Elegir quién recibe notificación
3. **Fallback**: Configurar tiempo máximo (30min - 24h)

### Llegada detectada
1. Geofence trigger en background
2. Background task llama Edge Function `process-arrival`
3. Edge Function actualiza status y envía push a recipients
4. Notificación: "✅ [nombre] llegó a [destino]"

### Fallback (no llegó)
1. Cron job cada minuto busca alertas vencidas
2. Edge Function `process-fallback` actualiza status
3. Envía push con última ubicación conocida
4. Notificación: "⚠️ [nombre] no llegó. Última ubicación: [coords]"

### Solicitudes
1. Usuario A envía solicitud a Usuario B
2. B recibe push y ve en tab Solicitudes
3. B acepta → se crea alerta automática con A como recipient
4. B rechaza → se actualiza status

## Edge Functions (Supabase)

- `send-notification`: Envía push via Expo Push API
- `process-arrival`: Procesa llegada, notifica recipients
- `process-fallback`: Cron que procesa alertas vencidas
- `handle-request`: Acepta/rechaza solicitudes
- `update-location`: Actualiza última ubicación conocida

## Decisiones de arquitectura

1. **Expo Router**: File-based routing, mejor DX y deep linking
2. **Supabase**: Backend completo sin servidor propio, RLS para seguridad
3. **Zustand**: Simple, sin boilerplate, buen rendimiento
4. **Geofencing nativo**: expo-location con background tasks
5. **Push via Expo**: Abstrae FCM/APNs, gratis hasta millones de mensajes

## Seguridad

- Row Level Security (RLS) en todas las tablas
- Usuarios solo ven sus datos y los de sus contactos
- Auth manejado por Supabase (no custom)
- Push tokens solo accesibles por el usuario

## Limitaciones conocidas

- Push notifications no funcionan en Expo Go (SDK 53+), requiere dev build
- Geofencing requiere permisos de ubicación "siempre"
- iOS limita background location más que Android

## Comandos de desarrollo

```bash
# Levantar Supabase local (requiere Docker)
supabase start

# Resetear DB y aplicar migraciones
supabase db reset

# Levantar Expo
npm start

# Limpiar cache
npx expo start --clear

# Ver logs de Supabase
supabase logs --service auth
supabase logs --service db
```

## Variables de entorno

```env
EXPO_PUBLIC_SUPABASE_URL=http://<tu-ip>:54321  # Local
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_PROJECT_ID=<expo project id>
```

## Próximos pasos / TODOs

- [ ] Resolver error "Database error saving new user"
- [ ] Implementar búsqueda de lugares (Google Places API)
- [ ] Crear development build para push notifications
- [ ] Tests unitarios y E2E
- [ ] Onboarding flow para nuevos usuarios
- [ ] Lugares guardados/favoritos
- [ ] Historial de alertas en perfil