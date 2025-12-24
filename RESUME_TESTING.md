# Reanudar Testing de Ping

## Estado actual del testing

### Completado:
- [x] Configurar segundo simulador (iPhone SE 3rd gen)
- [x] Login Usuario B (juan) en segundo simulador
- [x] Usuario A (testuser) agrega a Usuario B como contacto

### Pendiente:
- [ ] Usuario A crea alerta (bloqueado por error de ubicación - ya arreglado)
- [ ] Usuario A marca llegada ("Ya llegué")
- [ ] Verificar notificación push en Usuario B

## Comandos para reanudar

### 1. Levantar Supabase (si no está corriendo)
```bash
cd /Users/abenve/Documents/Personal/ping
supabase start
```

### 2. Abrir ambos simuladores
```bash
# iPhone 16 Pro (Usuario A - testuser)
xcrun simctl boot "1456A002-C134-467B-B860-84D902615BD4" 2>/dev/null || true
open -a Simulator --args -CurrentDeviceUDID 1456A002-C134-467B-B860-84D902615BD4

# iPhone SE 3rd gen (Usuario B - juan)
xcrun simctl boot "C469C768-3074-4FE2-9A74-4F96FD99FF98" 2>/dev/null || true
open -a Simulator --args -CurrentDeviceUDID C469C768-3074-4FE2-9A74-4F96FD99FF98
```

### 3. Levantar Expo
```bash
cd /Users/abenve/Documents/Personal/ping
npx expo start
```

### 4. Abrir Expo Go en ambos simuladores
- Presionar `i` en la terminal de Expo para abrir en iOS
- O escanear el QR code desde la app Expo Go en cada simulador

### 5. Setear ubicación simulada (opcional)
```bash
# San Francisco
xcrun simctl location 1456A002-C134-467B-B860-84D902615BD4 set 37.7749,-122.4194
xcrun simctl location C469C768-3074-4FE2-9A74-4F96FD99FF98 set 37.7749,-122.4194
```

## Credenciales de prueba

| Simulador | Usuario | Email | Password |
|-----------|---------|-------|----------|
| iPhone 16 Pro | testuser | testuser@example.com | password123 |
| iPhone SE | juan | juan@example.com | password123 |

## Último fix aplicado

Se modificó `src/hooks/useGeofencing.ts` para manejar mejor la ubicación en simuladores:
- Usa precisión "Balanced" en vez de "High"
- Fallback a última ubicación conocida
- En modo dev, usa coordenadas de San Francisco si todo falla

## Próximo paso

1. Recargar la app en iPhone 16 Pro (Cmd+R)
2. Ir a Home → "+ Crear alerta"
3. Tocar "Usar ubicación actual" 
4. Debería funcionar ahora con el fallback

## IDs de simuladores

- iPhone 16 Pro: `1456A002-C134-467B-B860-84D902615BD4`
- iPhone SE (3rd gen): `C469C768-3074-4FE2-9A74-4F96FD99FF98`
