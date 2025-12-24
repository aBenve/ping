# Ping 📍

App móvil para avisar automáticamente a tus contactos cuando llegás a destino usando geofencing.

## Stack

- **Frontend**: React Native + Expo (SDK 54) + Expo Router
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State**: Zustand
- **Lenguaje**: TypeScript

## Requisitos previos

- Node.js 18+
- Docker Desktop (para Supabase local)
- Expo Go en tu teléfono (SDK 54)
- Supabase CLI

```bash
# Instalar Supabase CLI (macOS)
brew install supabase/tap/supabase
```

## Setup inicial (primera vez)

### 1. Clonar e instalar dependencias

```bash
cd ~/Documents/Personal/ping
npm install --legacy-peer-deps
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

### 3. Levantar Supabase local

```bash
# Asegurate que Docker Desktop esté corriendo
supabase start
```

Esto te va a mostrar las credenciales locales:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbG...
Studio URL: http://127.0.0.1:54323
```

### 4. Configurar .env para desarrollo

Obtené tu IP local:

```bash
ipconfig getifaddr en0
```

Editá `.env` con los valores de `supabase start`:

```env
# Usar tu IP local (NO localhost) para que funcione desde el teléfono
EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.XX:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key de supabase start>
EXPO_PUBLIC_PROJECT_ID=<tu expo project id>
```

### 5. Aplicar migraciones

```bash
supabase db reset
```

### 6. Verificar que las tablas existan

Abrí http://127.0.0.1:54323 (Supabase Studio) y verificá que veas las tablas:
- profiles
- contacts
- alerts
- alert_recipients
- requests

---

## Desarrollo diario

### Levantar el ambiente

```bash
# 1. Asegurate que Docker Desktop esté corriendo

# 2. Levantar Supabase
supabase start

# 3. Levantar Expo
npm start
# o para limpiar cache:
npx expo start --clear
```

### Correr en dispositivo

1. Abrí Expo Go en tu teléfono
2. Escaneá el QR que aparece en la terminal
3. Si hay error de conexión, verificá que tu teléfono esté en la misma red WiFi

### Correr en simulador

```bash
# iOS
npm run ios

# Android
npm run android
```

---

## Comandos útiles

### Supabase

```bash
# Iniciar servicios
supabase start

# Detener servicios
supabase stop

# Ver logs de auth
supabase logs --service auth

# Ver logs de base de datos
supabase logs --service db

# Resetear base de datos (aplica migraciones desde cero)
supabase db reset

# Crear nueva migración
supabase migration new nombre_migracion

# Ver estado
supabase status
```

### Expo

```bash
# Iniciar
npm start

# Limpiar cache e iniciar
npx expo start --clear

# Correr en iOS
npm run ios

# Correr en Android  
npm run android

# Instalar dependencia compatible con Expo
npx expo install <paquete>

# Arreglar dependencias
npx expo install --fix
```

---

## Troubleshooting

### "Could not find table public.profiles"

La base de datos no tiene las tablas. Corré:

```bash
supabase db reset
```

### "Database error saving new user"

1. Verificá que `enable_confirmations = false` en `supabase/config.toml`
2. Reiniciá Supabase:
   ```bash
   supabase stop
   supabase start
   ```

### Error de conexión desde teléfono

- Verificá que el teléfono esté en la misma red WiFi
- Usá tu IP local en `.env`, no `localhost` ni `127.0.0.1`
- Obtené tu IP con: `ipconfig getifaddr en0`

### "expo-notifications not supported in Expo Go"

Normal en SDK 53+. Las push notifications solo funcionan en development builds, no en Expo Go. La app funciona igual sin ellas en desarrollo.

### Conflictos de dependencias

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx expo install --fix
```

---

## Estructura del proyecto

```
ping/
├── src/
│   ├── app/                    # Screens (Expo Router)
│   │   ├── (auth)/             # Login, Register
│   │   ├── (app)/              # Tab navigator
│   │   │   ├── home/           # Home + Crear alerta
│   │   │   ├── requests/       # Solicitudes
│   │   │   ├── contacts/       # Contactos
│   │   │   └── profile/        # Perfil
│   │   └── alert/[id].tsx      # Detalle alerta
│   ├── components/             # Componentes UI
│   ├── hooks/                  # Custom hooks
│   ├── stores/                 # Zustand store
│   ├── lib/                    # Supabase client
│   ├── constants/              # Colores, config
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge Functions
│   └── config.toml             # Config local
├── .env                        # Variables de entorno (no commitear)
└── .env.example                # Template de variables
```

---

## Deploy a producción

### 1. Crear proyecto en Supabase

Andá a [supabase.com](https://supabase.com) y creá un proyecto.

### 2. Linkear proyecto

```bash
supabase link --project-ref <tu-project-ref>
```

### 3. Aplicar migraciones

```bash
supabase db push
```

### 4. Deployar Edge Functions

```bash
supabase functions deploy
```

### 5. Actualizar .env de producción

Usá las credenciales del proyecto de producción en Supabase.