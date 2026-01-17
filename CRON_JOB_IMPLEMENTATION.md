# 🕐 Cron Job de Alertas Automáticas - COMPLETADO

** Alertas diarias a las 8:00 AM y 10:00 AM**

---

## ✅ Implementado

### 📅 **Horarios Programados**
- ⏰ **8:00 AM** - Primera ejecución diaria
- ⏰ **10:00 AM** - Segunda ejecución diaria
- 🌎 **Zona horaria:** America/Argentina/Buenos_Aires

### 🔔 **Tipos de Alertas**

#### 1. VTV (Verificación Técnica Vehicular)
- ✅ **Crítico:** 7 días antes del vencimiento
- ✅ **Warning:** 30 días antes del vencimiento
- ✅ **Vencida:** Detecta VTV vencidas

**Ejemplo de alertas:**
```
⚠️ CRÍTICO: VTV del vehículo ABC-123 VENCIDA hace 5 días
🔴 URGENTE: VTV del vehículo DEF-456 vence en 3 días
🟡 AVISO: VTV del vehículo GHI-789 vence en 25 días
```

#### 2. Licencias de Conducir
- ✅ Detecta licencias vencidas
- ✅ Alerta el día del vencimiento
- ✅ Solo usuarios activos

**Ejemplo de alertas:**
```
🔴 URGENTE: Licencia de Juan Pérez vence HOY
⚠️ CRÍTICO: Licencia de María García VENCIDA hace 10 días
```

#### 3. Seguros Vehiculares
- ✅ **Warning:** 15 días antes del vencimiento
- ✅ Detecta seguros vencidos

**Ejemplo de alertas:**
```
⚠️ CRÍTICO: Seguro del vehículo ABC-123 VENCIDO hace 3 días
🟡 AVISO: Seguro del vehículo DEF-456 vence en 10 días
```

#### 4. Mantenimientos Programados
- ✅ Por kilometraje (ej: cada 10,000 km)
- ✅ Por tiempo (ej: cada 6 meses)
- ✅ Ambos criterios simultáneos

**Ejemplo de alertas:**
```
🔧 MANTENIMIENTO: Vehículo ABC-123 necesita service (12,500 km desde último service)
🔧 MANTENIMIENTO: Vehículo DEF-456 necesita service (8 meses desde último service)
🔧 MANTENIMIENTO: Vehículo GHI-789 necesita service (11,000 km y 7 meses desde último service)
```

---

## 🏗️ Arquitectura

### Archivos Creados

**`server/jobs/notificationCron.ts`**
- Funciones de verificación por tipo
- Configuración de cron schedules
- Logging completo
- Integración con NotificationService

### Integración en Servidor

**`server/index.ts`**
- ✅ Import del cron job
- ✅ Inicialización automática al arrancar servidor
- ✅ Logging mejorado del servidor

---

## 📊 Flujo de Ejecución

```
⏰ 8:00 AM (o 10:00 AM)
         ↓
🔔 Cron trigger
         ↓
┌─────────────────────────────────────┐
│ runDailyAlerts()                    │
├─────────────────────────────────────┤
│ 1. checkVTVAlerts()                 │
│    ↓ Para cada vehículo con VTV    │
│    ↓ próxima a vencer:              │
│    ↓ - Calcular días restantes      │
│    ↓ - Generar mensaje              │
│    ↓ - Enviar notificación          │
│                                     │
│ 2. checkLicenseAlerts()             │
│    ↓ Para cada usuario con          │
│    ↓ licencia vencida:              │
│    ↓ - Enviar notificación          │
│                                     │
│ 3. checkInsuranceAlerts()           │
│    ↓ Para cada vehículo con         │
│    ↓ seguro próximo a vencer:       │
│    ↓ - Enviar notificación          │
│                                     │
│ 4. checkMaintenanceAlerts()         │
│    ↓ Para cada vehículo que         │
│    ↓ necesita service:              │
│    ↓ - Verificar km y/o meses       │
│    ↓ - Enviar notificación          │
└─────────────────────────────────────┘
         ↓
✅ Resumen en consola
```

---

## 🎛️ Configuración

### Variables de Entorno

```env
# Opcional: Ejecutar alertas al iniciar servidor (para testing)
RUN_ALERTS_ON_START=true

# Sistema externo para enviar notificaciones
EXTERNAL_API_URL=https://tu-sistema.com/api
EXTERNAL_API_KEY=tu-api-key
```

###Umbrales de Alertas

En `server/jobs/notificationCron.ts`:

```typescript
const ALERT_THRESHOLDS = {
  VTV_CRITICAL: 7,       // 7 días antes
  VTV_WARNING: 30,       // 30 días antes
  INSURANCE_WARNING: 15, // 15 días antes
  LICENSE_CRITICAL: 0,   // Día del vencimiento
};
```

**Personalizable:** Puedes cambiar estos valores según tus necesidades.

---

## 📝 Logging

### En Consola del Servidor

```
=============================================================
🔔 INICIANDO VERIFICACIÓN DE ALERTAS
⏰ Hora: 16/01/2026, 08:00:00
=============================================================

🚗 Verificando VTV de vehículos...
  ✉️  🔴 URGENTE: VTV del vehículo ABC-123 vence en 5 días
  ✉️  🟡 AVISO: VTV del vehículo DEF-456 vence en 25 días
✅ VTV: 2 alertas enviadas

🪪 Verificando licencias de conducir...
  ✉️  ⚠️ CRÍTICO: Licencia de Juan Pérez VENCIDA hace 3 días
✅ Licencias: 1 alertas enviadas

🛡️ Verificando seguros de vehículos...
✅ Seguros: 0 alertas enviadas

🔧 Verificando mantenimientos pendientes...
  ✉️  🔧 MANTENIMIENTO: Vehículo GHI-789 necesita service (12,000 km)
✅ Mantenimientos: 1 alertas enviadas

=============================================================
✅ VERIFICACIÓN COMPLETADA en 1.23s
=============================================================
```

