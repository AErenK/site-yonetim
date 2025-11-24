'use client'

import { logout } from "@/actions/auth"
import { LogOut } from "lucide-react"

export function LogoutButton() {
    return (
        <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
        >
            <LogOut size={16} />
            Çıkış Yap
        </button>
    )
}
