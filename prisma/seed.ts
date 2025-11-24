import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@kartepe.com' },
        update: {},
        create: {
            email: 'admin@kartepe.com',
            name: 'Site Yöneticisi',
            password: '123', // In real app, hash this!
            role: 'ADMIN',
        },
    })

    // Create Employees
    const emp1 = await prisma.user.upsert({
        where: { email: 'ali@kartepe.com' },
        update: {},
        create: {
            email: 'ali@kartepe.com',
            name: 'Ali Yılmaz',
            password: '123',
            role: 'EMPLOYEE',
        },
    })

    const emp2 = await prisma.user.upsert({
        where: { email: 'veli@kartepe.com' },
        update: {},
        create: {
            email: 'veli@kartepe.com',
            name: 'Veli Demir',
            password: '123',
            role: 'EMPLOYEE',
        },
    })

    console.log({ admin, emp1, emp2 })
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
