# Testing Checklist - Ping App

Este archivo documenta los flujos de testing y su estado actual.

**Leyenda:**
- [ ] No probado
- [x] Probado OK
- [!] Probado con errores (ver notas)

**Última actualización:** 2025-12-07

---

## Maestro E2E Tests

Se configuró Maestro para testing automatizado. Los tests están en `.maestro/flows/`.

**Ejecutar tests:**
```bash
export PATH="$PATH":"$HOME/.maestro/bin"
maestro test .maestro/flows/02_auth_login.yaml
```

**Ver UI en tiempo real:**
```bash
maestro studio
```

---

## 1. AUTENTICACION

### 1.1 Registro de usuario
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [x] | 1 | Abrir la app | Ver pantalla de Login |
| [ ] | 2 | Tocar "Crear cuenta" | Ir a pantalla Register |
| [ ] | 3 | Dejar campos vacíos y tocar "Crear cuenta" | Error de validación |
| [ ] | 4 | Ingresar username con mayúsculas/espacios | Error: solo minúsculas y números |
| [ ] | 5 | Ingresar username < 3 caracteres | Error de validación |
| [ ] | 6 | Ingresar password < 6 caracteres | Error de validación |
| [x] | 7 | Ingresar datos válidos y crear cuenta | Usuario creado, redirige a Home |

**Notas:**
- Registro probado via API y Maestro - funciona correctamente
- Usuario test@example.com creado exitosamente

### 1.2 Login
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [x] | 1 | Abrir la app (sin sesión) | Ver pantalla Login |
| [ ] | 2 | Ingresar credenciales incorrectas | Error "Invalid login credentials" |
| [x] | 3 | Ingresar credenciales correctas | Redirige a Home con saludo |

**Notas:**
- Login probado con Maestro - funciona correctamente
- Muestra "Buenas noches, Test User" en Home

### 1.3 Logout
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Ir a tab Perfil | Ver información del usuario |
| [ ] | 2 | Tocar "Cerrar sesión" | Redirige a Login |
| [ ] | 3 | Reabrir la app | Muestra Login (no hay sesión) |

**Notas:**
-

---

## 2. CONTACTOS

### 2.1 Agregar contacto
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [x] | 1 | Ir a tab Contactos | Ver lista (vacía inicialmente) |
| [ ] | 2 | Tocar "+" | Ir a pantalla Agregar contacto |
| [ ] | 3 | Buscar username que no existe | Error "Usuario no encontrado" |
| [ ] | 4 | Buscar tu propio username | Error "No puedes agregarte a ti mismo" |
| [ ] | 5 | Buscar username válido y agregar | Contacto aparece en lista |
| [ ] | 6 | Intentar agregar mismo contacto | Error "Ya es tu contacto" |

**Prerequisito:** Usuario de prueba creado (ver sección Datos de Prueba)

**Notas:**
- Navegación a Contactos funciona correctamente
- Pantalla muestra "Sin contactos" cuando está vacía

### 2.2 Marcar como confianza
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | En lista de contactos, ver contacto | Toggle "Confianza" visible |
| [ ] | 2 | Activar toggle | Contacto se mueve a "Círculo de confianza" |
| [ ] | 3 | Desactivar toggle | Contacto vuelve a lista normal |

**Notas:**
-

### 2.3 Eliminar contacto
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Mantener presionado un contacto | Aparece alerta de confirmación |
| [ ] | 2 | Cancelar | Contacto permanece |
| [ ] | 3 | Confirmar eliminar | Contacto desaparece de lista |

**Notas:**
-

---

## 3. CREAR ALERTA

### 3.1 Flujo completo (wizard 3 pasos)
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | En Home, tocar "Crear alerta" | Ir a Paso 1 (Destino) |
| [ ] | 2 | Intentar continuar sin ubicación | Botón deshabilitado |
| [ ] | 3 | Tocar "Usar ubicación actual" | Solicita permisos de ubicación |
| [ ] | 4 | Conceder permisos | Muestra coordenadas y nombre "Mi ubicación actual" |
| [ ] | 5 | Continuar a Paso 2 | Ver lista de contactos con checkboxes |
| [ ] | 6 | Intentar continuar sin seleccionar | Error "Selecciona al menos un contacto" |
| [ ] | 7 | Seleccionar 1+ contactos | Botón "Continuar" habilitado |
| [ ] | 8 | Continuar a Paso 3 | Ver opciones de fallback |
| [ ] | 9 | Seleccionar tiempo (ej: 1 hora) | Opción marcada |
| [ ] | 10 | Tocar "Activar" | Alerta creada, volver a Home |
| [ ] | 11 | Ver Home | AlertCard visible con destino y tiempo |

