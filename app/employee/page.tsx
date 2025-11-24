import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { TaskCard } from "@/components/TaskCard";
import { Bell } from "lucide-react";
import { markAsRead } from "@/actions/notification";
import { PushManager } from "@/components/PushManager";

export default async function EmployeePage() {
    const session = await getSession();
    if (!session || session.role !== "EMPLOYEE") redirect("/");

    const tasks = await prisma.task.findMany({
        where: { assignedToId: session.id },
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
                    <h1 className="text-3xl font-bold text-white">Çalışan Paneli</h1>
                    <p className="text-slate-400">İyi çalışmalar, {session.name}</p>
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

            {notifications.length > 0 && (
                <div className="mb-8 bg-blue-900/20 border border-blue-900/50 rounded-xl p-4">
                    <h3 className="text-blue-400 font-medium mb-2">Yeni Bildirimler</h3>
                    <div className="space-y-2">
                        {notifications.map((notif) => (
                            <div key={notif.id} className="flex justify-between items-center text-sm text-slate-300">
                                <span>{notif.message}</span>
                                <form action={async () => {
                                    'use server'
                                    await markAsRead(notif.id)
                                }}>
                                    <button className="text-blue-500 hover:text-blue-400">Okundu</button>
                                </form>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}

                {tasks.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        Henüz atanmış bir görev bulunmuyor.
                    </div>
                )}
            </div>
        </div>
    );
}
