# 🔍 Análisis de Seguridad y Puntos Críticos - Paviotti Fleet Management

**Fecha:** 16/01/2026
**Versión Analizada:** v1.0
**Analista:** Antigravity AI

---

## 🚨 CRÍTICO - Alta Prioridad

### 1. **Seguridad - Contraseñas en Texto Plano** ⚠️⚠️⚠️
**Ubicación:** `server/index.ts` - Líneas 33-53, 56-77
**Problema:** Las contraseñas se almacenan en texto plano en la base de datos.
```typescript
// ACTUAL (INSEGURO):
password: req.body.password, // ❌ Texto plano

// DEBE SER:
password: await bcrypt.hash(req.body.password, 10), // ✅ Hash
```
**Impacto:** Compromiso total de cuentas si hay breach de BD.
**Solución:** 
- Instalar `bcryptjs`: `npm install bcryptjs @types/bcryptjs`
- Hashear contraseñas antes de guardar
- Implementar función de comparación para login

---

### 2. **Autenticación - No Existe Sistema de Login** ⚠️⚠️⚠️
**Ubicación:** Todo el sistema
**Problema:** No hay protección de rutas ni verificación de sesión.
- Cualquiera puede acceder a `http://localhost:5173`
- No hay JWT ni sessions
- El `currentUser` se selecciona sin validación

**Solución Recomendada:**
- Implementar JWT (JSON Web Tokens)
- Crear endpoint `/api/auth/login`
- Middleware de autenticación en rutas protegidas
- Refresh tokens para sesiones persistentes

---

### 3. **Autorización - Falta Control de Permisos** ⚠️⚠️
**Ubicación:** Backend `server/index.ts`
**Problema:** No hay validación de roles en endpoints críticos.
```typescript
// Cualquier usuario puede eliminar vehículos:
app.delete('/api/vehicles/:id', async (req, res) => {
  // ❌ No verifica si el usuario es ADMIN
  await prisma.vehicle.delete({ where: { id } });
});
```
**Impacto:** Staff EMPLOYEE puede realizar acciones de ADMIN.
**Solución:** Middleware de autorización por rol.

---

### 4. **SQL Injection - Riesgo Bajo pero Presente** ⚠️
**Ubicación:** `server/index.ts` - JSON parsing
**Problema:** Aunque Prisma protege contra SQL injection, hay JSON.parse sin validación.
```typescript
// Línea 96-103:
const safeParseJSON = (jsonString: string | null, fallback: any = []) => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString); // ❌ Sin validación de contenido
  } catch (e) {
    return fallback;
  }
};
```
**Solución:** Validar estructura con Zod o Yup antes de parsear.

---

## ⚠️ ALTO - Requiere Atención

### 5. **CORS Abierto a Todos** ⚠️⚠️
**Ubicación:** `server/index.ts` - Línea 10
```typescript
app.use(cors()); // ❌ Permite CUALQUIER origen
```
**Problema:** Cualquier sitio web puede hacer requests a tu API.
**Solución:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

### 6. **Rate Limiting - No Existe** ⚠️⚠️
**Problema:** No hay protección contra fuerza bruta o DDoS.
**Solución:** Implementar `express-rate-limit`
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de requests
});
app.use('/api/', limiter);
```

---

### 7. **Validación de Entrada - Insuficiente** ⚠️⚠️
**Ubicación:** Todos los endpoints POST/PUT
**Problema:** No se validan tipos ni formatos de datos entrantes.
```typescript
// Ejemplo: POST /api/vehicles
// ❌ No valida que 'year' sea número, 'email' sea válido, etc.
```
**Solución:** Usar Zod para validación de esquemas:
```typescript
import { z } from 'zod';

