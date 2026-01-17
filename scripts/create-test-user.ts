/**
 * Script para crear usuario de test simple
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/utils/auth';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createTestUser() {
    console.log('\n🧪 CREANDO USUARIO DE TEST\n');
    console.log('='.repeat(60));

    const testUser = {
        email: 'test@test.com',
        password: '3366',
        name: 'Usuario Test',
        role: 'ADMIN' as const
    };

    try {
        // Verificar si ya existe
        const existing = await prisma.user.findUnique({
            where: { email: testUser.email }
        });

        if (existing) {
            console.log(`\n⚠️  El usuario ${testUser.email} ya existe.`);
            console.log('   Actualizando password...\n');

            const hashedPassword = await hashPassword(testUser.password);

            await prisma.user.update({
                where: { email: testUser.email },
                data: {
                    password: hashedPassword,
                    name: testUser.name,
                    role: testUser.role,
                    active: true
                }
            });
        } else {
            console.log(`\n✅ Creando nuevo usuario...\n`);

            const hashedPassword = await hashPassword(testUser.password);

            await prisma.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email: testUser.email,
                    password: hashedPassword,
                    name: testUser.name,
                    role: testUser.role,
                    active: true
                }
            });
        }

        console.log('✅ Usuario de test creado/actualizado exitosamente!\n');
        console.log('='.repeat(60));
        console.log('\n📋 Credenciales de acceso:\n');
        console.log(`   Email:    ${testUser.email}`);
        console.log(`   Password: ${testUser.password}`);
        console.log(`   Role:     ${testUser.role}`);
        console.log('\n='.repeat(60));
        console.log('\n💡 Ahora puedes hacer login en: http://localhost:5173\n');

    } catch (error) {
        console.error('\n❌ Error creando usuario:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();
