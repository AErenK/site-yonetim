import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // WARNING: This will DELETE all data in related tables.
    // We delete dependent tables first to avoid FK constraint errors.
    await prisma.pushSubscription.deleteMany().catch(() => {})
    await prisma.notification.deleteMany().catch(() => {})
    await prisma.task.deleteMany().catch(() => {})
    await prisma.user.deleteMany().catch(() => {})

    // Create a single admin user
    const admin = await prisma.user.create({
        data: {
            email: 'admin@kartepe.com',
            name: 'Site Yöneticisi',
            password: '123', // Change this after first login
            role: 'ADMIN',
        },
    })

    console.log('DB reset complete. Created admin:', admin.email)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