**Notas:**
-

### 3.2 Sin contactos agregados
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Eliminar todos los contactos | Lista vacía |
| [ ] | 2 | Intentar crear alerta | En Paso 2: mensaje "Agrega contactos primero" |

**Notas:**
-

---

## 4. ALERTA ACTIVA

### 4.1 Cancelar alerta
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Con alerta activa en Home | Ver AlertCard |
| [ ] | 2 | Tocar "Cancelar" | Alerta de confirmación |
| [ ] | 3 | Confirmar | Alerta cancelada, card desaparece |

**Notas:**
-

### 4.2 Marcar llegada manual ("Ya llegué")
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [x] | 1 | Con alerta activa en Home | Ver AlertCard con botón "Ya llegué" |
| [x] | 2 | Tocar "Ya llegué" | Loading, luego card desaparece |
| [x] | 3 | Destinatarios reciben push | Notificación "Llegó bien" (requiere dev build) |

**Notas:**
- Push notifications requieren dev build, no funcionan en Expo Go
- Probado 2025-12-07: Flujo completo funciona correctamente
- La alerta se marca como "completed" y los recipients se marcan como "notified"
- Edge Function `process-arrival` funciona correctamente

### 4.3 Ver detalle de alerta
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Tocar en AlertCard | Ir a pantalla detalle `/alert/[id]` |
| [ ] | 2 | Ver pantalla detalle | Badge estado, info destino, destinatarios |

**Notas:**
-

---

## 5. SOLICITUDES

### 5.1 Enviar solicitud
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Ir a tab Solicitudes | Ver lista (vacía o con pendientes) |
| [ ] | 2 | Tocar "+" | Ir a "Enviar solicitud" |
| [ ] | 3 | Intentar enviar sin seleccionar contacto | Error validación |
| [ ] | 4 | Seleccionar contacto | Checkbox marcado |
| [ ] | 5 | Agregar mensaje (opcional) | Texto visible |
| [ ] | 6 | Tocar "Enviar solicitud" | Éxito, volver a lista |

**Notas:**
-

### 5.2 Recibir y aceptar solicitud
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Usuario B recibe solicitud | Push notification (si dev build) |
| [ ] | 2 | Ir a tab Solicitudes | Ver RequestCard con solicitud |
| [ ] | 3 | Tocar "Aceptar" | Loading, solicitud desaparece |
| [ ] | 4 | Ver Home | Alerta activa creada automáticamente |
| [ ] | 5 | Usuario A recibe push | "Solicitud aceptada" |

**Prerequisito:** Dos usuarios, cada uno logueado en distinto dispositivo/simulador

**Notas:**
-

### 5.3 Rechazar solicitud
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Ver solicitud pendiente | RequestCard visible |
| [ ] | 2 | Tocar "Rechazar" | Loading, solicitud desaparece |
| [ ] | 3 | Verificar que no se crea alerta | Home sin cambios |

**Notas:**
-

---

## 6. GEOFENCING

### 6.1 Llegada automática (detectada por geofence)
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Crear alerta con ubicación A | Alerta activa |
| [ ] | 2 | Moverse físicamente a ubicación A | Geofence detecta entrada |
| [ ] | 3 | (Background) | App procesa llegada automáticamente |
| [ ] | 4 | Destinatarios reciben push | "Llegó bien" |
| [ ] | 5 | Abrir app | Alerta completada, card desaparece |

**Nota:** Requiere dispositivo físico y movimiento real. Difícil de probar en simulador.

**Notas:**
-

### 6.2 Actualización de ubicación (background)
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Crear alerta | Alerta activa |
| [ ] | 2 | Esperar 5+ minutos o moverse 100m | Location update task se ejecuta |
| [ ] | 3 | Ver detalle de alerta | "Última ubicación conocida" actualizada |

**Notas:**
-

---

## 7. FALLBACK (timeout)

### 7.1 Alerta vencida sin llegar
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Crear alerta con fallback 30 min | Alerta activa |
| [ ] | 2 | NO llegar al destino | Esperar 30+ minutos |
| [ ] | 3 | Cron job se ejecuta | Status cambia a 'fallback_triggered' |
| [ ] | 4 | Destinatarios reciben push | "No llegó. Última ubicación: [coords]" |

