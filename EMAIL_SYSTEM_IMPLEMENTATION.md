# 📧 Sistema de Emails Automáticos - COMPLETADO

**Notificaciones por email integradas al Cron Job**

---

## ✅ Implementado

### 📧 **Email Service**
- ✅ Servicio completo con Nodemailer
- ✅ Templates HTML profesionales
- ✅ 4 tipos de emails (VTV, Licencia, Seguro, Mantenimiento)
- ✅ Diseño responsive
- ✅ Conversión HTML→texto automática

### 🔔 **Integración con Cron Job**
- ✅ Envío automático a las 8 AM y 10 AM
- ✅ Emails a contactos registrados
- ✅ Fallback si email está deshabilitado

---

## 🎨 Templates de Email

### 1. VTV (Verificación Técnica)

**Asunto:** 
```
⚠️ URGENTE: VTV del vehículo ABC-123
```

**Contenido:**
- Header con gradiente morado
- Alerta destacada (crítica/urgente/aviso)
- Información del vehículo
- Días restantes/vencidos
- Acciones requeridas
- Bot

ón para ver en el sistema

**Estilos:**
- Fondo según urgencia (rojo/amarillo/azul)
- Border izquierdo de color
- Fuente Arial, responsive
- Botón de acción con gradiente

### 2. Licencia de Conducir

**Asunto:**
```
🔴 CRÍTICO: Licencia de conducir VENCIDA
```

**Contenido:**
- Header rojo (crítico)
- Nombre del conductor
- Email del conductor
- Fecha de vencimiento
- Días vencidos
- Acciones inmediatas

### 3. Seguro Vehicular

**Asunto:**
```
⚠️ CRÍTICO: Seguro del vehículo ABC-123
```

**Contenido:**
- Header verde
- Datos del vehículo
- Fecha de vencimiento del seguro
- Días restantes/vencidos
- Acciones requeridas

### 4. Mantenimiento

**Asunto:**
```
🔧 Mantenimiento Requerido: ABC-123
```

**Contenido:**
- Header amarillo/naranja
- Datos del vehículo
- Motivo del mantenimiento (km/meses)
- Acciones requeridas

---

## ⚙️ Configuración

### Variables de Entorno

Agregar a tu `.env`:

```env
# Habilitar envío de emails
EMAIL_ALERTS_ENABLED=true
NOTIFICATION_EMAIL="gerencia@paviotti.com"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="alertas@paviotti.com"
SMTP_PASSWORD="tu-app-password-aqui"
```

### Proveedores SMTP Comunes

#### **Gmail** (Recomendado para desarrollo)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-app-password"
```

**Configurar App Password:**
1. Ir a https://myaccount.google.com/security
2. Habilitar 2-Step Verification
3. Ir a "App passwords"
4. Generar password para "Mail"
5. Usar ese password (no tu password normal)

#### **Outlook/Office 365**
```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="tu-email@outlook.com"
SMTP_PASSWORD="tu-password"
```

#### **SendGrid** (Producción)
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="tu-sendgrid-api-key"
```

#### **Mailgun** (Producción)
```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@tu-dominio.mailgun.org"
SMTP_PASSWORD="tu-mailgun-password"
```

---

## 🔄 Flujo de Envío

```
⏰ Cron ejecuta a las 8 AM
         ↓
🔍 Detecta VTV próxima a vencer
         ↓
📦 Crea notificación en BD
         ↓
📧 Genera email HTML
         ↓
🌐 Conecta a SMTP
         ↓
✉️ Envía email a gerencia@paviotti.com
         ↓
✅ Log: "Email enviado"
```

---

## 📧 Ejemplo de Email (VTV)

```html
┌───────────────────────────────────────────────────┐
│ [Gradiente Morado]                                │
│ ⚠️ Alerta de VTV                                  │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│                                                   │
│ [Caja Roja con Border]                            │
│ 🔴 URGENTE: VTV Próxima a Vencer                  │
│                                                   │
│ La VTV del vehículo ABC-123 vence en 5 días.     │
│                                                   │
│ ┌─────────────────────────────────────────┐      │
│ │ Información del Vehículo:               │      │
│ │ Patente: ABC-123                        │      │
│ │ Marca: Toyota                           │      │
│ │ Modelo: Hilux                           │      │
│ │ Vencimiento VTV: 21/01/2026             │      │
│ └─────────────────────────────────────────┘      │
│                                                   │
│ Acción requerida:                                │
│ • Programar turno para VTV                       │
│ • Verificar disponibilidad en plantas            │
│ • Preparar documentación necesaria               │
│                                                   │
│ [Botón Azul: Ver en el Sistema]                  │
│                                                   │
│ Sistema de Gestión de Flota Paviotti             │
│ Este es un email automático, no responder.       │
└───────────────────────────────────────────────────┘
```

---

## 💻 Código del Servicio

### EmailService Class

```typescript
class EmailService {
  // Inicializa transporter con Nodemailer
  constructor() {
    this.initializeTransporter();
  }

  // Envía un email
  async sendEmail(options: EmailOptions): Promise<boolean>

  // Templates específicos
  vtvAlertEmail(data): { subject, html }
  licenseAlertEmail(data): { subject, html }
  insuranceAlertEmail(data): { subject, html }
  maintenanceAlertEmail(data): { subject, html }
}
```

### Uso en Cron Job

