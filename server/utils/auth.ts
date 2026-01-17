import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'paviotti-fleet-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'paviotti-refresh-secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

/**
 * Hash de contraseña con bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Comparar contraseña con hash
 */
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

/**
 * Generar Access Token (corta duración)
 */
export const generateAccessToken = (userId: string, role: string): string => {
    return jwt.sign(
        { userId, role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
};

/**
 * Generar Refresh Token (larga duración)
 */
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRATION }
    );
};

/**
 * Verificar Access Token
 */
export const verifyAccessToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Verificar Refresh Token
 */
export const verifyRefreshToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};
