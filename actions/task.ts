'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

import { sendPushNotification } from './push'

export async function createTask(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { error: 'Yetkisiz işlem.' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const assignedToId = formData.get('assignedToId') as string
    const siteName = formData.get('siteName') as string

    if (!title || !assignedToId || !siteName) {
        return { error: 'Eksik bilgi.' }
    }

    const task = await prisma.task.create({
        data: {
            title,
            description,
            assignedToId,
            createdById: session.id,
            siteName,
            status: 'PENDING',
        },
    })

    // Create notification for employee
    await prisma.notification.create({
        data: {
            userId: assignedToId,
            message: `Yeni görev atandı: ${title} (${siteName})`,
        },
    })

    // Send Push
    console.log(`Creating task. Assigning to: ${assignedToId}`)
    await sendPushNotification(assignedToId, `Yeni görev: ${title} - ${siteName}`)

    revalidatePath('/admin')
    return { success: true }
}

export async function completeTask(taskId: string, formData: FormData) {
    const session = await getSession()
    if (!session) return { error: 'Oturum açın.' }

    const cost = parseFloat(formData.get('cost') as string) || 0
    const costDescription = formData.get('costDescription') as string

    await prisma.task.update({
        where: { id: taskId },
        data: {
            status: 'COMPLETED',
            cost,
            costDescription,
        },
    })

    // Notify admin (creator)
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (task) {
        // Create in-app notification
        await prisma.notification.create({
            data: {
                userId: task.createdById,
                message: `${session.name} görevi tamamladı: ${task.title}. Onay bekleniyor.`,
            },
        })

        // Send Push to Admin (Creator)
        console.log(`Sending completion push to admin (creator): ${task.createdById}`)
        await sendPushNotification(task.createdById, `${session.name} görevi tamamladı: ${task.title}`)
        
        // Also send to ALL admins just in case the creator is not the current admin
        // This ensures at least one admin gets it if the creator account is deleted or changed
        if (task.createdById !== session.id) { // Don't send to self if admin completed their own task (rare)
             const admins = await prisma.user.findMany({
                where: { 
                    role: 'ADMIN',
                    id: { not: task.createdById } // Avoid duplicate if creator is already in this list
                }
            })
            
            for (const admin of admins) {
                console.log(`Sending completion push to other admin: ${admin.id}`)
                await sendPushNotification(admin.id, `${session.name} görevi tamamladı: ${task.title}`)
            }
        }
    }

    revalidatePath('/employee')
    return { success: true }
}

export async function approveTask(taskId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Yetkisiz.' }

    const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: 'APPROVED' },
    })

    // Notify employee
    await prisma.notification.create({
        data: {
            userId: task.assignedToId,
            message: `Göreviniz onaylandı: ${task.title}`,
        },
    })

    // Send Push
    await sendPushNotification(task.assignedToId, `Göreviniz onaylandı: ${task.title}`)

    revalidatePath('/admin')
    return { success: true }
}
