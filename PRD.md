# Product Requirements Document (PRD)
## Modernisasi Frontend Aplikasi Store

**Versi:** 1.0  
**Status:** Draft  
**Platform:** Web  
**Frontend:** Next.js + TypeScript  
**UI:** Tailwind CSS + shadcn/ui  
**State/API:** TanStack Query  
**Backend:** Existing Express API  
**Deployment:** Vercel

---

## 1. Overview

Project ini bertujuan melakukan modernisasi frontend aplikasi Store yang saat ini masih menggunakan arsitektur monolith, dengan memisahkan frontend dari backend tanpa melakukan perubahan besar terhadap API yang sudah digunakan oleh existing client.

Frontend baru akan dibangun menggunakan Next.js dan di-deploy ke Vercel, sedangkan backend/API tetap berjalan pada server existing.

### Arsitektur Target

```text
User
 │
 ▼
https://NEW-DOMAIN.com
 │
 ▼
Vercel
 │
 ▼
Next.js Frontend
 │
 │ HTTPS API Request
 ▼
https://OLD-DOMAIN.com/api/*
 │
 ▼
Existing Express Backend
 │
 ▼
Existing Database
```

Domain lama tetap dipertahankan untuk menjaga kompatibilitas API.

---

# 2. Problem Statement

Frontend dan backend saat ini masih berada dalam satu aplikasi monolith.

Kondisi tersebut menyebabkan:

- Frontend dan backend memiliki coupling yang tinggi.
- Perubahan UI membutuhkan deployment aplikasi monolith.
- Sulit melakukan redesign frontend secara bebas.
- Deployment frontend belum optimal untuk CDN/static delivery.
- Migrasi domain berpotensi mengganggu API yang sudah digunakan oleh client.

Oleh karena itu, frontend perlu dipisahkan tanpa memutus API existing.

---

# 3. Goals

### Primary Goals

1. Membuat frontend baru menggunakan Next.js.
2. Mempertahankan API existing tanpa perubahan breaking.
3. Memindahkan frontend ke domain baru.
4. Deploy frontend menggunakan Vercel.
5. Meningkatkan kualitas UI/UX.
6. Membuat struktur frontend yang lebih maintainable.
7. Memisahkan lifecycle frontend dan backend.

### Secondary Goals

- Mempermudah pengembangan fitur frontend.
- Mempermudah deployment.
- Memanfaatkan caching dan CDN Vercel.
- Memudahkan migrasi API di masa depan.

---

# 4. Non-Goals

Pada fase pertama, project **tidak bertujuan** untuk:

- Rewrite backend Express.
- Migrasi database.
- Memecah backend menjadi microservices.
- Mengubah endpoint API existing.
- Mengubah authentication system secara besar-besaran.
- Memindahkan API ke Vercel.
- Menghentikan domain lama.

---

# 5. Technology Stack

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui

## Data & API

- TanStack Query
- TanStack Table untuk data table kompleks
- Native Fetch API

## Form

- React Hook Form
- Zod
- @hookform/resolvers

## Utility

- Lucide React
- date-fns
- Sonner

## Optional

- Zustand untuk client/global state yang memang membutuhkan global store.

## Backend

- Existing Express API

## Deployment

- Vercel

## Package Manager

- pnpm

---

# 6. Target Architecture

```text
                    ┌─────────────────────┐
                    │       Vercel        │
                    │                     │
                    │     Next.js         │
                    │     Frontend        │
                    └──────────┬──────────┘
                               │
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │    Existing VPS     │
                    │                     │
                    │  Express API        │
                    │       │             │
                    │       ▼             │
                    │    Database         │
                    └─────────────────────┘
```

---

# 7. Domain Migration

## Existing

```text
old-domain.com
├── Frontend
└── /api/*
```

## Target

```text
new-domain.com
└── Next.js Frontend

old-domain.com
└── /api/*
```

Frontend baru menggunakan:

```text
https://new-domain.com
```

API tetap:

```text
https://old-domain.com/api/*
```

---

# 8. Legacy Domain Behavior

Domain lama tidak langsung dimatikan.

Request API:

```text
GET old-domain.com/api/products
```

tetap diteruskan ke existing backend.

Request frontend:

```text
old-domain.com/
old-domain.com/login
old-domain.com/dashboard
```

akan diarahkan ke domain baru:

```text
new-domain.com/
new-domain.com/login
new-domain.com/dashboard
```

Tujuannya adalah menjaga backward compatibility terhadap client yang masih menggunakan API lama.

---

# 9. Frontend Requirements

## 9.1 Landing / Home

Frontend harus menyediakan halaman utama aplikasi.

Requirements:

