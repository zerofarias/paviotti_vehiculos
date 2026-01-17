import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
    console.log('🔧 Creando usuario administrador...');

    try {
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Crear o actualizar usuario admin
        const admin = await prisma.user.upsert({
            where: { email: 'admin@paviotti.com' },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                active: true
            },
            create: {
                id: `admin-${Date.now()}`,
                name: 'Administrador',
                email: 'admin@paviotti.com',
                password: hashedPassword,
                role: 'ADMIN',
                active: true
            }
        });

        console.log('✅ Usuario administrador creado/actualizado exitosamente');
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:    admin@paviotti.com');
        console.log('🔑 Password: admin123');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
        console.log('');

    } catch (error) {
        console.error('❌ Error creando usuario admin:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
