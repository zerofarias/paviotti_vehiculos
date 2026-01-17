import { z } from 'zod';

// ==============================================
// 🔒 SCHEMAS DE VALIDACIÓN - Autenticación
// ==============================================

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida')
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['ADMIN', 'EMPLOYEE'], {
        errorMap: () => ({ message: 'Rol debe ser ADMIN o EMPLOYEE' })
    })
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string().min(6, 'Nueva contraseña debe tener al menos 6 caracteres')
});

// ==============================================
// 🔒 SCHEMAS DE VALIDACIÓN - Vehículos
// ==============================================

export const createVehicleSchema = z.object({
    id: z.string().optional(),
    plate: z.string().min(6, 'Patente debe tener al menos 6 caracteres').max(10),
    brand: z.string().min(2, 'Marca requerida'),
    model: z.string().min(1, 'Modelo requerido'),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    color: z.string().min(2, 'Color requerido'),
    currentMileage: z.number().int().min(0).optional(),
    lastServiceMileage: z.number().int().min(0).optional(),
    lastServiceDate: z.string().optional(),
    chassisNumber: z.string().optional(),
    motorNumber: z.string().optional(),
    vtvExpiry: z.string().optional(),
    insuranceExpiry: z.string().optional()
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
    id: z.string()
});

// ==============================================
// 🔒 SCHEMAS DE VALIDACIÓN - Usuarios
// ==============================================

export const createUserSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['ADMIN', 'EMPLOYEE']),
    active: z.boolean().optional(),
    licenseExpiration: z.string().optional()
});

export const updateUserSchema = z.object({
    id: z.string(),
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
    active: z.boolean().optional(),
    licenseExpiration: z.string().nullable().optional(),
    photo: z.string().nullable().optional(),
    licensePhoto: z.string().nullable().optional()
});

// ==============================================
// 🔒 SCHEMAS DE VALIDACIÓN - Logs/Registros
// ==============================================

export const createLogSchema = z.object({
    vehicleId: z.string(),
    userId: z.string(),
    type: z.enum(['WEEKLY_SAFETY', 'SERVICE', 'FUEL']),
    mileage: z.number().int().min(0),
    timestamp: z.string().optional(),
    details: z.object({
        tirePressurePsi: z.number().optional(),
        oilLevel: z.enum(['normal', 'low']).optional(),
        brakeFluidLevel: z.enum(['normal', 'low']).optional(),
        wiperFluidLevel: z.enum(['normal', 'low']).optional(),
        coolantLevel: z.enum(['normal', 'low']).optional(),
        lightsOk: z.boolean().optional(),
        fireExtinguisherOk: z.boolean().optional(),
        fireExtinguisherExpiry: z.string().optional(),
        serviceCost: z.number().optional(),
        workshopName: z.string().optional(),
        fuelLiters: z.number().optional(),
        fuelCost: z.number().optional(),
        notes: z.string().optional(),
        cleanlinessOk: z.boolean().optional(),
        uniformOk: z.boolean().optional()
    }).optional()
});

// ==============================================
// HELPER para validar requests
// ==============================================

export const validate = <T>(schema: z.ZodSchema<T>) => {
    return (data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
        const result = schema.safeParse(data);

        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, errors: result.error };
        }
    };
};

// Middleware para Express
export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
    return (req: any, res: any, next: any) => {
        const result = validate(schema)(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: result.errors.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        req.validatedData = result.data;
        next();
    };
};
