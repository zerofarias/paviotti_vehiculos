
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Clearing vehicles...');
        await prisma.vehicle.deleteMany({});
        console.log('Vehicles cleared successfully.');
    } catch (error) {
        console.error('Error clearing vehicles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
