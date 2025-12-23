import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { createTask, approveTask, deleteTask, extendTask } from "@/actions/task";
import { markAsRead } from "@/actions/notification";
import { Bell, CheckCircle, Clock, Plus, User, Trash2, RefreshCw, BarChart3, Users, CheckSquare } from "lucide-react";
import { PushManager } from "@/components/PushManager";
import { UserList } from "@/components/UserList";

export default async function AdminPage() {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") redirect("/");

    const employees = await prisma.user.findMany({
        where: { role: "EMPLOYEE" },
    });

    const totalTasks = await prisma.task.count();
    const pendingTasks = await prisma.task.count({ where: { status: "PENDING" } });
    const completedTasks = await prisma.task.count({ where: { status: "APPROVED" } });

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
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Yönetici Paneli</h1>
                    <p className="text-slate-400">Hoş geldin, {session.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Bell className="text-slate-400 hover:text-white transition-colors cursor-pointer" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white animate-pulse">
                                {notifications.length}
                            </span>
                        )}
                    </div>
                    <PushManager />
                    <LogoutButton />
                </div>
            </header>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Toplam Görev</h3>
                        <BarChart3 className="text-blue-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-white">{totalTasks}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Bekleyen</h3>
                        <Clock className="text-yellow-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-white">{pendingTasks}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Tamamlanan</h3>
                        <CheckSquare className="text-green-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-white">{completedTasks}</p>
                </div>
            </div>

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
                        }} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Çalışan Seç</label>
                                <div className="relative">
                                    <select
                                        name="assignedToId"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all appearance-none"
                                        required
                                    >
                                        <option value="">Personel Seçiniz...</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                    <User className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Site İsmi</label>
                                <input
                                    type="text"
                                    name="siteName"
                                    placeholder="Örn: Kartepe Konutları"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Görev Başlığı</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Örn: Asansör Bakımı"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Açıklama</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Görev detaylarını buraya giriniz..."
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isPermanent"
                                        id="isPermanent"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-600 bg-slate-800 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-slate-500"
                                    />
                                    <CheckCircle className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={12} />
                                </div>
                                <label htmlFor="isPermanent" className="text-sm text-slate-300 cursor-pointer select-none">
                                    Kalıcı Görev <span className="text-slate-500 text-xs block">(30 gün sonra otomatik silinmez)</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                                        {!task.isPermanent && task.expiresAt && (
                                            <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                                                <Clock size={12} />
                                                {(() => {
                                                    const now = new Date();
                                                    const diff = new Date(task.expiresAt).getTime() - now.getTime();
                                                    if (diff <= 0) return "Süresi doldu";
                                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                    if (days > 0) return `${days} gün kaldı`;
                                                    return `${hours} saat kaldı`;
                                                })()} sonra silinecek
                                            </p>
                                        )}
                                        {task.cost !== null && (
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
