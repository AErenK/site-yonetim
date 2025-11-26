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
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            // Check permission status immediately
            if (Notification.permission === 'default') {
                setShowModal(true)
            }

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
        setIsLoading(true)

        try {
            // Request permission explicitly first to satisfy "user gesture" requirement
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                alert("Bildirim izni reddedildi.")
                setIsLoading(false)
                return
            }

            const registration = await navigator.serviceWorker.ready
            // Fallback to hardcoded key if env var is missing (for testing/dev)
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BN5Ud_yg3hhMzRioGIhY1kO0ZnZYKeupbcwZuAviKw-oRZLoEbzeisqXEfjfroCoydEh3SCQHDnBi4kaCtl6RRw'

            if (!vapidPublicKey) {
                console.error("VAPID key missing")
                setIsLoading(false)
                return
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })

            const result = await subscribeUser(JSON.parse(JSON.stringify(subscription)))
            if (result.error) {
                console.error("Server subscription failed:", result.error)
                alert("Sunucuya kayıt yapılamadı: " + result.error)
                setIsLoading(false)
                return
            }
            setIsSubscribed(true)
            setShowModal(false) // Close modal if open
            alert("Bildirimler başarıyla açıldı!")
        } catch (error) {
            console.error("Subscription failed", error)
            alert("Bildirim izni alınamadı veya bir hata oluştu.")
        } finally {
            setIsLoading(false)
        }
    }

    const unsubscribe = async () => {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
            await subscription.unsubscribe()
            setIsSubscribed(false)
            alert("Bildirim aboneliği sıfırlandı.")
        }
    }

    return (
        <>
            {/* Header Button */}
            {isSubscribed ? (
                <button
                    onClick={unsubscribe}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                    <Bell size={16} />
                    <span className="hidden sm:inline">Bildirimler Aktif</span>
                </button>
            ) : (
                <button
                    onClick={subscribe}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                    <Bell size={16} />
                    <span className="hidden sm:inline">{isLoading ? 'Açılıyor...' : 'Bildirimleri Aç'}</span>
                </button>
            )}

            {/* Auto-Ask Modal */}
            {showModal && !isSubscribed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Bell className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Bildirimleri Aç</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Yeni görev atandığında veya tamamlandığında anında haberdar olmak için bildirimlere izin verin.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                                >
                                    Daha Sonra
                                </button>
                                <button
                                    onClick={subscribe}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Açılıyor...' : 'İzin Ver'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
