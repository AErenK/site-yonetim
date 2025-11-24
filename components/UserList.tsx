'use client'

import { deleteUser } from "@/actions/user"
import { Trash2 } from "lucide-react"

export function UserList({ users }: { users: any[] }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm mt-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Trash2 className="text-red-500" /> Çalışan Yönetimi
            </h2>
            <div className="space-y-3">
                {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        <form action={async () => {
                            if (confirm(`${user.name} adlı çalışanı silmek istediğinize emin misiniz?`)) {
                                const result = await deleteUser(user.id)
                                if (result.error) alert(result.error)
                            }
                        }}>
                            <button className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Sil">
                                <Trash2 size={16} />
                            </button>
                        </form>
                    </div>
                ))}
                {users.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-4">Kayıtlı çalışan bulunmuyor.</p>
                )}
            </div>
        </div>
    )
}
