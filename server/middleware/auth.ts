import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';

// Extender Request para incluir información del usuario autenticado
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

/**
 * Middleware para verificar autenticación
 * Verifica el token JWT en el header Authorization
 */
export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    const decoded = verifyAccessToken(token);

    if (!decoded || typeof decoded === 'string') {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    req.user = decoded as { userId: string; role: string };
    next();
};

/**
 * Middleware para requerir rol de ADMIN
 * Debe usarse DESPUÉS del middleware authenticate
 */
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    }

    next();
};

/**
 * Middleware opcional: permite acceso a usuarios autenticados o sin autenticar
 * Útil para endpoints que tienen funcionalidad diferente según si hay usuario o no
 */
export const optionalAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyAccessToken(token);

        if (decoded && typeof decoded !== 'string') {
            req.user = decoded as { userId: string; role: string };
        }
    }

    next();
};
