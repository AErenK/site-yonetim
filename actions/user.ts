'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { error: 'Yetkisiz işlem.' }
    }

    // Prevent deleting self
    if (userId === session.id) {
        return { error: 'Kendinizi silemezsiniz.' }
    }

    try {
        // Delete related data first (optional, depending on cascade rules)
        // Prisma handles cascade delete if configured in schema, but let's be safe
        // Actually, let's just delete the user and let the DB handle constraints or errors
        await prisma.user.delete({
            where: { id: userId },
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error("Error deleting user:", error)
        return { error: 'Kullanıcı silinemedi. Bağlı kayıtlar olabilir.' }
    }
}
