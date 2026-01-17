import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from '../utils/auth';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Iniciar sesión con email y contraseña
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('password').notEmpty().withMessage('Contraseña requerida')
    ],
    async (req: express.Request, res: express.Response) => {
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Buscar usuario por email
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Verificar si el usuario está activo
            if (!user.active) {
                return res.status(403).json({ error: 'Usuario desactivado. Contacte al administrador' });
            }

            // Verificar contraseña
            const isValidPassword = await comparePassword(password, user.password || '');

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Generar tokens
            const accessToken = generateAccessToken(user.id, user.role || 'EMPLOYEE');
            const refreshToken = generateRefreshToken(user.id);

            // Retornar datos del usuario sin la contraseña
            const { password: _, ...userData } = user;

            res.json({
                user: userData,
                accessToken,
                refreshToken,
                message: 'Inicio de sesión exitoso'
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    }
);

/**
 * POST /api/auth/register
 * Crear nuevo usuario (solo ADMIN)
 */
router.post(
    '/register',
    authenticate,
    requireAdmin,
    [
        body('name').notEmpty().withMessage('Nombre requerido'),
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
        body('role').isIn(['ADMIN', 'EMPLOYEE']).withMessage('Rol inválido')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role } = req.body;

        try {
            // Verificar si el email ya existe
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            // Hash de la contraseña
            const hashedPassword = await hashPassword(password);

            // Crear usuario
            const newUser = await prisma.user.create({
                data: {
                    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    active: true
                }
            });

            // Retornar sin contraseña
            const { password: _, ...userData } = newUser;
            res.status(201).json({
                user: userData,
                message: 'Usuario creado exitosamente'
            });
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    }
);

/**
 * GET /api/auth/me
 * Obtener información del usuario actual
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Retornar sin contraseña
        const { password, ...userData } = user;
        res.json(userData);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/**
 * POST /api/auth/refresh
 * Refrescar access token usando refresh token
 */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token requerido' });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded || typeof decoded === 'string') {
            return res.status(401).json({ error: 'Refresh token inválido o expirado' });
        }

        // Verificar que el usuario existe y está activo
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user || !user.active) {
            return res.status(401).json({ error: 'Usuario no encontrado o desactivado' });
        }

        // Generar nuevo access token
        const newAccessToken = generateAccessToken(user.id, user.role);

        res.json({
            accessToken: newAccessToken,
            message: 'Token refrescado exitosamente'
        });
    } catch (error) {
        console.error('Error refrescando token:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario actual
 */
router.post(
    '/change-password',
    authenticate,
    [
        body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
        body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.userId }
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Verificar contraseña actual
            const isValid = await comparePassword(currentPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Contraseña actual incorrecta' });
            }

            // Hash la nueva contraseña
            const hashedPassword = await hashPassword(newPassword);

            // Actualizar contraseña
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            res.json({ message: 'Contraseña actualizada exitosamente' });
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    }
);

/**
 * @swagger
 * /api/auth/external-login:
 *   post:
 *     summary: Auto-login desde sistema externo (SSO)
 *     description: |
 *       Endpoint especial para autenticación delegada desde sistemas externos.
 *       
 *       **Caso de uso:** Cuando un usuario ya está autenticado en otro sistema
 *       (ej: ERP, CRM, sistema principal) y desea acceder al sistema de flota
 *       sin tener que hacer login nuevamente.
 *       
 *       ### 🔐 Seguridad HMAC
 *       
 *       Para evitar ataques man-in-the-middle, este endpoint requiere una
 *       firma HMAC que solo el sistema externo autorizado puede generar.
 *       
 *       ### 📝 Cómo implementar en el sistema externo
 *       
 *       ```javascript
 *       // 1. El usuario hace login en el sistema externo
 *       // 2. El sistema externo prepara los datos
 *       const crypto = require('crypto');
 *       const SSO_SECRET = 'secret-compartido-entre-sistemas';
 *       
 *       const payload = {
 *         email: 'usuario@paviotti.com',
 *         timestamp: Date.now()
 *       };
 *       
 *       // 3. Generar firma HMAC
 *       const signature = crypto
 *         .createHmac('sha256', SSO_SECRET)
 *         .update(JSON.stringify(payload))
 *         .digest('hex');
 *       
 *       // 4. Enviar request
 *       const response = await fetch('http://fleet.paviotti.com/api/auth/external-login', {
 *         method: 'POST',
 *         headers: {
 *           'Content-Type': 'application/json',
 *           'X-SSO-Signature': signature
 *         },
 *         body: JSON.stringify(payload)
 *       });
 *       
 *       const { accessToken, refreshToken, user } = await response.json();
 *       
 *       // 5. Redirigir al usuario con el token
 *       window.location.href = `http://fleet.paviotti.com?token=${accessToken}`;
 *       ```
 *       
 *       ### 🎯 Flujo completo
 *       
 *       1. Usuario hace login en Sistema A
 *       2. Sistema A genera firma HMAC
 *       3. Sistema A hace POST a este endpoint
 *       4. Este sistema valida firma y credenciales
 *       5. Retorna tokens JWT
 *       6. Sistema A redirige con token
 *       7. Usuario accede automáticamente sin segundo login
 *       
 *     tags: [Autenticación]
 *     parameters:
 *       - in: header
 *         name: X-SSO-Signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Firma HMAC-SHA256 del payload usando SSO_SECRET compartido
 *         example: a3c5e8f2b4d6c1e9f7b3d5a8c2e6f4b8d1a7c9e3f5b2d8a6c4e1f9b7d3a5c8e2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - timestamp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario ya autenticado en el sistema externo
 *                 example: usuario@paviotti.com
 *               timestamp:
 *                 type: number
 *                 description: Timestamp de cuando se generó la request (para prevenir replay attacks)
 *                 example: 1642345678901
 *               systemId:
 *                 type: string
 *                 description: ID del sistema que origina la request (opcional, para logging)
 *                 example: erp-paviotti
 *           example:
 *             email: usuario@paviotti.com
 *             timestamp: 1642345678901
 *             systemId: erp-paviotti
 *     responses:
 *       200:
 *         description: Auto-login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   description: Token JWT de acceso (válido 1 hora)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: Token JWT de refresco (válido 7 días)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 message:
 *                   type: string
 *                   example: Auto-login exitoso desde sistema externo
 *       400:
 *         description: Request inválido (falta firma o timestamp expirado)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noSignature:
 *                 value:
 *                   error: Header X-SSO-Signature requerido para autenticación delegada
 *               expiredTimestamp:
 *                 value:
 *                   error: Request expirado. El timestamp debe ser menor a 5 minutos.
 *       401:
 *         description: Firma inválida o usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidSignature:
 *                 value:
 *                   error: Firma HMAC inválida. Sistema no autorizado.
 *               userNotFound:
 *                 value:
 *                   error: Usuario no encontrado en el sistema
 *       403:
 *         description: Usuario desactivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Usuario desactivado. Contacte al administrador
 */
router.post('/external-login', async (req, res) => {
    try {
        const signature = req.headers['x-sso-signature'] as string;
        const { email, timestamp, systemId } = req.body;

        // Validar signature
        if (!signature) {
            return res.status(400).json({
                error: 'Header X-SSO-Signature requerido para autenticación delegada'
            });
        }

        // Validar payload
        if (!email || !timestamp) {
            return res.status(400).json({
                error: 'Email y timestamp son requeridos'
            });
        }

        // Verificar que el timestamp no sea muy antiguo (prevenir replay attacks)
        const now = Date.now();
        const requestAge = now - timestamp;
        const MAX_AGE = 5 * 60 * 1000; // 5 minutos

        if (requestAge > MAX_AGE) {
            return res.status(400).json({
                error: 'Request expirado. El timestamp debe ser menor a 5 minutos.'
            });
        }

        // Verificar firma HMAC
        const crypto = require('crypto');
        const SSO_SECRET = process.env.SSO_SECRET || 'default-sso-secret-change-me';

        const hmac = crypto.createHmac('sha256', SSO_SECRET);
        hmac.update(JSON.stringify({ email, timestamp }));
        const expectedSignature = hmac.digest('hex');

        if (signature !== expectedSignature) {
            console.error(`❌ [SSO] Firma inválida para ${email} desde ${systemId || 'unknown'}`);
            return res.status(401).json({
                error: 'Firma HMAC inválida. Sistema no autorizado.'
            });
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Usuario no encontrado en el sistema'
            });
        }

        // Verificar si está activo
        if (!user.active) {
            return res.status(403).json({
                error: 'Usuario desactivado. Contacte al administrador'
            });
        }

        // Generar tokens
        const accessToken = generateAccessToken(user.id, user.role || 'EMPLOYEE');
        const refreshToken = generateRefreshToken(user.id);

        // Log exitoso
        console.log(`✅ [SSO] Auto-login exitoso: ${email} desde ${systemId || 'sistema externo'}`);

        // Retornar datos sin contraseña
        const { password: _, ...userData } = user;

        res.json({
            user: userData,
            accessToken,
            refreshToken,
            message: 'Auto-login exitoso desde sistema externo'
        });

    } catch (error) {
        console.error('Error en external-login:', error);
        res.status(500).json({
            error: 'Error en el servidor durante auto-login'
        });
    }
});

export default router;
