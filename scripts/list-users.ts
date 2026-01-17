/**
 * Script para listar usuarios en la base de datos
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function listUsers() {
    console.log('\n👥 USUARIOS EN LA BASE DE DATOS\n');
    console.log('='.repeat(60));

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                licenseExpiration: true
            }
        });

        if (users.length === 0) {
            console.log('\n⚠️  No hay usuarios en la base de datos\n');
            console.log('Ejecuta: npm run create-admin\n');
        } else {
            console.log(`\n📊 Total de usuarios: ${users.length}\n`);

            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Active: ${user.active ? '✅ Sí' : '❌ No'}`);
                if (user.licenseExpiration) {
                    console.log(`   Licencia: ${new Date(user.licenseExpiration).toLocaleDateString('es-AR')}`);
                }
                console.log('');
            });

            console.log('='.repeat(60));
            console.log('\n💡 Para hacer login usa uno de estos emails');
            console.log('   Password por defecto: admin123 (si fue creado con create-admin)');
            console.log('   O el password que hayas configurado al crear el usuario\n');
        }

    } catch (error) {
        console.error('\n❌ Error consultando usuarios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
