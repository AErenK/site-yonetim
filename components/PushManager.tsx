'use client'

import { subscribeUser } from "@/actions/push"
import { useEffect, useState } from "react"
import { Bell } from "lucide-react"

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PushManager() {
    const [isSubscribed, setIsSubscribed] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(function (swReg) {
                    console.log('Service Worker is registered', swReg)
                    swReg.pushManager.getSubscription().then(function (subscription) {
                        setIsSubscribed(!(subscription === null))
                    })
                })
                .catch(function (error) {
                    console.error('Service Worker Error', error)
                })
        }
    }, [])

    const subscribe = async () => {
        if (!('serviceWorker' in navigator)) return

        // Request permission explicitly first to satisfy "user gesture" requirement
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            alert("Bildirim izni reddedildi.")
            return
        }

        const registration = await navigator.serviceWorker.ready
        // Fallback to hardcoded key if env var is missing (for testing/dev)
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BN5Ud_yg3hhMzRioGIhY1kO0ZnZYKeupbcwZuAviKw-oRZLoEbzeisqXEfjfroCoydEh3SCQHDnBi4kaCtl6RRw'

        if (!vapidPublicKey) {
            console.error("VAPID key missing")
            return
        }

        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })

            const result = await subscribeUser(JSON.parse(JSON.stringify(subscription)))
            if (result.error) {
                console.error("Server subscription failed:", result.error)
                alert("Sunucuya kayıt yapılamadı: " + result.error)
                return
            }
            setIsSubscribed(true)
            alert("Bildirimler açıldı!")
        } catch (error) {
            console.error("Subscription failed", error)
            alert("Bildirim izni alınamadı.")
        }
    }

    const unsubscribe = async () => {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
            await subscription.unsubscribe()
            setIsSubscribed(false)
            alert("Bildirim aboneliği sıfırlandı. Lütfen tekrar açın.")
        }
    }

    if (isSubscribed) {
        return (
            <button
                onClick={unsubscribe}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
                <Bell size={16} />
                Bildirimler Aktif (Sıfırla)
            </button>
        )
    }

    return (
        <button
            onClick={subscribe}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
            <Bell size={16} />
            Bildirimleri Aç
        </button>
    )
}
