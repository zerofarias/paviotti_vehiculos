


import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3001');

// ==============================================
// 🔒 SEGURIDAD - Helmet (Headers de seguridad)
// ==============================================
app.use(helmet());

// ==============================================
// 🔒 SEGURIDAD - CORS Específico
// ==============================================
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (como Postman) o desde la misma red local
        if (!origin ||
            allowedOrigins.includes(origin) ||
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://10.') ||
            origin.startsWith('http://172.')) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(null, true); // En desarrollo permitimos todo, pero logueamos el warning
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// ==============================================
// 🔒 SEGURIDAD - Rate Limiting
// ==============================================

// Rate limiter estricto para autenticación (prevenir fuerza bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter general para la API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: { error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiting a rutas de autenticación
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Aplicar rate limiting general a todas las rutas API
app.use('/api', apiLimiter);

// ==============================================
// LOGGING - Mejorado con timestamp
// ==============================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// ==============================================
// 📚 DOCUMENTACIÓN SWAGGER
// ==============================================

import { swaggerUi, swaggerSpec } from './swagger';

// Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #1e293b; font-size: 2.5rem; }
    .swagger-ui .scheme-container { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 10px;
    }
  `,
    customSiteTitle: 'Paviotti Fleet API',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
            activate: true,
            theme: 'monokai'
        }
    }
}));

// Endpoint para obtener el spec en JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ==============================================
// RUTAS
// ==============================================

import notificationRoutes from './routes/notifications';

// Authentication routes
app.use('/api/auth', authRoutes);

// Notifications routes
app.use('/api/notifications', notificationRoutes);

// --- USERS API ---

// GET /api/users - Fetch all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users - Create new user
app.post('/api/users', async (req, res) => {
    try {
        // Hash password antes de guardar
        const hashedPassword = req.body.password
            ? await import('./utils/auth').then(m => m.hashPassword(req.body.password))
            : '';

        // Generar ID si no viene del frontend
        const userId = req.body.id || crypto.randomUUID();

        const newUser = await prisma.user.create({
            data: {
                id: userId,
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                role: req.body.role,
                active: req.body.active ?? true,
                licenseExpiration: req.body.licenseExpiration ? new Date(req.body.licenseExpiration) : null,
                photo: req.body.photo,
                licensePhoto: req.body.licensePhoto,
            },
        });
        res.json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Hash password solo si se está actualizando
        const hashedPassword = req.body.password
            ? await import('./utils/auth').then(m => m.hashPassword(req.body.password))
            : undefined;

        const updateData: any = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            active: req.body.active,
            licenseExpiration: req.body.licenseExpiration ? new Date(req.body.licenseExpiration) : null,
            photo: req.body.photo,
            licensePhoto: req.body.licensePhoto,
        };

        // Solo actualizar password si se proporcionó
        if (hashedPassword) {
            updateData.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id - Delete user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({
            where: { id },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// --- VEHICLES API ---

const safeParseJSON = (jsonString: string | null, fallback: any = []) => {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn('Failed to parse JSON:', jsonString, e);
        return fallback;
    }
};

app.get('/api/vehicles', async (req, res) => {
    try {
        const vehiclesData = await prisma.vehicle.findMany();
        const damageHistoryData = await prisma.damage_history.findMany({
            orderBy: { repairedDate: 'desc' }
        });

        const tiresData = await prisma.tire.findMany();

        const vehicles = vehiclesData.map(v => ({
            ...v,
            status: v.status?.toLowerCase() || 'active', // Map ENUM back to frontend lowercase
            damagePoints: safeParseJSON(v.damagePoints),
            inventory: safeParseJSON(v.inventory),
            fuelLogs: safeParseJSON(v.fuelLogs),
            photos: safeParseJSON(v.photos),
            damageHistory: damageHistoryData.filter(h => h.vehicleId === v.id),
            tires: tiresData.filter(t => t.vehicleId === v.id)
        }));
        res.json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles FULL ERROR:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles', details: String(error) });
    }
});

// ... (POST /api/vehicles remains mostly same)

// POST /api/vehicles/:id/repair-damage
app.post('/api/vehicles/:id/repair-damage', async (req, res) => {
    const { id } = req.params;
    const { damagePointIds, repairedBy, cost, notes } = req.body; // Array of IDs to repair

    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

        const currentPoints: any[] = safeParseJSON(vehicle.damagePoints);
        const pointsToRepair = currentPoints.filter(p => damagePointIds.includes(p.id));
        const remainingPoints = currentPoints.filter(p => !damagePointIds.includes(p.id));

        if (pointsToRepair.length === 0) {
            return res.json({ message: 'No points to repair found' });
        }

        // Create history entries
        // We use $transaction to ensure both happen
        await prisma.$transaction(async (tx) => {
            // 1. Create history records
            for (const p of pointsToRepair) {
                await tx.damage_history.create({
                    data: {
                        vehicleId: id,
                        x: p.x,
                        y: p.y,
                        type: p.type || 'unknown',
                        description: p.description || p.comment || '', // Handle varied naming in frontend?
                        severity: p.severity || 'medium', // Default
                        reportedDate: p.date ? new Date(p.date) : new Date(),
                        repairedDate: new Date(),
                        repairedBy: repairedBy || 'Admin',
                        repairCost: cost ? parseFloat(cost) : 0,
                        repairNotes: notes || ''
                    }
                });
            }

            // 2. Update vehicle damagePoints
            await tx.vehicle.update({
                where: { id },
                data: {
                    damagePoints: JSON.stringify(remainingPoints)
                }
            });
        });

        // Fetch updated vehicle
        const updatedVehicle = await prisma.vehicle.findUnique({
            where: { id }
        });

        if (!updatedVehicle) throw new Error("Failed to refetch");

        const updatedHistory = await prisma.damage_history.findMany({
            where: { vehicleId: id },
            orderBy: { repairedDate: 'desc' }
        });

        res.json({
            ...updatedVehicle,
            status: updatedVehicle.status ? updatedVehicle.status.toLowerCase() : 'active',
            damagePoints: safeParseJSON(updatedVehicle.damagePoints),
            inventory: safeParseJSON(updatedVehicle.inventory),
            fuelLogs: safeParseJSON(updatedVehicle.fuelLogs),
            photos: safeParseJSON(updatedVehicle.photos),
            damageHistory: updatedHistory,
        });

    } catch (error: any) {
        console.error('Error repairing damage:', error);
        res.status(500).json({ error: 'Failed to repair damage', details: error.message });
    }
});

app.put('/api/vehicles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { damagePoints, inventory, fuelLogs, photos, checklog, status, damageHistory, ...rest } = req.body;

        // Exclude checklog if passed by accident (relation)

        // Map status if present
        const statusMap: Record<string, any> = {
            'active': 'ACTIVE',
            'maintenance': 'MAINTENANCE',
            'out_of_service': 'OUT_OF_SERVICE'
        };

        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: {
                ...rest,
                status: status ? (statusMap[status] || undefined) : undefined,
                damagePoints: damagePoints ? JSON.stringify(damagePoints) : undefined,
                inventory: inventory ? JSON.stringify(inventory) : undefined,
                fuelLogs: fuelLogs ? JSON.stringify(fuelLogs) : undefined,
                photos: photos ? JSON.stringify(photos) : undefined
            }
        });

        res.json({
            ...updatedVehicle,
            status: updatedVehicle.status ? updatedVehicle.status.toLowerCase() : 'active',
            damagePoints: damagePoints || [], // return what was sent or empty
            inventory: inventory || [],
            fuelLogs: fuelLogs || [],
            photos: photos || []
        });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// --- LOGS API ---

// Helper to map fluid levels
const toPrismaFluid = (val: string | undefined): any => {
    if (!val) return undefined;
    const map: Record<string, string> = { 'normal': 'NORMAL', 'low': 'LOW' };
    return map[val] || undefined;
};

const fromPrismaFluid = (val: string | null | undefined): 'normal' | 'low' | undefined => {
    if (!val) return undefined;
    const map: Record<string, 'normal' | 'low'> = { 'NORMAL': 'normal', 'LOW': 'low' };
    return map[val] || undefined; // default? or 'normal'
};

app.get('/api/logs', async (req, res) => {
    try {
        const logs = await prisma.checklog.findMany({
            orderBy: { timestamp: 'desc' }
        });

        const parsedLogs = logs.map(log => ({
            id: log.id,
            vehicleId: log.vehicleId,
            userId: log.userId,
            userName: log.userName || 'Usuario',
            type: log.type,
            timestamp: log.timestamp,
            mileage: log.mileage,
            details: {
                notes: log.notes,
                tirePressurePsi: log.tirePressurePsi,
                oilLevel: fromPrismaFluid(log.oilLevel?.toString()),
                coolantLevel: fromPrismaFluid(log.coolantLevel?.toString()),
                brakeFluidLevel: fromPrismaFluid(log.brakeFluidLevel?.toString()),
                wiperFluidLevel: fromPrismaFluid(log.wiperFluidLevel?.toString()),
                lightsOk: log.lightsOk,
                hornOk: log.hornOk,
                fireExtinguisherOk: log.fireExtinguisherOk,
                fireExtinguisherExpiry: log.fireExtinguisherExpiry,
                spareTireOk: log.spareTireOk,
                itemsChecked: log.itemsChecked ? JSON.parse(log.itemsChecked) : [],
                fuelLiters: log.fuelLiters,
                fuelCost: log.fuelCost,
                workshopName: log.workshopName,
                serviceCost: log.serviceCost
            }
        }));
        res.json(parsedLogs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const { details, id, ...rest } = req.body;
        const logId = id || Math.random().toString(36).substr(2, 9);

        // Map frontend lowercase ('normal') to Prisma Enum ('NORMAL')
        const newLog = await prisma.checklog.create({
            data: {
                ...rest,
                id: logId,
                // Map details back to columns
                notes: details.notes,
                tirePressurePsi: details.tirePressurePsi,

                oilLevel: toPrismaFluid(details.oilLevel),
                coolantLevel: toPrismaFluid(details.coolantLevel),
                brakeFluidLevel: toPrismaFluid(details.brakeFluidLevel),
                wiperFluidLevel: toPrismaFluid(details.wiperFluidLevel),

                lightsOk: details.lightsOk,
                hornOk: details.hornOk,
                fireExtinguisherOk: details.fireExtinguisherOk,
                fireExtinguisherExpiry: details.fireExtinguisherExpiry,
                spareTireOk: details.spareTireOk,
                itemsChecked: details.itemsChecked ? JSON.stringify(details.itemsChecked) : undefined,
                fuelLiters: details.fuelLiters,
                fuelCost: details.fuelCost,
                workshopName: details.workshopName,
                serviceCost: details.serviceCost
            }
        });

        // Update Vehicle lastCheckDate
        if (newLog.vehicleId) {
            await prisma.vehicle.update({
                where: { id: newLog.vehicleId },
                data: {
                    lastCheckDate: newLog.timestamp,
                    lastCheckUser: newLog.userName || 'Usuario'
                }
            });
        }

        res.json({
            ...newLog,
            details: details // Echo back the details
        });

    } catch (error: any) {
        console.error('Error creating log:', error);
        console.dir(req.body, { depth: null }); // Inspect what was sent
        res.status(500).json({ error: 'Failed to create log', details: error.message });
    }
});

// --- MAINTENANCE CONFIG API ---

app.get('/api/config', async (req, res) => {
    try {
        const config = await prisma.maintenanceconfig.findFirst() || await prisma.maintenanceconfig.create({ data: {} });

        // Mezclar con variables de entorno si la DB está vacía para estos campos (retrocompatibilidad)
        const responseConfirm = {
            ...config,
            notificationEmails: config.notificationEmails || process.env.NOTIFICATION_EMAIL || '',
            smtpServer: config.smtpServer || process.env.SMTP_HOST || '',
            smtpUser: config.smtpUser || process.env.SMTP_USER || '',
            // No devolvemos password de SMTP
        };

        res.json(responseConfirm);
    } catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

app.put('/api/config', async (req, res) => {
    try {
        const { id, ...data } = req.body;

        // Actualizar todos los campos de configuración
        const updatedConfig = await prisma.maintenanceconfig.update({
            where: { id: 1 },
            data: {
                serviceKmInterval: data.serviceKmInterval,
                serviceMonthInterval: data.serviceMonthInterval,
                tireChangeKmInterval: data.tireChangeKmInterval,
                checkIntervalDays: data.checkIntervalDays,

                // Nuevos campos de alertas
                enableEmailAlerts: data.enableEmailAlerts,
                alertOnService: data.alertOnService,
                alertOnLicense: data.alertOnLicense,
                alertOnFireExtinguisher: data.alertOnFireExtinguisher,

                // Configuración de correo
                notificationEmails: data.notificationEmails,
                smtpServer: data.smtpServer,
                smtpUser: data.smtpUser
            }
        });
        res.json(updatedConfig);
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
});

// --- VEHICLE NOTES API ---

// GET /api/vehicles/:id/notes
app.get('/api/vehicles/:id/notes', async (req, res) => {
    const { id } = req.params;
    try {
        const notes = await prisma.vehicle_note.findMany({
            where: { vehicleId: id },
            orderBy: { date: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// POST /api/vehicles/:id/notes
app.post('/api/vehicles/:id/notes', async (req, res) => {
    const { id } = req.params;
    try {
        const { title, description, type, cost, attachment, createdBy, date } = req.body;
        const newNote = await prisma.vehicle_note.create({
            data: {
                vehicleId: id,
                title,
                description,
                type: type || 'GENERAL',
                cost: cost ? parseFloat(cost) : 0,
                attachment,
                createdBy,
                date: date ? new Date(date) : new Date()
            }
        });
        res.json(newNote);
    } catch (error: any) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note', details: error.message });
    }
});

// --- TIRES API ---

app.post('/api/vehicles/:id/tires', async (req, res) => {
    const { id } = req.params;
    try {
        const { position, brand, model, size, installMileage, currentTread } = req.body;

        // Remove existing tire at this position if any (or move to history? For simplicity, we just delete or update)
        // Ideally we should move old tire to "spare" or "disposed".
        // Let's check if there is a tire there.
        const existing = await prisma.tire.findFirst({
            where: { vehicleId: id, position: position }
        });

        if (existing) {
            // For now, let's just delete it to replace. In a real system we'd archive it.
            await prisma.tire.delete({ where: { id: existing.id } });
        }

        const newTire = await prisma.tire.create({
            data: {
                vehicleId: id,
                position,
                brand,
                model,
                size,
                installMileage: parseInt(installMileage),
                currentTread: currentTread ? parseFloat(currentTread) : undefined,
                status: 'GOOD'
            }
        });

        res.json(newTire);
    } catch (error: any) {
        console.error('Error adding tire:', error);
        res.status(500).json({ error: 'Failed to add tire', details: error.message });
    }
});

app.put('/api/vehicles/:id/tires/rotate', async (req, res) => {
    const { id } = req.params;
    try {
        // Rotation logic: FL->RL, RL->FL, FR->RR, RR->FR (Linear Swap) or Cross
        // We will implement a rotation that swaps Fronts with Rears.

        const tires = await prisma.tire.findMany({ where: { vehicleId: id } });

        // Map current positions to new positions
        // Simple rotation: Fronts go to Rear, Rears go to Front (Same side)
        const rotationMap: Record<string, string> = {
            'FL': 'RL',
            'RL': 'FL',
            'FR': 'RR',
            'RR': 'FR'
        };

        const updates = [];
        for (const tire of tires) {
            if (rotationMap[tire.position]) {
                updates.push(prisma.tire.update({
                    where: { id: tire.id },
                    data: { position: rotationMap[tire.position] }
                }));
            }
        }

        await prisma.$transaction(updates);

        // Add a note about rotation
        await prisma.vehicle_note.create({
            data: {
                vehicleId: id,
                title: 'Rotación de Neumáticos',
                description: 'Rotación realizada (Eje Delantero <-> Eje Trasero)',
                type: 'GENERAL',
                cost: 0,
                date: new Date()
            }
        });

        const updatedTires = await prisma.tire.findMany({ where: { vehicleId: id } });
        res.json(updatedTires);

    } catch (error: any) {
        console.error('Error rotating tires:', error);
        res.status(500).json({ error: 'Failed to rotate tires', details: error.message });
    }
});

app.put('/api/tires/:tireId', async (req, res) => {
    const { tireId } = req.params;
    try {
        const { currentTread, status } = req.body;
        const updated = await prisma.tire.update({
            where: { id: tireId },
            data: {
                currentTread: currentTread ? parseFloat(currentTread) : undefined,
                status: status ? status : undefined
            }
        });
        res.json(updated);
    } catch (error: any) {
        console.error('Error updating tire:', error);
        res.status(500).json({ error: 'Failed to update tire', details: error.message });
    }
});

// ==============================================
// 🕐 CRON JOBS - Alertas Automáticas
// ==============================================

import { startAlertCronJobs } from './jobs/notificationCron';

// Iniciar cron jobs
startAlertCronJobs();

// ==============================================
// 🚀 SERVIDOR
// ==============================================

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Servidor iniciado correctamente`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`⏰ Alertas programadas: 8:00 AM y 10:00 AM`);
    console.log(`${'='.repeat(60)}\n`);
});
