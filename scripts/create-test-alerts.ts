/**
 * Script para crear datos de prueba con alertas
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createTestData() {
    console.log('\n🧪 CREANDO DATOS DE PRUEBA CON ALERTAS\n');
    console.log('='.repeat(60));

    try {
        // Obtener o crear configuración de mantenimiento
        let config = await prisma.maintenanceconfig.findFirst();
        if (!config) {
            console.log('\n📝 Creando configuración de mantenimiento...');
            config = await prisma.maintenanceconfig.create({
                data: {
                    serviceKmInterval: 10000,
                    serviceMonthInterval: 6,
                    tireChangeKmInterval: 50000,
                    checkIntervalDays: 7,
                    alertOnService: true
                }
            });
            console.log('✅ Configuración creada');
        }

        // Calcular fechas
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const in5Days = new Date(today);
        in5Days.setDate(in5Days.getDate() + 5);

        const in10Days = new Date(today);
        in10Days.setDate(in10Days.getDate() + 10);

        const in25Days = new Date(today);
        in25Days.setDate(in25Days.getDate() + 25);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // 1. Crear vehículo con VTV próxima a vencer (CRÍTICO - 5 días)
        console.log('\n🚗 Creando vehículo con VTV próxima a vencer (5 días)...');
        const vehicle1 = await prisma.vehicle.create({
            data: {
                id: `test-vtv-critical-${Date.now()}`,
                plate: 'VTV-005',
                brand: 'Toyota',
                model: 'Hilux SR',
                year: 2020,
                color: '#FFFFFF',
                chassisNumber: 'TEST123456789VTV5',
                motorNumber: 'MOT123VTV5',
                currentMileage: 85000,
                vtvExpiry: in5Days,
                insuranceExpiry: new Date(2027, 0, 1),
                lastServiceDate: monthAgo,
                lastServiceMileage: 80000,
                status: 'ACTIVE'
            }
        });
        console.log(`✅ Vehículo creado: ${vehicle1.plate} - VTV vence ${in5Days.toLocaleDateString('es-AR')}`);

        // 2. Crear vehículo con VTV vencida
        console.log('\n🚗 Creando vehículo con VTV VENCIDA...');
        const vehicle2 = await prisma.vehicle.create({
            data: {
                id: `test-vtv-expired-${Date.now()}`,
                plate: 'VTV-000',
                brand: 'Ford',
                model: 'Ranger XL',
                year: 2019,
                color: '#FF0000',
                chassisNumber: 'TEST123456789VTVEXP',
                motorNumber: 'MOT123VTVEXP',
                currentMileage: 120000,
                vtvExpiry: weekAgo,
                insuranceExpiry: new Date(2027, 0, 1),
                lastServiceDate: sixMonthsAgo,
                lastServiceMileage: 110000,
                status: 'ACTIVE'
            }
        });
        console.log(`✅ Vehículo creado: ${vehicle2.plate} - VTV VENCIDA desde ${weekAgo.toLocaleDateString('es-AR')}`);

        // 3. Crear vehículo con seguro próximo a vencer (10 días)
        console.log('\n🚗 Creando vehículo con seguro próximo a vencer (10 días)...');
        const vehicle3 = await prisma.vehicle.create({
            data: {
                id: `test-insurance-${Date.now()}`,
                plate: 'SEG-010',
                brand: 'Chevrolet',
                model: 'S10 LT',
                year: 2021,
                color: '#000000',
                chassisNumber: 'TEST123456789SEG',
                motorNumber: 'MOT123SEG',
                currentMileage: 45000,
                vtvExpiry: new Date(2027, 0, 1),
                insuranceExpiry: in10Days,
                lastServiceDate: monthAgo,
                lastServiceMileage: 40000,
                status: 'ACTIVE'
            }
        });
        console.log(`✅ Vehículo creado: ${vehicle3.plate} - Seguro vence ${in10Days.toLocaleDateString('es-AR')}`);

        // 4. Crear vehículo que necesita mantenimiento (por km)
        console.log('\n🚗 Creando vehículo que necesita mantenimiento...');
        const vehicle4 = await prisma.vehicle.create({
            data: {
                id: `test-maintenance-${Date.now()}`,
                plate: 'MNT-KM',
                brand: 'Volkswagen',
                model: 'Amarok',
                year: 2022,
                color: '#0000FF',
                chassisNumber: 'TEST123456789MNT',
                motorNumber: 'MOT123MNT',
                currentMileage: 92000,
                vtvExpiry: new Date(2027, 0, 1),
                insuranceExpiry: new Date(2027, 0, 1),
                lastServiceDate: sixMonthsAgo,
                lastServiceMileage: 80000, // 12,000 km desde último service (límite: 10,000)
                status: 'ACTIVE'
            }
        });
        console.log(`✅ Vehículo creado: ${vehicle4.plate} - Necesita service (12,000 km desde último)`);

        // 5. Crear usuario con licencia vencida
        console.log('\n👤 Creando usuario con licencia vencida...');
        const user = await prisma.user.create({
            data: {
                id: `test-license-${Date.now()}`,
                name: 'Juan Pérez (Prueba)',
                email: `test-license-${Date.now()}@paviotti.com`,
                password: 'hashed-password-test',
                role: 'EMPLOYEE',
                active: true,
                licenseExpiration: weekAgo
            }
        });
        console.log(`✅ Usuario creado: ${user.name} - Licencia vencida desde ${weekAgo.toLocaleDateString('es-AR')}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE\n');

        console.log('📊 Resumen de alertas que se generarán:\n');
        console.log(`  🔴 VTV vencida: ${vehicle2.plate}`);
        console.log(`  🔴 VTV próxima (5 días): ${vehicle1.plate}`);
        console.log(`  🟡 Seguro próximo (10 días): ${vehicle3.plate}`);
        console.log(`  🔧 Mantenimiento requerido: ${vehicle4.plate}`);
        console.log(`  🪪 Licencia vencida: ${user.name}\n`);

        console.log('💡 Ahora ejecuta:');
        console.log('   npm run test-emails\n');
        console.log('   Para recibir 5 emails de alerta!\n');

    } catch (error) {
        console.error('\n❌ Error creando datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestData();
