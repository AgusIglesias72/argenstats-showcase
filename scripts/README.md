# Sistema de Actualización Automática de Datos - ArgenStats

Este directorio contiene todos los scripts y configuraciones necesarias para automatizar la actualización de datos de ArgenStats.

## 📋 Servicios de Actualización Disponibles

| Servicio | Endpoint | Frecuencia Recomendada | Prioridad |
|----------|----------|------------------------|-----------|
| **Dólar** | `/api/internal/update-dollar` | Cada 6 horas | Alta |
| **Riesgo País** | `/api/internal/update-country-risk` | Cada 6 horas | Alta |
| **IPC (Inflación)** | `/api/internal/update-ipc` | Diario | Alta |
| **EMAE** | `/api/internal/update-emae` | Diario | Media |
| **Mercado Laboral** | `/api/internal/update-labor-market` | Semanal | Media |
| **Pobreza** | `/api/internal/update-poverty` | Mensual | Baja |
| **BCRA** | `/api/internal/update-bcra` | Diario | Media |

## 🚀 Opciones de Implementación

### 1. GitHub Actions (Recomendado para Vercel)

**Archivo:** `.github/workflows/data-updates.yml`

**Configuración:**
1. Ve a tu repositorio en GitHub
2. Ve a Settings → Secrets and variables → Actions
3. Agrega los siguientes secrets:
   - `ADMIN_API_KEY`: Tu API key de administración
   - `VERCEL_URL`: URL de tu aplicación (se configura automáticamente en Vercel)

**Horarios:**
- **Crítico (cada 6h):** Dólar, Riesgo País, IPC
- **Diario (6:00 AM UTC):** Todos los indicadores
- **Manual:** Disponible desde la pestaña Actions

### 2. Scripts de Servidor

#### Linux/macOS (Bash)

**Archivo:** `scripts/update-data.sh`

**Configuración:**
```bash
# Hacer ejecutable
chmod +x scripts/update-data.sh

# Configurar variables de entorno
export ADMIN_API_KEY="tu_api_key_aqui"
export VERCEL_URL="https://tu-app.vercel.app"

# Ejecutar manualmente
./scripts/update-data.sh all          # Todos los servicios
./scripts/update-data.sh critical     # Solo críticos
./scripts/update-data.sh daily        # Actualización diaria
./scripts/update-data.sh dollar       # Solo dólar
```

**Cron (Linux/macOS):**
```bash
# Editar crontab
crontab -e

# Agregar las siguientes líneas (ajustar rutas):
0 */6 * * * /path/to/project/scripts/update-data.sh critical
0 6 * * * /path/to/project/scripts/update-data.sh daily
```

#### Windows (PowerShell)

**Archivo:** `scripts/update-data.ps1`

**Configuración:**
```powershell
# Configurar variables de entorno
$env:ADMIN_API_KEY = "tu_api_key_aqui"
$env:VERCEL_URL = "https://tu-app.vercel.app"

# Ejecutar manualmente
.\scripts\update-data.ps1 -UpdateType all
.\scripts\update-data.ps1 -UpdateType critical
.\scripts\update-data.ps1 -UpdateType daily
.\scripts\update-data.ps1 -UpdateType dollar
```

**Windows Task Scheduler:**
1. Abre Task Scheduler
2. Importa el archivo `scripts/windows-scheduler.xml`
3. Modifica las rutas en el archivo XML
4. Configura las variables de entorno en el task

### 3. Endpoint Maestro

**Archivo:** `app/api/internal/update-all/route.ts`

**Uso:**
```bash
curl -X GET \
  -H "x-api-key: tu_api_key" \
  -H "Content-Type: application/json" \
  "https://tu-app.vercel.app/api/internal/update-all"
```

## 📊 Monitoreo y Logs

### Logs de GitHub Actions
- Ve a la pestaña "Actions" en tu repositorio
- Revisa los logs de cada ejecución
- Configura notificaciones de fallos

### Logs de Scripts
- **Linux/macOS:** `/tmp/argenstats-update.log`
- **Windows:** `%TEMP%\argenstats-update.log`

### Base de Datos
Los logs también se guardan en la tabla `cronExecution`:
```sql
SELECT * FROM cronExecution 
WHERE taskName = 'update-all' 
ORDER BY executionTime DESC 
LIMIT 10;
```

## ⚙️ Configuración Avanzada

### Variables de Entorno Requeridas

```bash
# Obligatorias
ADMIN_API_KEY=tu_api_key_de_administracion

# Opcionales
VERCEL_URL=https://tu-app.vercel.app  # Se configura automáticamente en Vercel
NODE_ENV=production
```

### Timeouts por Servicio

| Servicio | Timeout | Razón |
|----------|---------|-------|
| Dólar | 3 min | API externa rápida |
| Riesgo País | 2 min | API externa rápida |
| IPC | 5 min | Procesamiento pesado |
| EMAE | 5 min | Procesamiento pesado |
| Mercado Laboral | 5 min | Procesamiento pesado |
| Pobreza | 5 min | Procesamiento pesado |
| BCRA | 5 min | Múltiples endpoints |

### Manejo de Errores

- **Reintentos:** Los scripts no incluyen reintentos automáticos
- **Notificaciones:** Configura webhooks en GitHub Actions para Slack/Discord
- **Alertas:** Monitorea los logs para detectar fallos

## 🔧 Troubleshooting

### Problemas Comunes

1. **Error 401 Unauthorized**
   - Verifica que `ADMIN_API_KEY` esté configurado correctamente
   - Asegúrate de que la API key tenga permisos de administración

2. **Timeout en servicios**
   - Aumenta el timeout en el script
   - Verifica la conectividad de red
   - Revisa si las APIs externas están funcionando

3. **Error de conexión**
   - Verifica que `VERCEL_URL` esté configurado
   - Asegúrate de que la aplicación esté desplegada y funcionando

4. **Logs vacíos**
   - Verifica permisos de escritura en el directorio de logs
   - Asegúrate de que el script tenga permisos de ejecución

### Comandos de Diagnóstico

```bash
# Probar conectividad
curl -I https://tu-app.vercel.app/api/test-redis

# Probar endpoint de actualización
curl -X GET \
  -H "x-api-key: tu_api_key" \
  "https://tu-app.vercel.app/api/internal/update-dollar"

# Ver logs recientes
tail -f /tmp/argenstats-update.log
```

## 📈 Recomendaciones de Frecuencia

### Para Producción
- **Dólar:** Cada 6 horas (4 veces al día)
- **Riesgo País:** Cada 6 horas (4 veces al día)
- **IPC:** Diario a las 6:00 AM UTC
- **EMAE:** Diario a las 6:00 AM UTC
- **Mercado Laboral:** Semanal (domingos)
- **Pobreza:** Mensual (primer domingo del mes)
- **BCRA:** Diario a las 6:00 AM UTC

### Para Desarrollo
- **Todos:** Manual o cada 12 horas
- **Dólar:** Cada 2 horas para testing

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs de la ejecución
2. Verifica la configuración de variables de entorno
3. Prueba los endpoints manualmente
4. Revisa el estado de las APIs externas