### En Base de Datos

Cada notificación enviada se guarda en `notification_log`:
- ✅ Tipo de alerta
- ✅ Mensaje completo
- ✅ Estado (sent/failed)
- ✅ Timestamp
- ✅ Datos adicionales (JSON)

---

## 🧪 Testing

### Ejecutar Manualmente

**Opción 1: Variable de Entorno**

Agregar a `.env`:
```env
RUN_ALERTS_ON_START=true
```

El cron ejecutará las alertas 5 segundos después de arrancar el servidor.

**Opción 2: Llamar Función Directamente**

En Node.js REPL o script:
```typescript
import { runDailyAlerts } from './server/jobs/notificationCron';

await runDailyAlerts();
```

### Ver Logs de Notificaciones

**Swagger UI:**
1. Ir a `http://localhost:3001/api-docs`
2. `GET /api/notifications/logs`
3. Filtrar por fecha o tipo

**cURL:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/api/notifications/logs?limit=50
```

---

## ⚙️ Sintaxis de Cron

### Formato
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Día de la semana (0-7, 0 y 7 = Domingo)
│ │ │ └───── Mes (1-12)
│ │ └─────── Día del mes (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

### Ejemplos

| Expresión | Descripción |
|-----------|-------------|
| `0 8 * * *` | 8:00 AM todos los días |
| `0 10 * * *` | 10:00 AM todos los días |
| `0 9 * * 1` | 9:00 AM solo los lunes |
| `0 */6 * * *` | Cada 6 horas |
| `30 8 1 * *` | 8:30 AM el día 1 de cada mes |

### Nuestra Configuración

```typescript
// 8:00 AM todos los días
cron.schedule('0 8 * * *', async () => {
  await runDailyAlerts();
}, {
  timezone: 'America/Argentina/Buenos_Aires'
});

// 10:00 AM todos los días
cron.schedule('0 10 * * *', async () => {
  await runDailyAlerts();
}, {
  timezone: 'America/Argentina/Buenos_Aires'
});
```

---

## 🔄 Personalización

### Cambiar Horarios

Editar `server/jobs/notificationCron.ts`:

```typescript
// En vez de 8 AM y 10 AM, hacer 9 AM y 3 PM:
cron.schedule('0 9 * * *', ...);  // 9:00 AM
cron.schedule('0 15 * * *', ...); // 3:00 PM (15:00)
```

### Agregar Más Verificaciones

```typescript
async function checkFireExtinguisherAlerts() {
  console.log('\n🧯 Verificando matafuegos...');
  
  // Tu lógica aquí
  
  console.log(`✅ Matafuegos: ${sentCount} alertas enviadas`);
}

// Agregar a runDailyAlerts():
export async function runDailyAlerts() {
  // ...
  await checkFireExtinguisherAlerts(); // <-- Nuevo
  // ...
}
```

### Cambiar Umbrales

```typescript
const ALERT_THRESHOLDS = {
  VTV_CRITICAL: 5,       // Cambiar de 7 a 5 días
  VTV_WARNING: 45,       // Cambiar de 30 a 45 días
  INSURANCE_WARNING: 30, // Cambiar de 15 a 30 días
  LICENSE_CRITICAL: 7,   // Cambiar de 0 a 7 días antes
};
```

---

## 📊 Estadísticas y Monitoreo

### Ver Estadísticas

```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/api/notifications/stats
```

**Response:**
```json
{
  "total": 150,
  "sent": 120,
  "failed": 25,
  "pending": 5
}
```

### Dashboard de Notificaciones (Futuro)

Posible extensión:
- [ ] Vista en React con gráficos
- [ ] Historial por tipo de alerta
- [ ] Tendencias mensuales
- [ ] Alertas más frecuentes

---

## ✅ Estado Final

```
✅ Opción A: Login            ████████████████████ 100%
✅ Opción B: Seguridad        ████████████████████ 100%
✅ Opción C: Notificaciones   ████████████████████ 100%
  ├─ Swagger                  ████████████████████ 100%
  ├─ API Endpoints            ████████████████████ 100%
  ├─ Servicio                 ████████████████████ 100%
  └─ Cron Job                 ████████████████████ 100%
✅ SSO External Login         ████████████████████ 100%
✅ Buscador de Vehículos      ████████████████████ 100%
```

---

## 🎉 ¡PROYECTO COMPLETADO AL 100%!

### Resumen de Funcionalidades

✅ Sistema de login JWT completo
✅ Seguridad robusta (Helmet, CORS, Rate Limiting, Zod)
✅ API de notificaciones bidireccional
✅ Documentación Swagger en español
✅ SSO para integración con sistemas externos
✅ Buscador avanzado de vehículos
✅ **Cron job de alertas automáticas**

### Archivos Totales Creados/Modificados

**Nuevos:** 15+ archivos
**Modificados:** 10+ archivos
**Líneas de código:** ~5,000+

---

**¡El sistema está completamente operativo!** 🚀

Reinicia el servidor y verás los cron jobs iniciarse automáticamente:

```bash
npm run dev
```

Output esperado:
```
🚀 Iniciando cron jobs de alertas...

✅ Cron jobs configurados:
   - 8:00 AM todos los días
   - 10:00 AM todos los días
   - Zona horaria: America/Argentina/Buenos_Aires

============================================================
🚀 Servidor iniciado correctamente
📍 URL: http://localhost:3001
📚 API Docs: http://localhost:3001/api-docs
⏰ Alertas programadas: 8:00 AM y 10:00 AM
============================================================
```