**Nota:** Para probar más rápido, insertar alerta con `fallback_at` en el pasado directamente en DB.

**Notas:**
-

---

## 8. PERFIL

### 8.1 Ver información del usuario
| Estado | Paso | Acción | Resultado esperado |
|--------|------|--------|-------------------|
| [ ] | 1 | Ir a tab Perfil | Ver avatar con inicial |
| [ ] | 2 | Ver datos | Nombre, username, email, fecha registro |
| [ ] | 3 | Ver menú configuración | Items listados (placeholders) |

**Notas:**
- Los items del menú (Notificaciones, Permisos, etc.) no navegan a ningún lado aún

---

## 9. EDGE CASES Y ERRORES

| Estado | Escenario | Resultado esperado |
|--------|-----------|-------------------|
| [ ] | Sin internet al crear alerta | Error de conexión mostrado |
| [ ] | Permisos de ubicación denegados | Mensaje de error, no continúa wizard |
| [ ] | Intentar crear segunda alerta (ya hay una activa) | Solo puede haber 1 activa a la vez |
| [ ] | Sesión expirada (1+ hora sin usar) | Debe renovar token automáticamente |
| [ ] | Usuario eliminado de contactos mientras tiene solicitud | Manejar gracefully |

**Notas:**
-

---

## Datos de Prueba

### Usuarios de prueba creados

| Username | Email | Password | Notas |
|----------|-------|----------|-------|
| testuser | test@example.com | password123 | Usuario principal de testing |
| contacto1 | contacto@test.com | 123456 | Usuario para probar agregar contactos |

### Comandos útiles

```bash
# Crear usuario de prueba adicional
curl -X POST "http://192.168.1.97:54321/auth/v1/signup" \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{"email": "contacto@test.com", "password": "123456", "data": {"username": "contacto1", "full_name": "Mi Contacto"}}'

# Ver usuarios en DB
docker exec supabase_db_ping psql -U postgres -c "SELECT id, username, email FROM auth.users JOIN public.profiles ON auth.users.id = public.profiles.id;"

# Ver alertas activas
docker exec supabase_db_ping psql -U postgres -c "SELECT * FROM public.alerts WHERE status = 'active';"

# Ver solicitudes pendientes
docker exec supabase_db_ping psql -U postgres -c "SELECT * FROM public.requests WHERE status = 'pending';"

# Forzar fallback (modificar fallback_at al pasado)
docker exec supabase_db_ping psql -U postgres -c "UPDATE public.alerts SET fallback_at = NOW() - INTERVAL '1 hour' WHERE status = 'active';"
```

---

## Resumen de Progreso

| Sección | Total | Probados | Pendientes | Con errores |
|---------|-------|----------|------------|-------------|
| 1. Autenticación | 13 | 4 | 9 | 0 |
| 2. Contactos | 11 | 1 | 10 | 0 |
| 3. Crear Alerta | 13 | 0 | 13 | 0 |
| 4. Alerta Activa | 7 | 3 | 4 | 0 |
| 5. Solicitudes | 11 | 0 | 11 | 0 |
| 6. Geofencing | 5 | 0 | 5 | 0 |
| 7. Fallback | 4 | 0 | 4 | 0 |
| 8. Perfil | 3 | 0 | 3 | 0 |
| 9. Edge Cases | 5 | 0 | 5 | 0 |
| **TOTAL** | **72** | **8** | **64** | **0** |

---

## Notas de Testing con Maestro

### Configuración actual
- Maestro CLI v2.0.10 instalado
- Tests en `.maestro/flows/`
- Simulador: iPhone 16 Pro - iOS 18.2

### Tests disponibles
| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `02_auth_login.yaml` | Login con usuario existente | Funciona |
| `03_contacts_add.yaml` | Agregar contacto | En ajuste |
| `04_create_alert.yaml` | Crear alerta completa | Pendiente |
| `05_cancel_alert.yaml` | Cancelar alerta | Pendiente |
| `06_mark_arrived.yaml` | Marcar llegada | Funciona |
| `06b_tap_arrived.yaml` | Marcar llegada (simplificado) | Funciona |
| `07_logout.yaml` | Cerrar sesión | Pendiente |

### Comandos Maestro
```bash
# Exportar PATH (requerido cada sesión)
export PATH="$PATH":"$HOME/.maestro/bin"

# Ejecutar test individual
maestro test .maestro/flows/02_auth_login.yaml

# Modo interactivo (debug)
maestro studio

# Ver jerarquía de elementos
maestro hierarchy
```
