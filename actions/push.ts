'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from './auth'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = 'BN5Ud_yg3hhMzRioGIhY1kO0ZnZYKeupbcwZuAviKw-oRZLoEbzeisqXEfjfroCoydEh3SCQHDnBi4kaCtl6RRw';
const VAPID_PRIVATE_KEY = 'cALNljt02WFA_cGITiWgvwWNWHu2J0satO3zv7yn4a4';

function setupWebPush() {
    try {
        webpush.setVapidDetails(
            'mailto:admin@kartepe.com',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
        return true;
    } catch (error) {
        console.error("VAPID Setup Error:", error);
        return false;
    }
}

export async function subscribeUser(sub: any) {
    const session = await getSession()
    if (!session) return { error: 'Oturum açın.' }

    try {
        await prisma.pushSubscription.create({
            data: {
                userId: session.id,
                endpoint: sub.endpoint,
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
            },
        })
        return { success: true }
    } catch (error) {
        console.error("Error saving subscription:", error)
        return { error: 'Veritabanı hatası' }
    }
}

export async function sendPushNotification(userId: string, message: string) {
    if (!setupWebPush()) {
        console.error("Cannot send push: VAPID keys missing.")
        return
    }

    console.log(`Sending push to user ${userId}: ${message}`)
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    })
    console.log(`Found ${subscriptions.length} subscriptions for user ${userId}`)

    const promises = subscriptions.map((sub) => {
        const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
                auth: sub.auth,
                p256dh: sub.p256dh,
            },
        }

        return webpush.sendNotification(pushConfig, JSON.stringify({
            title: 'Site Yönetim',
            body: message,
            icon: '/icon.png'
        })).catch((err) => {
            console.error('Push error', err)
            if (err.statusCode === 410) {
                // Expired subscription, delete it
                return prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(console.error)
            }
        })
    })

    await Promise.all(promises)
}
