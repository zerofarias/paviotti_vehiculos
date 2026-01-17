import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';

const prisma = new PrismaClient();

/**
 * 🔔 CRON JOB DE ALERTAS AUTOMÁTICAS
 * 
 * Se ejecuta 2 veces al día:
 * - 8:00 AM
 * - 10:00 AM
 * 
 * Verifica y envía alertas sobre:
 * - VTV próximas a vencer o vencidas
 * - Licencias de conducir vencidas
 * - Seguros próximos a vencer
 * - Vehículos que necesitan mantenimiento
 * - Matafuegos vencidos
 * 
 * NUEVO: Envía emails automáticos a contactos registrados
 */

// Configuración de umbrales de alertas (en días)
const ALERT_THRESHOLDS = {
    VTV_CRITICAL: 7,      // 7 días antes
    VTV_WARNING: 30,      // 30 días antes
    INSURANCE_WARNING: 15, // 15 días antes
    LICENSE_CRITICAL: 0,   // Día del vencimiento
};

// Helper para obtener destinatarios de email
async function getNotificationRecipients(): Promise<string[]> {
    const config = await prisma.maintenanceconfig.findFirst();

    // 1. Intentar obtener desde DB (soporta múltiples emails separados por coma)
    const dbEmails = config?.notificationEmails;
    if (dbEmails && dbEmails.trim().length > 0) {
        return dbEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);
    }

    // 2. Fallback a variable de entorno (legacy)
    const envEmail = process.env.NOTIFICATION_EMAIL;
    if (envEmail) return [envEmail];

    return [];
}

async function checkVTVAlerts() {
    console.log('\n🚗 Verificando VTV de vehículos...');

    const now = new Date();
    const criticalDate = new Date(now.getTime() + ALERT_THRESHOLDS.VTV_CRITICAL * 24 * 60 * 60 * 1000);
    const warningDate = new Date(now.getTime() + ALERT_THRESHOLDS.VTV_WARNING * 24 * 60 * 60 * 1000);

    try {
        // Obtener destinatarios
        const recipients = await getNotificationRecipients();
        const config = await prisma.maintenanceconfig.findFirst(); // Para chequear si alerts están enabled

        // VTV vencidas o próximas a vencer
        const vehicles = await prisma.vehicle.findMany({
            where: {
                AND: [
                    { vtvExpiry: { not: null } },
                    { vtvExpiry: { lte: warningDate } }
                ]
            }
        });

        let sentCount = 0;

        for (const vehicle of vehicles) {
            if (!vehicle.vtvExpiry) continue;

            const daysUntilExpiry = Math.floor(
                (new Date(vehicle.vtvExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            const isCritical = daysUntilExpiry <= ALERT_THRESHOLDS.VTV_CRITICAL;
            const isExpired = daysUntilExpiry < 0;

            let message = '';
            let type = '';

            if (isExpired) {
                message = `⚠️ CRÍTICO: VTV del vehículo ${vehicle.plate} VENCIDA hace ${Math.abs(daysUntilExpiry)} días`;
                type = 'vtv_expired';
            } else if (isCritical) {
                message = `🔴 URGENTE: VTV del vehículo ${vehicle.plate} vence en ${daysUntilExpiry} días`;
                type = 'vtv_expiring_critical';
            } else {
                message = `🟡 AVISO: VTV del vehículo ${vehicle.plate} vence en ${daysUntilExpiry} días`;
                type = 'vtv_expiring';
            }

            // Enviar notificación al sistema
            await notificationService.sendNotification({
                type,
                entityType: 'vehicle',
                entityId: vehicle.id,
                message,
                data: {
                    plate: vehicle.plate,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    vtvExpiry: vehicle.vtvExpiry,
                    daysUntilExpiry
                }
            });

            // 📧 Enviar email si hay destinatarios y alertas activas
            if (recipients.length > 0 && config?.enableEmailAlerts !== false) {
                const emailTemplate = emailService.vtvAlertEmail({
                    plate: vehicle.plate,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    vtvExpiry: vehicle.vtvExpiry.toISOString(),
                    daysUntilExpiry,
                    isExpired
                });

                await emailService.sendEmail({
                    to: recipients,
                    subject: emailTemplate.subject,
                    html: emailTemplate.html
                });
            }

            sentCount++;
            console.log(`  ✉️  ${message}`);
        }

        console.log(`✅ VTV: ${sentCount} alertas enviadas`);
    } catch (error) {
        console.error('❌ Error verificando VTV:', error);
    }
}

async function checkLicenseAlerts() {
    console.log('\n🪪 Verificando licencias de conducir...');

    const now = new Date();

    try {
        // Licencias vencidas
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { active: true },
                    { licenseExpiration: { not: null } },
                    { licenseExpiration: { lte: now } }
                ]
            }
        });

        let sentCount = 0;

        for (const user of users) {
            if (!user.licenseExpiration) continue;

            const daysExpired = Math.floor(
                (now.getTime() - new Date(user.licenseExpiration).getTime()) / (1000 * 60 * 60 * 24)
            );

            const message = daysExpired === 0
                ? `🔴 URGENTE: Licencia de ${user.name} vence HOY`
                : `⚠️ CRÍTICO: Licencia de ${user.name} VENCIDA hace ${daysExpired} días`;

            await notificationService.sendNotification({
                type: 'license_expiring',
                entityType: 'user',
                entityId: user.id,
                message,
                data: {
                    userName: user.name,
                    userEmail: user.email,
                    licenseExpiration: user.licenseExpiration,
                    daysExpired
                }
            });

            sentCount++;
            console.log(`  ✉️  ${message}`);
        }

        console.log(`✅ Licencias: ${sentCount} alertas enviadas`);
    } catch (error) {
        console.error('❌ Error verificando licencias:', error);
    }
}