- Responsive.
- Mobile friendly.
- Desktop friendly.
- Loading state.
- Error state.
- Empty state jika diperlukan.

---

## 9.2 Authentication

Frontend harus menyediakan:

- Login.
- Logout.
- Session handling.
- Authentication state.
- Protected routes/pages.

Authentication harus tetap kompatibel dengan sistem backend existing.

---

## 9.3 Dashboard

Dashboard menyediakan ringkasan informasi utama aplikasi.

Contoh:

- Total order.
- Total produk.
- Total revenue.
- Status transaksi.
- Recent activity.

Data diambil melalui API existing.

---

## 9.4 Product Management

User yang memiliki permission harus dapat:

- Melihat produk.
- Search produk.
- Filter produk.
- Sorting.
- Pagination.
- Melihat detail produk.
- Membuat produk.
- Edit produk.
- Delete produk.

Untuk data yang kompleks dapat menggunakan TanStack Table.

---

## 9.5 Order Management

User dapat:

- Melihat order.
- Melihat detail order.
- Filter berdasarkan status.
- Search order.
- Sorting.
- Pagination.
- Melihat informasi customer.
- Melihat item order.
- Melihat status pembayaran.

---

# 10. API Integration

Frontend tidak mengakses database secara langsung.

Semua data harus melalui API.

```text
Next.js
   │
   ▼
API Client
   │
   ▼
Existing Express API
```

API client harus memiliki centralized configuration.

Contoh:

```text
src/
└── lib/
    └── api/
        ├── client.ts
        ├── auth.ts
        ├── products.ts
        ├── orders.ts
        └── users.ts
```

---

# 11. Environment Variables

Development:

```env
NEXT_PUBLIC_API_URL=http://localhost:2000/api
```

Production:

```env
NEXT_PUBLIC_API_URL=https://old-domain.com/api
```

Environment variable production dikonfigurasi melalui Vercel.

Secret backend tidak boleh menggunakan prefix:

```text
NEXT_PUBLIC_
```

karena variable tersebut dapat terekspos ke browser.

---

# 12. Data Fetching

TanStack Query digunakan untuk server state.

Contoh:

```text
GET /products
        ↓
TanStack Query
        ↓
React Component
```

Requirements:

- Loading state.
- Error state.
- Cache.
- Refetch.
- Mutation.
- Query invalidation.
- Optimistic update jika memang diperlukan.

---

# 13. Form Handling

Form menggunakan:

```text
React Hook Form
       +
Zod
```

Flow:

```text
User Input
    ↓
React Hook Form
    ↓
Zod Validation
    ↓
API Request
    ↓
Success / Error
```

Frontend harus melakukan validation sebelum request dikirim.

Backend tetap menjadi sumber validasi utama dan security boundary.

---

# 14. UI/UX Requirements

UI menggunakan shadcn/ui dan Tailwind CSS.

Komponen harus memiliki:

- Responsive layout.
- Consistent spacing.
- Consistent typography.
- Loading state.
- Error state.
- Empty state.
- Confirmation dialog untuk destructive action.
- Toast notification untuk action penting.

Contoh:

```text
Create Product
      ↓
Success
      ↓
Toast: "Product berhasil dibuat"
```

Untuk destructive action:

```text
Delete Product
      ↓
Confirmation Dialog
      ↓
Confirm
      ↓
API
```

---

# 15. Responsive Requirements

Frontend harus mendukung minimal:

### Mobile

```text
320px+
```

### Tablet

```text
768px+
```

### Desktop

```text
1024px+
```

Dashboard harus tetap usable pada mobile, terutama navigation dan table.

---

# 16. Project Structure

Struktur awal:

```text
src/
├── app/
│   ├── login/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── products/
│   │   └── orders/
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── products/
│   ├── orders/
│   └── users/
│
├── lib/
│   ├── api/
│   ├── validations/
│   └── utils.ts
│
├── providers/
│   └── query-provider.tsx
│
└── types/
```

Feature-specific logic sebaiknya ditempatkan di dalam `features`.

---

# 17. Security

Frontend tidak boleh:

- Menyimpan database credential.
- Menyimpan API secret di client.
- Menganggap frontend validation sebagai security.
- Mengekspos credential backend.

Semua authorization tetap dilakukan oleh backend.

CORS backend harus mengizinkan domain frontend baru:

```text
https://new-domain.com
```

Selama masa migrasi, domain lama dapat tetap diizinkan jika masih diperlukan oleh existing client.

---

# 18. Performance

Frontend harus memanfaatkan:

- Next.js optimization.
- Code splitting.
- Lazy loading jika diperlukan.
- Image optimization.
- Caching TanStack Query.
- CDN Vercel.
- Minimal client-side JavaScript jika memungkinkan.

