# Site Yönetim Sistemi

Bu proje, site yönetimleri için geliştirilmiş bir görev takip ve personel yönetim sistemidir.

## Özellikler

- **Yönetici Paneli:**
  - Personel ekleme ve yönetme
  - Görev atama (Kalıcı veya süreli)
  - Görev durumlarını takip etme (Bekleyen, Onay Bekleyen, Tamamlanan)
  - Bildirim sistemi
  - İstatistikler

- **Çalışan Paneli:**
  - Atanan görevleri görüntüleme
  - Görev tamamlama ve masraf girme
  - Bildirimler

## Kurulum ve Giriş Bilgileri

Sistem sıfırlandığında varsayılan yönetici hesabı oluşturulur:

- **Email:** `admin@kartepe.com`
- **Şifre:** `123`

> **Önemli:** İlk girişten sonra güvenliğiniz için şifrenizi değiştirmeniz önerilir (veya veritabanından güncellenmelidir).

## Teknolojiler

- Next.js 16
- Prisma & PostgreSQL
- Tailwind CSS
- Web Push Notifications

## Geliştirme

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