async function checkInsuranceAlerts() {
    console.log('\n🛡️ Verificando seguros de vehículos...');

    const now = new Date();
    const warningDate = new Date(now.getTime() + ALERT_THRESHOLDS.INSURANCE_WARNING * 24 * 60 * 60 * 1000);

    try {
        const vehicles = await prisma.vehicle.findMany({
            where: {
                AND: [
                    { insuranceExpiry: { not: null } },
                    { insuranceExpiry: { lte: warningDate } }
                ]
            }
        });

        let sentCount = 0;

        for (const vehicle of vehicles) {
            if (!vehicle.insuranceExpiry) continue;

            const daysUntilExpiry = Math.floor(
                (new Date(vehicle.insuranceExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            const isExpired = daysUntilExpiry < 0;
            const message = isExpired
                ? `⚠️ CRÍTICO: Seguro del vehículo ${vehicle.plate} VENCIDO hace ${Math.abs(daysUntilExpiry)} días`
                : `🟡 AVISO: Seguro del vehículo ${vehicle.plate} vence en ${daysUntilExpiry} días`;

            await notificationService.sendNotification({
                type: isExpired ? 'insurance_expired' : 'insurance_expiring',
                entityType: 'vehicle',
                entityId: vehicle.id,
                message,
                data: {
                    plate: vehicle.plate,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    insuranceExpiry: vehicle.insuranceExpiry,
                    daysUntilExpiry
                }
            });

            sentCount++;
            console.log(`  ✉️  ${message}`);
        }

        console.log(`✅ Seguros: ${sentCount} alertas enviadas`);
    } catch (error) {
        console.error('❌ Error verificando seguros:', error);
    }
}

async function checkMaintenanceAlerts() {
    console.log('\n🔧 Verificando mantenimientos pendientes...');

    try {
        const config = await prisma.maintenanceconfig.findFirst();

        if (!config) {
            console.log('  ⚠️  No hay configuración de mantenimiento');
            return;
        }

        const vehicles = await prisma.vehicle.findMany();
        let sentCount = 0;

        for (const vehicle of vehicles) {
            // Verificar valores null
            if (vehicle.currentMileage === null || vehicle.lastServiceMileage === null) {
                continue;
            }

            // Verificar por kilometraje
            const kmSinceService = vehicle.currentMileage - vehicle.lastServiceMileage;
            const needsServiceByKm = kmSinceService >= config.serviceKmInterval;

            // Verificar por fecha
            let needsServiceByDate = false;
            let monthsSinceService = 0;

            if (vehicle.lastServiceDate) {
                const lastService = new Date(vehicle.lastServiceDate);
                monthsSinceService = (new Date().getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                needsServiceByDate = monthsSinceService >= config.serviceMonthInterval;
            }

            if (needsServiceByKm || needsServiceByDate) {
                let reason = '';
                if (needsServiceByKm && needsServiceByDate) {
                    reason = `${kmSinceService} km y ${Math.floor(monthsSinceService)} meses desde último service`;
                } else if (needsServiceByKm) {
                    reason = `${kmSinceService} km desde último service (límite: ${config.serviceKmInterval} km)`;
                } else {
                    reason = `${Math.floor(monthsSinceService)} meses desde último service (límite: ${config.serviceMonthInterval} meses)`;
                }

                const message = `🔧 MANTENIMIENTO: Vehículo ${vehicle.plate} necesita service (${reason})`;

                await notificationService.sendNotification({
                    type: 'service_due',
                    entityType: 'vehicle',
                    entityId: vehicle.id,
                    message,
                    data: {
                        plate: vehicle.plate,
                        brand: vehicle.brand,
                        model: vehicle.model,
                        currentMileage: vehicle.currentMileage,
                        lastServiceMileage: vehicle.lastServiceMileage,
                        kmSinceService,
                        monthsSinceService: Math.floor(monthsSinceService),
                        reason
                    }
                });

                sentCount++;
                console.log(`  ✉️  ${message}`);
            }
        }

        console.log(`✅ Mantenimientos: ${sentCount} alertas enviadas`);
    } catch (error) {
        console.error('❌ Error verificando mantenimientos:', error);
    }
}

/**
 * Ejecutar todas las verificaciones
 */
export async function runDailyAlerts() {
    const startTime = new Date();
    console.log('\n' + '='.repeat(60));
    console.log(`🔔 INICIANDO VERIFICACIÓN DE ALERTAS`);
    console.log(`⏰ Hora: ${startTime.toLocaleString('es-AR')}`);
    console.log('='.repeat(60));

    try {
        await checkVTVAlerts();
        await checkLicenseAlerts();
        await checkInsuranceAlerts();
        await checkMaintenanceAlerts();

        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(60));
        console.log(`✅ VERIFICACIÓN COMPLETADA en ${duration}s`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ ERROR en verificación de alertas:', error);
    }
}

/**
 * Configurar cron jobs
 */
export function startAlertCronJobs() {
    console.log('\n🚀 Iniciando cron jobs de alertas...\n');

    // Cron a las 8:00 AM todos los días
    cron.schedule('0 8 * * *', async () => {
        console.log('\n⏰ [CRON] Ejecutando alertas de las 8:00 AM');
        await runDailyAlerts();
    }, {
        timezone: 'America/Argentina/Buenos_Aires'
    });

    // Cron a las 10:00 AM todos los días
    cron.schedule('0 10 * * *', async () => {
        console.log('\n⏰ [CRON] Ejecutando alertas de las 10:00 AM');
        await runDailyAlerts();
    }, {
        timezone: 'America/Argentina/Buenos_Aires'
    });

    console.log('✅ Cron jobs configurados:');
    console.log('   - 8:00 AM todos los días');
    console.log('   - 10:00 AM todos los días');
    console.log('   - Zona horaria: America/Argentina/Buenos_Aires\n');

    // Ejecutar una vez al iniciar (para testing)
    if (process.env.RUN_ALERTS_ON_START === 'true') {
        console.log('🧪 Ejecutando alertas al iniciar servidor (testing)...');
        setTimeout(() => runDailyAlerts(), 5000); // 5 segundos después de iniciar
    }
}
