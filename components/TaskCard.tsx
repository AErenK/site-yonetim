'use client'

import { completeTask } from "@/actions/task"
import { useState } from "react"
import { CheckCircle, Clock, MapPin, AlertCircle } from "lucide-react"

type Task = {
    id: string
    title: string
    description: string | null
    status: string
    siteName: string | null
    cost: number | null
    costDescription: string | null
    createdAt: Date
}

export function TaskCard({ task }: { task: Task }) {
    const [isCompleting, setIsCompleting] = useState(false)

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin size={14} />
                        <span>{task.siteName}</span>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        task.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                    }`}>
                    {task.status === 'PENDING' ? 'Yapılacak' :
                        task.status === 'COMPLETED' ? 'Onay Bekliyor' : 'Tamamlandı'}
                </span>
            </div>

            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                {task.description || "Açıklama yok."}
            </p>

            {task.status === 'PENDING' && !isCompleting && (
                <button
                    onClick={() => setIsCompleting(true)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <CheckCircle size={18} />
                    Görevi Tamamla
                </button>
            )}

            {isCompleting && (
                <form action={async (formData) => {
                    try {
                        const result = await completeTask(task.id, formData)
                        if (result?.error) {
                            alert(result.error)
                        } else {
                            setIsCompleting(false)
                        }
                    } catch (e) {
                        console.error(e)
                        alert("Bir hata oluştu. Lütfen tekrar deneyin.")
                    }
                }} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-medium text-white mb-3">Tamamlama Detayları</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Masraf Tutarı (Varsa)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="cost"
                                    placeholder="0"
                                    step="0.01"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                                <span className="absolute right-3 top-2 text-slate-500 text-sm">TL</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Masraf Açıklaması / Not</label>
                            <textarea
                                name="costDescription"
                                placeholder="Örn: Ampul değişti, 500TL"
                                rows={2}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            ></textarea>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCompleting(false)}
                                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors"
                            >
                                Kaydet ve Gönder
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {task.status !== 'PENDING' && task.cost && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <AlertCircle size={14} />
                        <span>Masraf: {task.cost} TL - {task.costDescription}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
