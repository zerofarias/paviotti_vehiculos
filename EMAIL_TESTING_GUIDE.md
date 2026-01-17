# 🧪 Guía Rápida: Probar Envío de Emails

## ⚡ Pasos para Testing

### 1. Verificar tu archivo `.env`

Abre `c:/paviotti-fleet/.env` y asegúrate de tener:

```env
# Habilitar emails
EMAIL_ALERTS_ENABLED=true
NOTIFICATION_EMAIL="tu-email@gmail.com"

# SMTP Gmail
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-app-password-de-16-caracteres"
```

**⚠️ IMPORTANTE:**
- Usa el **App Password** de Gmail (NO tu password normal)
- El App Password es de 16 caracteres sin espacios
- Para generarlo: https://myaccount.google.com/apppasswords

---

### 2. Ejecutar Script de Prueba

Abre una **nueva terminal** (PowerShell) y ejecuta:

```bash
npm run test-emails
```

**Output esperado:**
```
🧪 SCRIPT DE PRUEBA DE EMAILS

Ejecutando verificación de alertas...

============================================================
🔔 INICIANDO VERIFICACIÓN DE ALERTAS
⏰ Hora: 16/01/2026, 22:45:00
============================================================

🚗 Verificando VTV de vehículos...
  ✉️  🔴 URGENTE: VTV del vehículo ABC-123 vence en 5 días
✅ Email enviado a: tu-email@gmail.com
✅ VTV: 1 alertas enviadas

🪪 Verificando licencias de conducir...
✅ Licencias: 0 alertas enviadas

🛡️ Verificando seguros de vehículos...
✅ Seguros: 0 alertas enviadas

🔧 Verificando mantenimientos pendientes...
✅ Mantenimientos: 0 alertas enviadas

============================================================
✅ VERIFICACIÓN COMPLETADA en 1.23s
============================================================

✅ Script completado. Revisa tu email!
```

---

### 3. Revisar tu Email

1. Abre Gmail
2. Revisa tu **inbox**
3. Busca emails con asunto:
   - `⚠️ URGENTE: VTV del vehículo...`
   - `🔴 CRÍTICO: Licencia de conducir...`
   - `🟡 AVISO: Seguro del vehículo...`
   - `🔧 Mantenimiento Requerido:...`

---

## 🔍 Troubleshooting

### Error: "Servicio de email deshabilitado"

**Causa:** `EMAIL_ALERTS_ENABLED` no está en `true`

**Solución:**
```env
EMAIL_ALERTS_ENABLED=true
```

---

### Error: "Invalid login" o "Authentication failed"

**Causa:** Password incorrecto o no es App Password

**Solución:**
1. Ir a https://myaccount.google.com/apppasswords
2. Habilitar "2-Step Verification" si no lo está
3. Crear nuevo "App Password" para "Mail"
4. Copiar el password de 16 caracteres
5. Pegar en `SMTP_PASSWORD` (sin espacios)

---

### Error: "SMTP connection timeout"

**Causa:** Puerto o host incorrectos

**Solución:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
```

---

### No recibo emails (sin errores)

**Posibles causas:**
1. Email en carpeta de SPAM
2. Dirección incorrecta en `NOTIFICATION_EMAIL`
3. No hay alertas para enviar (ningún vehículo con VTV próxima a vencer)

**Solución:**
- Revisar carpeta de SPAM
- Verificar `NOTIFICATION_EMAIL`
- Crear vehículo con VTV próxima a vencer para testing

---

## 🎯 Crear Datos de Prueba

Si no tienes vehículos con alertas, crea uno:

1. Ir a http://localhost:5173
2. Login como admin
3. Ir a "Flota Vehicular"
4. Agregar nuevo vehículo
5. Configurar:
   - **VTV Vencimiento:** Fecha de HOY + 5 días
   - **Seguro:** Fecha de HOY + 10 días

6. Ejecutar: `npm run test-emails`
7. ¡Deberías recibir 2 emails! 📧📧

---

## ✅ Checklist de Configuración

- [ ] `.env` tiene `EMAIL_ALERTS_ENABLED=true`
- [ ] `.env` tiene `NOTIFICATION_EMAIL` con tu email
- [ ] `.env` tiene `SMTP_HOST="smtp.gmail.com"`
- [ ] `.env` tiene `SMTP_PORT="587"`
- [ ] `.env` tiene `SMTP_USER` con tu email Gmail
- [ ] `.env` tiene `SMTP_PASSWORD` con App Password de 16 caracteres
- [ ] Autenticación de 2 pasos habilitada en Gmail
- [ ] App Password generada en Gmail
- [ ] Al menos 1 vehículo con VTV próxima a vencer

---

## 📧 Ejemplo de `.env` Completo

```env
DATABASE_URL="mysql://root:@localhost:3306/paviotti_fleet"

JWT_SECRET="paviotti-fleet-secret-CAMBIAR"
JWT_REFRESH_SECRET="paviotti-refresh-secret-CAMBIAR"
JWT_EXPIRATION="1h"
JWT_REFRESH_EXPIRATION="7d"

SSO_SECRET="sso-secret-CAMBIAR"

PORT=3001
NODE_ENV="development"

FRONTEND_URL="http://localhost:5173"

# 📧 EMAILS
EMAIL_ALERTS_ENABLED=true
NOTIFICATION_EMAIL="gerencia@paviotti.com"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="alertas@paviotti.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"  # App Password de 16 caracteres

# Opcional
EXTERNAL_API_URL=""
EXTERNAL_API_KEY=""
WEBHOOK_SECRET=""
```

---

## 🚀 Próximos Pasos

Una vez que los emails funcionan:

1. ✅ Configurar cron job automático (ya está!)
2. ✅ Los emails se enviarán a las 8 AM y 10 AM
3. ✅ Sin necesidad de ejecutar manualmente

---

**¿Listo para probar?** 🎯

Ejecuta:
```bash
npm run test-emails
```

Y revisa tu inbox! 📬
