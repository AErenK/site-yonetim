'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
    const session = await getSession()
    if (!session) return []

    return await prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
    })
}

export async function markAsRead(notificationId: string) {
    await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    })
    revalidatePath('/admin')
    revalidatePath('/employee')
}
