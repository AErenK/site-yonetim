'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function resetSystem() {
    try {
        // Delete all data except the admin user if possible, or just delete everything and recreate admin
        // For simplicity and safety in this specific request, we'll do what seed does.
        
        await prisma.pushSubscription.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.task.deleteMany();
        
        // We keep the users for now, or delete employees?
        // User asked to "delete users" (kullanıcıları sil).
        // So we delete employees.
        await prisma.user.deleteMany({
            where: { role: 'EMPLOYEE' }
        });

        revalidatePath('/');
        return { success: true, message: "Sistem başarıyla sıfırlandı." };
    } catch (error) {
        console.error("Reset error:", error);
        return { error: "Sistem sıfırlanırken bir hata oluştu." };
    }
}
