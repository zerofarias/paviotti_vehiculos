# 🔐 Plan de Implementación: Login + API de Notificaciones

**Proyecto:** Paviotti Fleet Management
**Fecha:** 16/01/2026
**Estimación Total:** 6-8 horas

---

## 📋 Fase 1: Sistema de Autenticación (4-5 horas)

### 1.1 Instalación de Dependencias (15 min)
```bash
# Backend
npm install jsonwebtoken bcryptjs express-validator
npm install -D @types/jsonwebtoken @types/bcryptjs

# Variables de entorno
```

**Archivo `.env.example`:**
```env
DATABASE_URL="mysql://user:password@localhost:3306/paviotti_fleet"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_EXPIRATION="1h"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

---

### 1.2 Backend - Utilidades de Auth (30 min)

**Archivo: `server/utils/auth.ts`**
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRATION || '1h' }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};
```

---

### 1.3 Backend - Middleware de Autenticación (30 min)

**Archivo: `server/middleware/auth.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyAccessToken(token);

  if (!decoded || typeof decoded === 'string') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded as { userId: string; role: string };
  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

---

### 1.4 Backend - Endpoints de Auth (1 hora)

**Archivo: `server/routes/auth.ts`**
```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken
} from '../utils/auth';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Password requerido')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Buscar usuario
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar si está activo
      if (!user.active) {
        return res.status(403).json({ error: 'Usuario desactivado' });
      }

      // Verificar contraseña
      const isValidPassword = await comparePassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar tokens
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Retornar datos sin contraseña
      const { password: _, ...userData } = user;

      res.json({
        user: userData,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
);

// POST /api/auth/register (solo ADMIN puede crear usuarios)
router.post(
  '/register',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['ADMIN', 'EMPLOYEE'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      // Verificar si el email ya existe
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email ya registrado' });
      }

      // Hash de contraseña
      const hashedPassword = await hashPassword(password);

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          name,
          email,
          password: hashedPassword,
          role,
          active: true
        }
      });

      const { password: _, ...userData } = newUser;
      res.status(201).json(userData);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
);

// GET /api/auth/me (obtener usuario actual)
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
```

---

### 1.5 Frontend - Context de Autenticación (1 hora)

**Archivo: `src/contexts/AuthContext.tsx`**
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (token && refreshToken) {
      // Verificar token y obtener usuario
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAccessToken(token);
      } else {
        // Token inválido, limpiar
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data = await response.json();
    
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### 1.6 Frontend - Página de Login (1 hora)

**Archivo: `src/pages/Login.tsx`**
```typescript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
              Paviotti Fleet
            </h1>
            <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest">
              Sistema de Gestión
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors font-bold"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors font-bold"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-red-600 font-bold text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

---

## 📋 Fase 2: API de Notificaciones (2-3 horas)

### 2.1 Schema de Base de Datos (20 min)

**Actualizar `prisma/schema.prisma`:**
```prisma
model notification_log {
  id          String   @id @default(uuid())
  type        String   // 'vtv_expiring', 'license_expiring', 'service_due', etc.
  entityType  String   // 'vehicle', 'user'
  entityId    String
  message     String   @db.Text
  sentAt      DateTime @default(now())
  sentTo      String?  // URL del sistema externo
  status      String   // 'pending', 'sent', 'failed'
  response    String?  @db.Text
  retryCount  Int      @default(0)
}
```

---

### 2.2 Backend - Servicio de Notificaciones (1 hora)