Tidak semua component harus menggunakan `"use client"`.

Gunakan Server Component secara default dan Client Component hanya ketika membutuhkan interactivity/browser API/state.

---

# 19. Deployment

Repository:

```text
GitHub
    ↓
Vercel
    ↓
Production
```

Setiap push ke branch production akan melakukan deployment.

Preview deployment digunakan untuk testing sebelum production.

Environment:

```text
Development
Preview
Production
```

---

# 20. Migration Strategy

Migrasi dilakukan secara bertahap.

### Phase 1 — Foundation

- Setup Next.js.
- Setup TypeScript.
- Setup Tailwind.
- Setup shadcn.
- Setup TanStack Query.
- Setup API client.
- Setup environment variables.

### Phase 2 — Authentication

- Login.
- Logout.
- Session.
- Protected route.

### Phase 3 — Core Features

Migrasi fitur utama:

```text
Products
Orders
Users
Dashboard
```

### Phase 4 — Testing

Testing:

- API integration.
- Authentication.
- Responsive UI.
- Browser compatibility.
- Error handling.
- Loading state.
- Permission/authorization.

### Phase 5 — Deployment

Deploy ke Vercel menggunakan temporary domain.

Contoh:

```text
project.vercel.app
```

### Phase 6 — Custom Domain

Hubungkan:

```text
new-domain.com
```

ke Vercel.

### Phase 7 — Legacy Redirect

Domain lama:

```text
old-domain.com/*
```

diatur agar:

```text
/api/*
```

tetap menuju backend.

Route frontend diarahkan ke:

```text
new-domain.com
```

---

# 21. Backward Compatibility

Existing API consumer tidak boleh mengalami breaking change pada fase migrasi.

Contoh endpoint:

```text
old-domain.com/api/products
old-domain.com/api/orders
old-domain.com/api/users
```

harus tetap tersedia.

Perubahan endpoint API dilakukan pada fase terpisah.

---

# 22. Acceptance Criteria

Project dianggap berhasil apabila:

- [ ] Next.js application berjalan secara lokal.
- [ ] Frontend dapat mengakses existing API.
- [ ] Authentication berjalan.
- [ ] CORS telah dikonfigurasi.
- [ ] Fitur utama telah dimigrasikan.
- [ ] Responsive pada mobile dan desktop.
- [ ] Loading/error/empty state tersedia.
- [ ] Tidak ada API breaking change.
- [ ] Frontend berhasil di-deploy ke Vercel.
- [ ] Custom domain berhasil digunakan.
- [ ] Domain lama masih dapat melayani API.
- [ ] Existing API client tetap berjalan.
- [ ] Frontend lama dapat diarahkan ke frontend baru.

---

# 23. Future Improvements

Setelah migrasi frontend stabil:

1. API dapat dipindahkan ke subdomain baru:

```text
api.new-domain.com
```

2. API versioning:

```text
/api/v1/*
/api/v2/*
```

3. Backend dapat dipisahkan dari monolith jika memang diperlukan.

4. Authentication dapat diperbaiki jika dibutuhkan.

5. Automated testing dapat ditambahkan.

6. CI/CD dapat dikembangkan lebih lanjut.

---

# 24. Definition of Done

Satu fitur dianggap selesai apabila:

- UI sudah responsive.
- API integration berjalan.
- Validation tersedia.
- Loading state tersedia.
- Error state tersedia.
- Permission diperiksa oleh backend.
- Tidak ada console error yang tidak diperlukan.
- Tidak ada TypeScript error.
- ESLint berjalan tanpa error.
- Sudah diuji pada desktop dan mobile.
- Sudah diuji pada environment preview.
- Tidak menyebabkan regression terhadap fitur existing.

---

# 25. Prinsip Utama Project

> **Frontend boleh berubah total, API jangan rusak.**

Migrasi dilakukan dengan memisahkan frontend terlebih dahulu tanpa mengganggu backend production.

Target akhir:

```text
                  ┌────────────────────┐
                  │      Vercel        │
                  │                    │
                  │      Next.js       │
                  │                    │
                  │    new-domain.com  │
                  └─────────┬──────────┘
                            │
                            │ API
                            ▼
                  ┌────────────────────┐
                  │        VPS         │
                  │                    │
                  │   Express API      │
                  │                    │
                  │ old-domain.com/api  │
                  └─────────┬──────────┘
                            │
                            ▼
                         Database
```

Dengan pendekatan ini, frontend dapat dikembangkan dan di-deploy secara independen, sementara API existing tetap berjalan untuk seluruh client yang sudah menggunakannya.