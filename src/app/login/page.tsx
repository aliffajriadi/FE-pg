import type { Metadata } from 'next';
import LoginForm from '@/features/auth/components/LoginForm';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export const metadata: Metadata = { title: 'Masuk' };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Panel branding (desktop) */}
      <aside className="hidden flex-col justify-between bg-[#1d3557] p-12 text-white lg:flex">
        <Logo inverted size="lg" />

        <div className="max-w-sm space-y-4">
          <h1 className="text-3xl leading-snug font-semibold">Dashboard pembayaran QRIS untuk merchant.</h1>
          <p className="leading-relaxed text-white/70">
            Kelola invoice, pantau saldo, dan atur penarikan dana dari satu tempat.
          </p>
        </div>

        <p className="text-sm text-white/50">© {new Date().getFullYear()} AkuQRIS</p>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm space-y-8">
          <Logo size="lg" className="lg:hidden" />
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Masuk</h2>
            <p className="text-sm text-muted-foreground">Gunakan email dan kata sandi akun Anda.</p>
          </div>

          <LoginForm />

          <p className="border-t pt-6 text-sm text-muted-foreground">
            Belum punya akun atau lupa kata sandi? Hubungi admin AkuQRIS.
          </p>
        </div>
      </main>
    </div>
  );
}
