import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Paviotti Fleet Management API',
        version: '1.0.0',
        description: `
# 🚗 API de Gestión de Flotas Paviotti

Sistema completo de gestión de flotas vehiculares que incluye:

- ✅ **Autenticación JWT** con refresh tokens
- ✅ **Gestión de Vehículos** (CRUD completo)
- ✅ **Control de Usuarios** y roles (Admin/Empleado)
- ✅ **Registros de Inspección** (semanal, service, combustible)
- ✅ **Sistema de Notificaciones** automáticas
- ✅ **Alertas Inteligentes** (VTV, seguros, mantenimiento)
- ✅ **Webhooks** entrantes y salientes

## 🔐 Autenticación

La mayoría de endpoints requieren autenticación JWT.

### Cómo autenticarte:

1. **Obtén tu token** haciendo login en \`POST /api/auth/login\`
2. **Haz clic en "Authorize" 🔓** (botón verde arriba)
3. **Ingresa:** \`Bearer {tu-token}\` (reemplaza {tu-token} con el token recibido)
4. **Haz clic en "Authorize"** y cierra el modal
5. **Listo!** Ahora puedes probar todos los endpoints protegidos

### Usuario de prueba:

\`\`\`json
{
  "email": "admin@paviotti.com",
  "password": "admin123"
}
\`\`\`

## 📊 Rate Limiting

Para proteger la API, hay límites de requests:

- **Autenticación (login/register):** 5 intentos cada 15 minutos
- **API General:** 100 requests cada 15 minutos

## 🔔 Notificaciones

El sistema puede enviar alertas automáticas a sistemas externos:

- VTV próxima a vencer (30, 15, 7, 1 días antes)
- Seguros próximos a vencer
- Licencias de conducir vencidas
- Vehículos que necesitan mantenimiento

## 📖 Convenciones

- **200 OK:** Operación exitosa
- **201 Created:** Recurso creado exitosamente
- **400 Bad Request:** Datos inválidos
- **401 Unauthorized:** No autenticado
- **403 Forbidden:** No autorizado (falta permiso)
- **404 Not Found:** Recurso no encontrado
- **429 Too Many Requests:** Límite de rate exceeded
- **500 Internal Server Error:** Error del servidor
    `,
        contact: {
            name: 'Equipo Técnico Paviotti',
            email: 'soporte@paviotti.com',
            url: 'https://paviotti.com'
        },
        license: {
            name: 'Proprietario',
            url: 'https://paviotti.com/license'
        }
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: '🔧 Servidor de Desarrollo'
        },
        {
            url: 'https://api.paviotti.com',
            description: '🚀 Servidor de Producción'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Ingresa tu token JWT en formato: Bearer {token}'
            }
        },
        schemas: {
            // Error genérico
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Mensaje de error descriptivo',
                        example: 'No se pudo completar la operación'
                    }
                }
            },
            // Error de validación
            ValidationError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        example: 'Datos de entrada inválidos'
                    },
                    details: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                field: {
                                    type: 'string',
                                    description: 'Campo que tiene error',
                                    example: 'email'
                                },
                                message: {
                                    type: 'string',
                                    description: 'Mensaje de error',
                                    example: 'Email inválido'
                                }
                            }
                        }
                    }
                }
            },
            // Usuario
            User: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'user-1642345678901'
                    },
                    name: {
                        type: 'string',
                        example: 'Juan Pérez'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'juan.perez@paviotti.com'
                    },
                    role: {
                        type: 'string',
                        enum: ['ADMIN', 'EMPLOYEE'],
                        description: 'Rol del usuario en el sistema',
                        example: 'EMPLOYEE'
                    },
                    active: {
                        type: 'boolean',
                        description: 'Si el usuario está activo',
                        example: true
                    },
                    licenseExpiration: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                        description: 'Fecha de vencimiento de licencia de conducir',
                        example: '2026-12-31T00:00:00.000Z'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-01-01T00:00:00.000Z'
                    }
                }
            },
            // Vehículo
            Vehicle: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'vehicle-abc123'
                    },
                    plate: {
                        type: 'string',
                        description: 'Patente del vehículo',
                        example: 'ABC-123'
                    },
                    brand: {
                        type: 'string',
                        example: 'Toyota'
                    },
                    model: {
                        type: 'string',
                        example: 'Hilux'
                    },
                    year: {
                        type: 'integer',
                        example: 2023
                    },
                    color: {
                        type: 'string',
                        example: 'Blanco'
                    },
                    currentMileage: {
                        type: 'integer',
                        description: 'Kilometraje actual',
                        example: 45000
                    },
                    lastServiceMileage: {
                        type: 'integer',
                        description: 'Kilometraje del último service',
                        example: 40000
                    },
                    lastServiceDate: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-12-01T00:00:00.000Z'
                    },
                    vtvExpiry: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                        description: 'Fecha de vencimiento de VTV',
                        example: '2026-06-30T00:00:00.000Z'
                    },
                    insuranceExpiry: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                        description: 'Fecha de vencimiento del seguro',
                        example: '2026-12-31T00:00:00.000Z'
                    },
                    status: {
                        type: 'string',
                        enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
                        example: 'ACTIVE'
                    }
                }
            }
        }
    },
    tags: [
        {
            name: 'Autenticación',
            description: '🔐 Endpoints de login, registro y gestión de tokens JWT'
        },
        {
            name: 'Vehículos',
            description: '🚗 Gestión completa de la flota vehicular (CRUD)'
        },
        {
            name: 'Usuarios',
            description: '👥 Administración de usuarios del sistema'
        },
        {
            name: 'Registros',
            description: '📋 Logs de inspecciones, services y combustible'
        },
        {
            name: 'Notificaciones',
            description: '🔔 Sistema de alertas automáticas y webhooks'
        },
        {
            name: 'Configuración',
            description: '⚙️ Configuración del sistema'
        }
    ]
};

const options = {
    swaggerDefinition,
    apis: [
        './server/routes/*.ts',
        './server/index.ts'
    ]
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