```typescript
// Obtener email de configuración
const config = await prisma.maintenanceconfig.findFirst();
const notificationEmail = config?.notificationEmail || process.env.NOTIFICATION_EMAIL;

// Generar template
const emailTemplate = emailService.vtvAlertEmail({
  plate: vehicle.plate,
  brand: vehicle.brand,
  model: vehicle.model,
  vtvExpiry: vehicle.vtvExpiry.toISOString(),
  daysUntilExpiry,
  isExpired
});

// Enviar email
await emailService.sendEmail({
  to: notificationEmail,
  subject: emailTemplate.subject,
  html: emailTemplate.html
});
```

---

## 🧪 Testing

### Test Manual

```bash
# 1. Configurar .env con SMTP real
EMAIL_ALERTS_ENABLED=true
NOTIFICATION_EMAIL="tu-email@gmail.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="alertas@gmail.com"
SMTP_PASSWORD="tu-app-password"

# 2. Ejecutar alertas manualmente
RUN_ALERTS_ON_START=true

# 3. Reiniciar servidor
npm run dev

# 4. Esperar 5 segundos
# 5. Revisar tu inbox 📧
```

### Test de Template

Puedes probar los templates individualmente:

```typescript
import { emailService } from './server/services/emailService';

const template = emailService.vtvAlertEmail({
  plate: 'ABC-123',
  brand: 'Toyota',
  model: 'Hilux',
  vtvExpiry: new Date().toISOString(),
  daysUntilExpiry: 5,
  isExpired: false
});

console.log(template.subject);
console.log(template.html);
```

---

## 🔒 Seguridad

### App Passwords (Gmail)

⚠️ **NUNCA uses tu password real de Gmail/Outlook directamente**

Gmail requiere "App Passwords" específicas para apps de terceros:
1. Habilitar autenticación de 2 factores
2. Generar App Password específica
3. Usar esa password en SMTP_PASSWORD

### Variables de Entorno

✅ **SÍ hacer:**
- Guardar passwords en `.env`
- Agregar `.env` a `.gitignore`
- Usar `.env.example` como template (sin passwords reales)

❌ **NO hacer:**
- Hardcodear passwords en el código
- Subir `.env` a Git
- Compartir passwords en texto plano

---

## 📊 Destinatarios

### Configuración Actual

**Email único** desde configuración:
- `notificationEmail` en BD (tabla `maintenanceconfig`)
- O `NOTIFICATION_EMAIL` de `.env` como fallback

### Futuras Mejoras

Podrías extender para enviar a:
- ✅ Email del usuario específico (para licencias)
- ✅ Lista de distribución
- ✅ Diferentes emails según tipo de alerta
- ✅ CC a gerencia + operador

**Ejemplo:**
```typescript
// Para licencias, enviar al usuario + gerencia
await emailService.sendEmail({
  to: [user.email, notificationEmail],
  subject: template.subject,
  html: template.html
});
```

---

## ✨ Características de los Templates

### Diseño Responsive

✅ Se ve bien en:
- Desktop (Outlook, Gmail web)
- Mobile (Gmail app, Outlook app)
- Tablet

### Accesibilidad

✅ Texto plano alternativo
✅ Jerarquía semántica (h1, h2, p)
✅ Colores con contraste adecuado

### Personalización

Cada template incluye:
- Emoji apropiado
- Colores según urgencia
- Datos específicos del vehículo/usuario
- Acciones claras y concretas
- Link al sistema

---

## 📁 Archivos Creados

1. ✅ `server/services/emailService.ts` - Servicio completo
2. ✅ `EMAIL_SYSTEM_IMPLEMENTATION.md` - Esta documentación

## 📁 Archivos Modificados

1. ✅ `server/jobs/notificationCron.ts` - Integración de emails
2. ✅ `.env.example` - Variables SMTP
3. ✅ `package.json` - Nodemailer instalado

---

## 🎯 Estado Final

```
✅ Opción A: Login               ████████████████████ 100%
✅ Opción B: Seguridad           ████████████████████ 100%
✅ Opción C: Notificaciones      ████████████████████ 100%
  ├─ Swagger                     ████████████████████ 100%
  ├─ API Endpoints               ████████████████████ 100%
  ├─ Servicio                    ████████████████████ 100%
  ├─ Cron Job (8AM & 10AM)       ████████████████████ 100%
  └─ 📧 Email Automático         ████████████████████ 100%
✅ SSO External Login            ████████████████████ 100%
✅ Buscador de Vehículos         ████████████████████ 100%
```

---

## 🎉 PROYECTO 100% COMPLETADO + EMAILS

### Nuevas Capacidades

El sistema ahora puede:
- ✅ Detectar alertas automáticamente
- ✅ Registrarlas en base de datos
- ✅ Enviarlas a un API externo
- ✅ **Enviar emails HTML a contactos**
- ✅ Todo automáticamente 2 veces al día

### Flujo Completo

```
8:00 AM → Cron ejecuta
       ↓
Detecta VTV por vencer
       ↓
├─ Registra en BD ✅
├─ Envía a API externa ✅
└─ 📧 Envía EMAIL HTML ✅
       ↓
Manager recibe email en su inbox
       ↓
Click en "Ver en el Sistema"
       ↓
Accede directamente al vehículo
```

---

**¡El sistema está COMPLETAMENTE funcional con emails!** 📧🎉