**Archivo: `server/services/notificationService.ts`**
```typescript
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationPayload {
  type: string;
  entityType: string;
  entityId: string;
  message: string;
  data: any;
}

export class NotificationService {
  private externalApiUrl: string;
  private apiKey: string;

  constructor() {
    this.externalApiUrl = process.env.EXTERNAL_API_URL || '';
    this.apiKey = process.env.EXTERNAL_API_KEY || '';
  }

  async sendNotification(payload: NotificationPayload) {
    // Crear log
    const log = await prisma.notification_log.create({
      data: {
        type: payload.type,
        entityType: payload.entityType,
        entityId: payload.entityId,
        message: payload.message,
        sentTo: this.externalApiUrl,
        status: 'pending'
      }
    });

    try {
      // Enviar a API externa
      const response = await axios.post(
        `${this.externalApiUrl}/notifications`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // Actualizar log como exitoso
      await prisma.notification_log.update({
        where: { id: log.id },
        data: {
          status: 'sent',
          response: JSON.stringify(response.data)
        }
      });

      return { success: true, logId: log.id };
    } catch (error: any) {
      // Actualizar log como fallido
      await prisma.notification_log.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          response: error.message,
          retryCount: { increment: 1 }
        }
      });

      return { success: false, error: error.message, logId: log.id };
    }
  }

  // Webhook para recibir notificaciones del sistema externo
  async handleIncomingWebhook(payload: any, signature: string) {
    // Verificar firma HMAC
    const isValid = this.verifySignature(payload, signature);
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Procesar notificación
    await prisma.notification_log.create({
      data: {
        type: 'webhook_received',
        entityType: 'external',
        entityId: payload.id || 'unknown',
        message: payload.message || '',
        status: 'received',
        response: JSON.stringify(payload)
      }
    });

    // Aquí puedes procesar la notificación según su tipo
    // Por ejemplo: crear alertas en el sistema, actualizar estados, etc.
  }

  private verifySignature(payload: any, signature: string): boolean {
    // Implementar verificación HMAC
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET || '');
    hmac.update(JSON.stringify(payload));
    const expectedSignature = hmac.digest('hex');
    
    return signature === expectedSignature;
  }
}

export const notificationService = new NotificationService();
```

---

### 2.3 Backend - Endpoints de Notificaciones (40 min)

**Archivo: `server/routes/notifications.ts`**
```typescript
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// POST /api/notifications/send - Enviar notificación
router.post('/send', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await notificationService.sendNotification(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/webhook - Recibir webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature'] as string;
    await notificationService.handleIncomingWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/notifications/logs - Ver logs de notificaciones
router.get('/logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.notification_log.findMany({
      orderBy: { sentAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

### 2.4 Cron Job para Alertas Automáticas (40 min)

**Archivo: `server/jobs/notificationCron.ts`**
```typescript
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/notificationService';

const prisma = new PrismaClient();

// Ejecutar diariamente a las 9:00 AM
export const startNotificationCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily notification check...');

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check VTV expiring
    const vehiclesWithExpiringVtv = await prisma.vehicle.findMany({
      where: {
        vtvExpiry: {
          lte: in30Days
        }
      }
    });

    for (const vehicle of vehiclesWithExpiringVtv) {
      await notificationService.sendNotification({
        type: 'vtv_expiring',
        entityType: 'vehicle',
        entityId: vehicle.id,
        message: `VTV del vehículo ${vehicle.plate} vence el ${vehicle.vtvExpiry?.toLocaleDateString()}`,
        data: vehicle
      });
    }

    // Check licenses expiring
    const usersWithExpiringLicense = await prisma.user.findMany({
      where: {
        licenseExpiration: {
          lte: in30Days
        }
      }
    });

    for (const user of usersWithExpiringLicense) {
      await notificationService.sendNotification({
        type: 'license_expiring',
        entityType: 'user',
        entityId: user.id,
        message: `Licencia de ${user.name} vence el ${user.licenseExpiration?.toLocaleDateString()}`,
        data: user
      });
    }
  });
};
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Instalar dependencias (bcryptjs, jsonwebtoken, express-validator)
- [ ] Crear `server/utils/auth.ts`
- [ ] Crear `server/middleware/auth.ts`
- [ ] Crear `server/routes/auth.ts`
- [ ] Crear `server/routes/notifications.ts`
- [ ] Crear `server/services/notificationService.ts`
- [ ] Crear `server/jobs/notificationCron.ts`
- [ ] Actualizar schema de Prisma
- [ ] Migrar contraseñas existentes a hash
- [ ] Proteger rutas con middleware
- [ ] Configurar variables de entorno

### Frontend
- [ ] Crear `src/contexts/AuthContext.tsx`
- [ ] Crear `src/pages/Login.tsx`
- [ ] Actualizar `src/App.tsx` para usar AuthProvider
- [ ] Agregar ProtectedRoute component
- [ ] Actualizar fetch calls para incluir token
- [ ] Manejar errores 401/403
- [ ] Implementar logout
- [ ] Persistir sesión en localStorage

### Testing
- [ ] Probar login con credenciales correctas
- [ ] Probar login con credenciales incorrectas
- [ ] Verificar que rutas protegidas requieran autenticación
- [ ] Probar refresh de token
- [ ] Probar envío de notificaciones
- [ ] Probar webhook entrante

---

**¿Listo para empezar?** Podemos implementar esto en orden, comenzando por el sistema de autenticación.
