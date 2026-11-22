import type { Metadata } from 'next';
import Link from 'next/link';
import RegisterWa from '@/features/auth/components/RegisterWa';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export const metadata: Metadata = { title: 'Daftar' };

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-6 sm:p-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-8">
        <Logo size="lg" />
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Daftar</h2>
          <p className="text-sm text-muted-foreground">Verifikasi nomor WhatsApp Anda untuk membuat akun.</p>
        </div>
        <RegisterWa />
        <p className="border-t pt-6 text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
