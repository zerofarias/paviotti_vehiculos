/**
 * Script de diagnóstico detallado para emails
 */

import dotenv from 'dotenv';

// Cargar variables de entorno PRIMERO
dotenv.config();

// Ahora sí importar el servicio
import { emailService } from '../server/services/emailService';

// Re-inicializar el servicio para que use las variables cargadas
emailService.reinitialize();

console.log('\n🔍 DIAGNÓSTICO DE CONFIGURACIÓN DE EMAILS\n');
console.log('='.repeat(60));

// 1. Verificar variables de entorno
console.log('\n📋 Variables de Entorno:');
console.log('  EMAIL_ALERTS_ENABLED:', process.env.EMAIL_ALERTS_ENABLED);
console.log('  NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL);
console.log('  SMTP_HOST:', process.env.SMTP_HOST);
console.log('  SMTP_PORT:', process.env.SMTP_PORT);
console.log('  SMTP_USER:', process.env.SMTP_USER);
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'NO CONFIGURADO');

// 2. Verificar si está habilitado
const isEnabled = process.env.EMAIL_ALERTS_ENABLED === 'true';
console.log('\n✅ Estado del servicio:', isEnabled ? 'HABILITADO ✓' : 'DESHABILITADO ✗');

if (!isEnabled) {
    console.log('\n⚠️  Para habilitar emails, agrega a tu .env:');
    console.log('   EMAIL_ALERTS_ENABLED=true');
    process.exit(1);
}

// 3. Verificar configuración SMTP
const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'NOTIFICATION_EMAIL'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.log('\n❌ Faltan variables SMTP:');
    missing.forEach(v => console.log(`   - ${v}`));
    process.exit(1);
}

console.log('\n✅ Todas las variables SMTP configuradas');

// 4. Intentar enviar email de prueba
console.log('\n📧 Enviando email de prueba...\n');

const testEmail = emailService.vtvAlertEmail({
    plate: 'TEST-123',
    brand: 'Toyota',
    model: 'Hilux (Prueba)',
    vtvExpiry: new Date().toISOString(),
    daysUntilExpiry: 5,
    isExpired: false
});

console.log('  📝 Asunto:', testEmail.subject);
console.log('  📬 Destinatario:', process.env.NOTIFICATION_EMAIL);
console.log('  📤 Enviando...\n');

emailService.sendEmail({
    to: process.env.NOTIFICATION_EMAIL!,
    subject: testEmail.subject + ' [PRUEBA]',
    html: testEmail.html
})
    .then((result) => {
        if (result) {
            console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE!');
            console.log('\n📬 Revisa tu inbox en:', process.env.NOTIFICATION_EMAIL);
            console.log('   También revisa la carpeta de SPAM si no lo ves.\n');
        } else {
            console.log('\n❌ NO se pudo enviar el email (revisa logs arriba)\n');
        }
        process.exit(result ? 0 : 1);
    })
    .catch((error) => {
        console.error('\n❌ ERROR enviando email:', error.message);
        console.error('\nDetalles del error:', error);
        process.exit(1);
    });
