'use client'

import { login } from "@/actions/auth";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/actions/auth";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        if (session.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/employee');
        }
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz</h1>
          <p className="text-slate-300">Site Yönetim Sistemi Girişi</p>
        </div>

        <form action={action} className="space-y-6">
          {state?.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {state.error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Adresi</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="admin@kartepe.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Şifre</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/register" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Hesabınız yok mu? Kayıt Olun
          </a>
        </div>
      </div>
    </div>
  );
}
