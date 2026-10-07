import { redirect } from 'next/navigation';

// Landing page (features/landing/LandingPage.tsx) sementara disembunyikan.
// Untuk menampilkannya lagi: render <LandingPage /> di sini dan hapus redirect "/" di src/proxy.ts.
export default function Home() {
  redirect('/login');
}
