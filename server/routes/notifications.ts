import express from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

const router = express.Router();

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Enviar notificación a sistema externo
 *     description: |
 *       Envía una notificación al sistema externo configurado en EXTERNAL_API_URL.
 *       
 *       **Requiere autenticación** y rol de **ADMIN**.
 *       
 *       La notificación se registra en la base de datos y se intenta enviar
 *       al endpoint configurado. Si falla, se marca para reintento automático.
 *       
 *       Si no hay sistema externo configurado, la notificación solo se guarda en BD.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - entityType
 *               - entityId
 *               - message
 *             properties:
 *               type:
 *                 type: string
 *                 enum:
 *                   - vtv_expiring
 *                   - license_expiring
 *                   - service_due
 *                   - insurance_expiring
 *                   - fire_extinguisher_expiring
 *                   - custom
 *                 description: Tipo de notificación
 *                 example: vtv_expiring
 *               entityType:
 *                 type: string
 *                 enum: [vehicle, user]
 *                 description: Tipo de entidad relacionada
 *                 example: vehicle
 *               entityId:
 *                 type: string
 *                 description: ID de la entidad (vehículo o usuario)
 *                 example: vehicle-123
 *               message:
 *                 type: string
 *                 description: Mensaje descriptivo de la alerta
 *                 example: VTV del vehículo ABC-123 vence en 7 días
 *               data:
 *                 type: object
 *                 description: Datos adicionales relacionados con la notificación
 *                 example:
 *                   plate: ABC-123
 *                   vtvExpiry: "2026-01-23"
 *                   daysRemaining: 7
 *           examples:
 *             vtvExpiring:
 *               summary: VTV próxima a vencer
 *               value:
 *                 type: vtv_expiring
 *                 entityType: vehicle
 *                 entityId: vehicle-123
 *                 message: VTV del vehículo ABC-123 vence en 7 días
 *                 data:
 *                   plate: ABC-123
 *                   vtvExpiry: "2026-01-23"
 *                   daysRemaining: 7
 *             licenseExpiring:
 *               summary: Licencia próxima a vencer
 *               value:
 *                 type: license_expiring
 *                 entityType: user
 *                 entityId: user-456
 *                 message: Licencia de Juan Pérez vence en 15 días
 *                 data:
 *                   userName: Juan Pérez
 *                   licenseExpiry: "2026-01-31"
 *                   daysRemaining: 15
 *     responses:
 *       200:
 *         description: Notificación procesada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logId:
 *                   type: string
 *                   description: ID del registro de notificación en BD
 *                   example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al enviar notificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Error de conexión con sistema externo
 *                 logId:
 *                   type: string
 */
router.post('/send', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { type, entityType, entityId, message, data } = req.body;

        // Validación básica
        if (!type || !entityType || !entityId || !message) {
            return res.status(400).json({
                error: 'Campos requeridos: type, entityType, entityId, message'
            });
        }

        const result = await notificationService.sendNotification({
            type,
            entityType,
            entityId,
            message,
            data
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error en endpoint /send:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al enviar notificación'
        });
    }
});

