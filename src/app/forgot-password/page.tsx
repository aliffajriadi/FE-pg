import type { Metadata } from 'next';
import Link from 'next/link';
import RegisterWa from '@/features/auth/components/RegisterWa';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export const metadata: Metadata = { title: 'Lupa Kata Sandi' };

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-6 sm:p-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-8">
        <Logo size="lg" />
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Lupa Kata Sandi</h2>
          <p className="text-sm text-muted-foreground">Verifikasi nomor WhatsApp akun Anda, lalu buat kata sandi baru.</p>
        </div>
        <RegisterWa mode="reset" />
        <p className="border-t pt-6 text-sm text-muted-foreground">
          Ingat kata sandi?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
