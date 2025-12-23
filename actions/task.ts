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
    const isPermanent = formData.get('isPermanent') === 'on'

    if (!title || !assignedToId || !siteName) {
        return { error: 'Eksik bilgi.' }
    }

    // Calculate expiration date (30 days from now) if not permanent
    const expiresAt = isPermanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const task = await prisma.task.create({
        data: {
            title,
            description,
            assignedToId,
            createdById: session.id,
            siteName,
            status: 'PENDING',
            isPermanent,
            expiresAt,
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

export async function deleteTask(taskId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Yetkisiz.' }

    await prisma.task.delete({
        where: { id: taskId },
    })

    revalidatePath('/admin')
    return { success: true }
}

export async function extendTask(taskId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Yetkisiz.' }

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return { error: 'Görev bulunamadı.' }

    // If permanent, do nothing or maybe switch to non-permanent? 
    // Let's assume extend means add 30 days to current expiry or set new expiry if permanent
    
    let newExpiresAt = new Date()
    if (task.expiresAt) {
        newExpiresAt = new Date(task.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else {
        // If it was permanent or null, set it to 30 days from now (making it non-permanent effectively, or just updating date)
        // But if it is permanent, maybe user wants to keep it permanent.
        // Requirement: "istendiği zaman süresi uzatılsın"
        // If it's permanent, it doesn't need extension. So this probably applies to non-permanent tasks.
        // If user clicks extend on a permanent task, maybe we shouldn't show the button.
        // Or we just set a date 30 days from now.
        newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    await prisma.task.update({
        where: { id: taskId },
        data: { 
            expiresAt: newExpiresAt,
            isPermanent: false // If extended, it has an expiry now
        },
    })

    revalidatePath('/admin')
    return { success: true }
}

export async function togglePermanent(taskId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Yetkisiz.' }

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return { error: 'Görev bulunamadı.' }

    await prisma.task.update({
        where: { id: taskId },
        data: { 
            isPermanent: !task.isPermanent,
            expiresAt: !task.isPermanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // If becoming non-permanent, set 30 days default
        },
    })

    revalidatePath('/admin')
    return { success: true }
}