const VehicleSchema = z.object({
  plate: z.string().min(6).max(10),
  year: z.number().min(1900).max(2100),
  currentMileage: z.number().min(0),
  // ...
});
```

---

### 8. **Manejo de Errores - Expone Información Sensible** ⚠️
**Ubicación:** Múltiples catch blocks
```typescript
catch (error) {
  console.error('Error fetching users:', error); // ❌ Log en producción
  res.status(500).json({ error: 'Failed to fetch users' }); // Generic OK
}
```
**Problema:** Los logs en consola pueden exponer stack traces.
**Solución:** Usar logger profesional (Winston/Pino) con niveles.

---

## ⚙️ MEDIO - Mejoras Recomendadas

### 9. **Base64 en Base de Datos - Performance** 📊
**Ubicación:** Campos `@db.LongText` en schema.prisma
**Problema:** Imágenes Base64 inflan el tamaño de la BD.
- Una foto de 2MB → 2.7MB en Base64
- Cargar `SELECT *` trae todas las imágenes

**Solución Alternativa:**
- Almacenar en S3/Cloudinary/File System
- Guardar solo la URL en BD
- O implementar lazy loading (SELECT sin campos BLOB)

---

### 10. **Sin Paginación en Listados** 📊
**Ubicación:** `/api/vehicles`, `/api/logs`, `/api/users`
**Problema:** Con 100+ vehículos, el GET trae TODO.
```typescript
app.get('/api/vehicles', async (req, res) => {
  const vehicles = await prisma.vehicle.findMany(); // ❌ Sin límite
  res.json(vehicles);
});
```
**Solución:**
```typescript
app.get('/api/vehicles', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const vehicles = await prisma.vehicle.findMany({
    skip: (page - 1) * limit,
    take: limit
  });
  res.json(vehicles);
});
```

---

### 11. **Frontend - No Hay Manejo de Estado Persistente** 📱
**Ubicación:** `src/App.tsx`
**Problema:** Si recargas la página, pierdes el usuario actual.
**Solución:** Usar localStorage o sessionStorage para persistir sesión.

---

### 12. **Sin Backup Automático de BD** 💾
**Problema:** Si se corrompe `prisma/dev.db`, se pierde todo.
**Solución:** Script de backup diario:
```bash
# scripts/backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp prisma/dev.db backups/dev_$DATE.db
```

---

### 13. **Timestamps - Zona Horaria Inconsistente** 🕐
**Problema:** Fechas pueden no coincidir con zona horaria de Argentina.
**Solución:** 
- Almacenar siempre en UTC
- Convertir a timezone local en frontend
- Usar `date-fns-tz` o `dayjs`

---

## 🔧 BAJO - Optimizaciones

### 14. **Conexión Prisma - No Se Cierra** 
**Ubicación:** `server/index.ts`
**Problema:** No hay `prisma.$disconnect()` al cerrar server.
**Solución:**
```typescript
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

---

### 15. **Variables de Entorno - Hardcodeadas**
**Ubicación:** `server/index.ts` - Línea 8
```typescript
const PORT = 3001; // ❌ Hardcoded
```
**Solución:**
```typescript
const PORT = parseInt(process.env.PORT || '3001');
```

---

### 16. **Sin Logging Estructurado**
**Problema:** `console.log` no es escalable.
**Solución:** Implementar Winston:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

### 17. **Frontend - Demasiados Re-renders**
**Ubicación:** `App.tsx` - useEffect dependencies
**Problema:** Algunos useEffect pueden causar loops.
**Solución:** Revisar dependency arrays y usar `useMemo`/`useCallback`.

---

### 18. **Sin Healthcheck Endpoint**
**Solución:**
```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

---

## 📋 Resumen de Prioridades

### 🔴 URGENTE (Antes de Producción)
1. ✅ Hashear contraseñas con bcrypt
2. ✅ Implementar sistema de login/JWT
3. ✅ Middleware de autorización por rol
4. ✅ Configurar CORS específico
5. ✅ Rate limiting

### 🟡 IMPORTANTE (Siguientes 2 Semanas)
6. ✅ Validación de inputs con Zod
7. ✅ Paginación en listados
8. ✅ Manejo de errores profesional
9. ✅ Backup automático de BD
10. ✅ Variables de entorno

### 🟢 MEJORAS (Backlog)
11. ✅ Migrar imágenes a storage externo
12. ✅ Logging estructurado
13. ✅ Optimizar re-renders
14. ✅ Healthcheck endpoint

---

## 🎯 Recomendaciones para Login + API de Notificaciones

### Para Login:
```typescript
// 1. Instalar dependencias
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs

// 2. Crear endpoints
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
GET  /api/auth/me

// 3. Middleware de autenticación
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Para API de Notificaciones:
```typescript
// Webhook para sistema externo
POST /api/notifications/webhook
- Recibe alertas del sistema
- Valida firma HMAC
- Procesa y almacena

// Enviar notificaciones a sistema externo
POST /api/notifications/send
- Autentica con API key
- Envía evento (vencimiento VTV, etc.)
- Retry logic si falla
```

---

## ✅ Lo que YA está bien:
- ✅ Uso de Prisma ORM (previene SQL injection básico)
- ✅ TypeScript en todo el stack
- ✅ Estructura modular de componentes
- ✅ Responsive design implementado
- ✅ Toast notifications para UX
- ✅ PDF export funcional
- ✅ Dashboard de alertas

---

**Conclusión:** El sistema tiene una base sólida, pero **DEBE implementar autenticación y autorización ANTES de producción**. Los demás puntos son mejoras incrementales.
