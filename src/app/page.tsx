import { redirect } from 'next/navigation';

// Proxy mengarahkan "/" sesuai sesi & role; ini hanya fallback.
export default function Home() {
  redirect('/login');
}