/**
 * @swagger
 * /api/notifications/webhook:
 *   post:
 *     summary: Recibir webhook de sistema externo
 *     description: |
 *       Endpoint para recibir notificaciones desde sistemas externos.
 *       
 *       **Seguridad:** Requiere firma HMAC en el header `X-Signature` para
 *       verificar la autenticidad del webhook y prevenir ataques.
 *       
 *       ### Generación de Firma HMAC
 *       
 *       El sistema externo debe generar la firma de la siguiente manera:
 *       
 *       ```javascript
 *       const crypto = require('crypto');
 *       const payload = JSON.stringify(data);
 *       const signature = crypto
 *         .createHmac('sha256', WEBHOOK_SECRET)
 *         .update(payload)
 *         .digest('hex');
 *       ```
 *       
 *       Luego enviar la firma en el header: `X-Signature: {firma_calculada}`
 *       
 *       El WEBHOOK_SECRET debe ser el mismo configurado en el archivo `.env` del servidor.
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: header
 *         name: X-Signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Firma HMAC-SHA256 del payload (en hexadecimal)
 *         example: a3c5e8f2b4d6c1e9f7b3d5a8c2e6f4b8d1a7c9e3f5b2d8a6c4e1f9b7d3a5c8e2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Tipo de evento
 *                 example: repair_completed
 *               entityType:
 *                 type: string
 *                 example: vehicle
 *               entityId:
 *                 type: string
 *                 example: vehicle-123
 *               message:
 *                 type: string
 *                 example: Reparación completada exitosamente
 *               data:
 *                 type: object
 *                 description: Datos del evento
 *           examples:
 *             repairCompleted:
 *               summary: Reparación completada
 *               value:
 *                 event: repair_completed
 *                 entityType: vehicle
 *                 entityId: vehicle-123
 *                 message: Reparación completada en Taller Oficial
 *                 data:
 *                   cost: 15000
 *                   workshopName: Taller Oficial
 *                   completedAt: "2026-01-16T10:00:00Z"
 *                   description: Cambio de aceite y filtros
 *             inspectionReminder:
 *               summary: Recordatorio de inspección
 *               value:
 *                 event: inspection_reminder
 *                 entityType: vehicle
 *                 entityId: vehicle-456
 *                 message: Recordatorio de inspección técnica
 *                 data:
 *                   dueDate: "2026-01-20"
 *                   type: VTV
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Webhook procesado correctamente
 *       400:
 *         description: Firma inválida o payload incorrecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Firma HMAC inválida. Webhook rechazado por seguridad.
 *       500:
 *         description: Error al procesar webhook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-signature'] as string;

        if (!signature) {
            return res.status(400).json({
                error: 'Header X-Signature requerido para verificar autenticidad'
            });
        }

        await notificationService.handleIncomingWebhook(req.body, signature);

        res.json({
            received: true,
            message: 'Webhook procesado correctamente'
        });
    } catch (error: any) {
        console.error('Error en webhook:', error);
        res.status(400).json({
            error: error.message || 'Error al procesar webhook'
        });
    }
});

/**
 * @swagger
 * /api/notifications/logs:
 *   get:
 *     summary: Obtener logs de notificaciones
 *     description: |
 *       Obtiene el historial de notificaciones enviadas y recibidas.
 *       
 *       **Requiere autenticación** y rol de **ADMIN**.
 *       
 *       Permite filtrar por estado y limitar la cantidad de resultados.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           minimum: 1
 *           maximum: 1000
 *         description: Cantidad máxima de registros a retornar
 *         example: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, failed, pending, received]
 *         description: Filtrar por estado de la notificación
 *         example: failed
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                   type:
 *                     type: string
 *                     example: vtv_expiring
 *                   entityType:
 *                     type: string
 *                     example: vehicle
 *                   entityId:
 *                     type: string
 *                     example: vehicle-123
 *                   message:
 *                     type: string
 *                     example: VTV del vehículo ABC-123 vence en 7 días
 *                   sentAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2026-01-16T09:00:00.000Z
 *                   sentTo:
 *                     type: string
 *                     nullable: true
 *                     example: https://external-api.com/notifications
 *                   status:
 *                     type: string
 *                     enum: [sent, failed, pending, received]
 *                     example: sent
 *                   response:
 *                     type: string
 *                     nullable: true
 *                   retryCount:
 *                     type: integer
 *                     example: 0
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (requiere rol ADMIN)
 */
router.get('/logs', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const status = req.query.status as string;

        const logs = await notificationService.getNotificationLogs(limit, status);

        res.json(logs);
    } catch (error: any) {
        console.error('Error obteniendo logs:', error);
        res.status(500).json({
            error: 'Error al obtener logs de notificaciones'
        });
    }
});

/**
 * @swagger
 * /api/notifications/retry:
 *   post:
 *     summary: Reintentar notificaciones fallidas
 *     description: |
 *       Reintenta el envío de notificaciones que fallaron previamente.
 *       
 *       **Requiere autenticación** y rol de **ADMIN**.
 *       
 *       Solo reintenta notificaciones con menos de 3 intentos previos.
 *       Procesa máximo 10 notificaciones por vez para evitar sobrecarga.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado de los reintentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 retried:
 *                   type: integer
 *                   description: Cantidad de notificaciones reintentadas
 *                   example: 5
 *                 succeeded:
 *                   type: integer
 *                   description: Cantidad de reintentos exitosos
 *                   example: 3
 *                 failed:
 *                   type: integer
 *                   description: Cantidad de reintentos que fallaron
 *                   example: 2
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (requiere rol ADMIN)
 */
router.post('/retry', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const result = await notificationService.retryFailedNotifications();
        res.json(result);
    } catch (error: any) {
        console.error('Error reintentando notificaciones:', error);
        res.status(500).json({
            error: 'Error al reintentar notificaciones'
        });
    }
});

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Obtener estadísticas de notificaciones
 *     description: |
 *       Obtiene estadísticas generales del sistema de notificaciones.
 *       
 *       **Requiere autenticación** y rol de **ADMIN**.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total de notificaciones registradas
 *                   example: 150
 *                 sent:
 *                   type: integer
 *                   description: Notificaciones enviadas exitosamente
 *                   example: 120
 *                 failed:
 *                   type: integer
 *                   description: Notificaciones fallidas
 *                   example: 25
 *                 pending:
 *                   type: integer
 *                   description: Notificaciones pendientes
 *                   example: 5
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (requiere rol ADMIN)
 */
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const stats = await notificationService.getNotificationStats();
        res.json(stats);
    } catch (error: any) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas'
        });
    }
});

export default router;
