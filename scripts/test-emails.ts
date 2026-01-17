/**
 * Script de prueba para emails
 * Ejecuta las alertas manualmente sin esperar al cron
 */

import { runDailyAlerts } from '../server/jobs/notificationCron';

console.log('\n🧪 SCRIPT DE PRUEBA DE EMAILS\n');
console.log('Ejecutando verificación de alertas...\n');

runDailyAlerts()
    .then(() => {
        console.log('\n✅ Script completado. Revisa tu email!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error ejecutando alertas:', error);
        process.exit(1);
    });
