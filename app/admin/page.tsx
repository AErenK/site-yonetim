import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { createTask, approveTask, deleteTask, extendTask } from "@/actions/task";
import { markAsRead } from "@/actions/notification";
import { Bell, CheckCircle, Clock, Plus, User, Trash2, RefreshCw } from "lucide-react";
import { PushManager } from "@/components/PushManager";
import { UserList } from "@/components/UserList";

export default async function AdminPage() {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") redirect("/");

    const employees = await prisma.user.findMany({
        where: { role: "EMPLOYEE" },
    });

    const tasks = await prisma.task.findMany({
        where: {
            OR: [
                { isPermanent: true },
                { expiresAt: { gt: new Date() } }
            ]
        },
        include: { assignedTo: true },
        orderBy: { createdAt: "desc" },
    });

    const notifications = await prisma.notification.findMany({
        where: { userId: session.id, read: false },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-white">Yönetici Paneli</h1>
                    <p className="text-slate-400">Hoş geldin, {session.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Bell className="text-slate-400" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                                {notifications.length}
                            </span>
                        )}
                    </div>
                    <PushManager />
                    <LogoutButton />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Görev Atama Formu */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Plus className="text-blue-500" /> Yeni Görev Ata
                        </h2>
                        <form action={async (formData) => {
                            'use server'
                            await createTask(formData)
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Çalışan Seç</label>
                                <select
                                    name="assignedToId"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="">Seçiniz...</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Site İsmi</label>
                                <input
                                    type="text"
                                    name="siteName"
                                    placeholder="Örn: Kartepe Konutları"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Görev Başlığı</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Örn: Asansör Bakımı"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Açıklama</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                ></textarea>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isPermanent"
                                    id="isPermanent"
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isPermanent" className="text-sm text-slate-400">
                                    Kalıcı Görev (30 gün sonra silinmesin)
                                </label>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                            >
                                Görevi Ata
                            </button>
                        </form>
                    </div>

                    {/* Çalışan Yönetimi */}
                    <UserList users={employees} />
                </div>

                {/* Görev Listesi ve Bildirimler */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Bildirimler (Onay Bekleyenler) */}
                    {notifications.length > 0 && (
                        <div className="bg-amber-900/20 border border-amber-900/50 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-amber-500 mb-4">Onay Bekleyen İşlemler</h2>
                            <div className="space-y-4">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <p className="text-slate-300">{notif.message}</p>
                                        <form action={async () => {
                                            'use server'
                                            await markAsRead(notif.id)
                                        }}>
                                            <button className="text-sm text-slate-500 hover:text-white">Okundu İşaretle</button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tüm Görevler */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-6">Son Görevler</h2>
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <div key={task.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-white">{task.title}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    task.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {task.status === 'PENDING' ? 'Bekliyor' :
                                                    task.status === 'COMPLETED' ? 'Onay Bekliyor' : 'Onaylandı'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">{task.siteName} - {task.assignedTo.name}</p>
                                        {task.cost && (
                                            <p className="text-sm text-emerald-400 mt-1">Masraf: {task.cost} TL ({task.costDescription})</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {task.status === 'COMPLETED' && (
                                            <form action={async () => {
                                                'use server'
                                                await approveTask(task.id)
                                            }}>
                                                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                                                    Onayla
                                                </button>
                                            </form>
                                        )}
                                        
                                        <form action={async () => {
                                            'use server'
                                            await extendTask(task.id)
                                        }}>
                                            <button title="Süreyi Uzat (30 Gün)" className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors">
                                                <RefreshCw size={16} />
                                            </button>
                                        </form>

                                        <form action={async () => {
                                            'use server'
                                            await deleteTask(task.id)
                                        }}>
                                            <button title="Görevi Sil" className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
