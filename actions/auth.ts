'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('Login attempt:', email, password)

    if (!email || !password) {
        return { error: 'Email ve şifre gerekli.' }
    }

    const user = await prisma.user.findUnique({
        where: { email },
    })

    console.log('User found:', user)

    if (!user || user.password !== password) {
        return { error: 'Geçersiz email veya şifre.' }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('userId', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    })

    if (user.role === 'ADMIN') {
        redirect('/admin')
    } else {
        redirect('/employee')
    }
}

export async function logout() {
    (await cookies()).delete('userId')
    redirect('/')
}

export async function getSession() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) return null

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
    })

    return user
}

export async function register(prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('Register attempt:', email)

    if (!name || !email || !password) {
        return { error: 'Tüm alanlar gerekli.' }
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        return { error: 'Bu email adresi zaten kayıtlı.' }
    }

    // İlk kullanıcı ise ADMIN yap, değilse EMPLOYEE
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'ADMIN' : 'EMPLOYEE'

    await prisma.user.create({
        data: {
            name,
            email,
            password,
            role,
        },
    })

    redirect('/')
}
