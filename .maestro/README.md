# Maestro E2E Tests para Ping

## Requisitos

1. **Maestro CLI instalado**
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   export PATH="$PATH":"$HOME/.maestro/bin"
   ```

2. **Simulador iOS corriendo**
   ```bash
   # Listar simuladores
   xcrun simctl list devices

   # Bootear un simulador
   xcrun simctl boot "iPhone 15"
   ```

3. **App corriendo en el simulador**
   ```bash
   # En otra terminal
   cd /Users/abenve/Documents/Personal/ping
   npx expo start --ios
   ```

4. **Supabase local corriendo**
   ```bash
   supabase start
   ```

5. **Datos de prueba creados**
   ```bash
   # Usuario principal (ya creado)
   # Email: test@example.com / Password: password123

   # Usuario contacto (ya creado)
   # Email: contacto@test.com / Password: 123456 / Username: contacto1
   ```

## Ejecutar tests

### Test individual
```bash
export PATH="$PATH":"$HOME/.maestro/bin"
cd /Users/abenve/Documents/Personal/ping

# Login
maestro test .maestro/flows/02_auth_login.yaml

# Agregar contacto
maestro test .maestro/flows/03_contacts_add.yaml

# Crear alerta
maestro test .maestro/flows/04_create_alert.yaml
```

### Suite completa
```bash
maestro test .maestro/flows/00_full_suite.yaml
```

### Modo interactivo (debug)
```bash
maestro studio
```
Abre una UI donde podés ver la jerarquía de elementos y probar comandos.

## Estructura de tests

| Archivo | Descripción | Prerequisitos |
|---------|-------------|---------------|
| `01_auth_register.yaml` | Registro nuevo usuario | DB limpia |
| `02_auth_login.yaml` | Login usuario existente | Usuario `test@example.com` existe |
| `03_contacts_add.yaml` | Agregar contacto | Logueado, usuario `contacto1` existe |
| `04_create_alert.yaml` | Crear alerta completa | Logueado, 1+ contacto |
| `05_cancel_alert.yaml` | Cancelar alerta | Alerta activa |
| `06_mark_arrived.yaml` | Marcar llegada | Alerta activa |
| `07_logout.yaml` | Cerrar sesión | Logueado |
| `00_full_suite.yaml` | Todos los tests | Todo configurado |

## Troubleshooting

### "No devices found"
```bash
# Verificar que el simulador está corriendo
xcrun simctl list devices | grep Booted
```

### "App not found"
Maestro busca `host.exp.Exponent` (Expo Go). Si usás dev build:
1. Editar `.maestro/config.yaml`
2. Cambiar `appId` por tu bundle ID

### Tests fallan por timing
Aumentar timeouts en los `extendedWaitUntil`:
```yaml
- extendedWaitUntil:
    visible: "texto"
    timeout: 15000  # 15 segundos
```

### Ver elementos en pantalla
```bash
maestro hierarchy
```

## Screenshots

Los screenshots se guardan en el directorio actual con el nombre especificado en cada test.
