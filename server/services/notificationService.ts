import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface NotificationPayload {
    type: string;
    entityType: string;
    entityId: string;
    message: string;
    data?: any;
}

export class NotificationService {
    private externalApiUrl: string;
    private apiKey: string;
    private webhookSecret: string;

    constructor() {
        this.externalApiUrl = process.env.EXTERNAL_API_URL || '';
        this.apiKey = process.env.EXTERNAL_API_KEY || '';
        this.webhookSecret = process.env.WEBHOOK_SECRET || 'default-webhook-secret-change-me';
    }

    /**
     * Enviar notificación a sistema externo
     */
    async sendNotification(payload: NotificationPayload): Promise<{ success: boolean; logId: string; error?: string }> {
        // Crear log en BD
        const log = await prisma.notification_log.create({
            data: {
                type: payload.type,
                entityType: payload.entityType,
                entityId: payload.entityId,
                message: payload.message,
                sentTo: this.externalApiUrl || 'No configurado',
                status: 'pending'
            }
        });

        // Si no hay URL externa configurada, marcar como enviado y retornar
        if (!this.externalApiUrl) {
            await prisma.notification_log.update({
                where: { id: log.id },
                data: {
                    status: 'sent',
                    response: 'Sin sistema externo configurado. Notificación solo guardada en BD.'
                }
            });

            console.log(`📝 [Notificación] ${payload.type}: ${payload.message}`);
            return { success: true, logId: log.id };
        }

        try {
            // Enviar a API externa
            const response = await axios.post(
                `${this.externalApiUrl}/notifications`,
                {
                    ...payload,
                    timestamp: new Date().toISOString(),
                    source: 'paviotti-fleet'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 segundos timeout
                }
            );

            // Actualizar log como exitoso
            await prisma.notification_log.update({
                where: { id: log.id },
                data: {
                    status: 'sent',
                    response: JSON.stringify({
                        status: response.status,
                        data: response.data
                    })
                }
            });

            console.log(`✅ [Notificación enviada] ${payload.type}: ${payload.message}`);
            return { success: true, logId: log.id };

        } catch (error: any) {
            // Actualizar log como fallido
            const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';

            await prisma.notification_log.update({
                where: { id: log.id },
                data: {
                    status: 'failed',
                    response: JSON.stringify({
                        error: errorMessage,
                        timestamp: new Date().toISOString()
                    }),
                    retryCount: { increment: 1 }
                }
            });

            console.error(`❌ [Error enviando notificación] ${payload.type}:`, errorMessage);
            return {
                success: false,
                error: errorMessage,
                logId: log.id
            };
        }
    }

    /**
     * Webhook para recibir notificaciones del sistema externo
     */
    async handleIncomingWebhook(payload: any, signature: string): Promise<void> {
        // Verificar firma HMAC
        const isValid = this.verifySignature(payload, signature);

        if (!isValid) {
            throw new Error('Firma HMAC inválida. Webhook rechazado por seguridad.');
        }

        // Registrar webhook recibido
        await prisma.notification_log.create({
            data: {
                type: 'webhook_received',
                entityType: payload.entityType || 'external',
                entityId: payload.entityId || payload.id || 'unknown',
                message: payload.message || `Webhook: ${payload.event || 'evento desconocido'}`,
                status: 'received',
                response: JSON.stringify(payload),
                sentTo: 'incoming_webhook'
            }
        });

        console.log(`📥 [Webhook recibido] ${payload.event || 'evento'}:`, payload.message || '');

        // Aquí puedes procesar el webhook según su tipo
        // Por ejemplo: actualizar estado de vehículo, crear registro, etc.
        await this.processWebhookEvent(payload);
    }

    /**
     * Procesar evento de webhook según su tipo
     */
    private async processWebhookEvent(payload: any): Promise<void> {
        const eventType = payload.event || payload.type;

        switch (eventType) {
            case 'repair_completed':
                // Actualizar vehículo con información de reparación
                if (payload.vehicleId) {
                    console.log(`🔧 Procesando reparación completada para vehículo ${payload.vehicleId}`);
                    // Aquí podrías crear un registro de service automáticamente
                }
                break;

            case 'inspection_reminder':
                console.log(`🔔 Recordatorio de inspección recibido`);
                break;

            case 'payment_confirmation':
                console.log(`💰 Confirmación de pago recibida`);
                break;

            default:
                console.log(`ℹ️  Evento de webhook no procesado: ${eventType}`);
        }
    }

    /**
     * Verificar firma HMAC del webhook
     */
    private verifySignature(payload: any, signature: string): boolean {
        try {
            const hmac = crypto.createHmac('sha256', this.webhookSecret);
            hmac.update(JSON.stringify(payload));
            const expectedSignature = hmac.digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            console.error('Error verificando firma HMAC:', error);
            return false;
        }
    }

    /**
     * Reintentar notificaciones fallidas
     */
    async retryFailedNotifications(): Promise<{ retried: number; succeeded: number; failed: number }> {
        // Buscar notificaciones fallidas con menos de 3 reintentos
        const failedNotifications = await prisma.notification_log.findMany({
            where: {
                status: 'failed',
                retryCount: { lt: 3 }
            },
            take: 10 // Reintentar máximo 10 a la vez
        });

        console.log(`🔄 Reintentando ${failedNotifications.length} notificaciones fallidas...`);

        let succeeded = 0;
        let failed = 0;

        for (const notification of failedNotifications) {
            try {
                // Parsear datos originales
                const originalData = {
                    type: notification.type,
                    entityType: notification.entityType,
                    entityId: notification.entityId,
                    message: notification.message
                };

                const result = await this.sendNotification(originalData);

                if (result.success) {
                    succeeded++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(`Error reintentando notificación ${notification.id}:`, error);
                failed++;
            }
        }

        console.log(`✅ Reintentos completados: ${succeeded} exitosos, ${failed} fallidos`);

        return {
            retried: failedNotifications.length,
            succeeded,
            failed
        };
    }

    /**
     * Obtener logs de notificaciones
     */
    async getNotificationLogs(
        limit: number = 100,
        status?: string
    ): Promise<any[]> {
        const where: any = {};

        if (status) {
            where.status = status;
        }

        return await prisma.notification_log.findMany({
            where,
            orderBy: { sentAt: 'desc' },
            take: limit
        });
    }

    /**
     * Obtener estadísticas de notificaciones
     */
    async getNotificationStats(): Promise<{
        total: number;
        sent: number;
        failed: number;
        pending: number;
    }> {
        const [total, sent, failed, pending] = await Promise.all([
            prisma.notification_log.count(),
            prisma.notification_log.count({ where: { status: 'sent' } }),
            prisma.notification_log.count({ where: { status: 'failed' } }),
            prisma.notification_log.count({ where: { status: 'pending' } })
        ]);

        return { total, sent, failed, pending };
    }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();
