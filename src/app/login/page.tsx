import type { Metadata } from 'next';
import LoginForm from '@/features/auth/components/LoginForm';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export const metadata: Metadata = { title: 'Masuk' };

/** Latar dekoratif panel branding: cahaya biru, grid tipis, dan finder pattern QR di pojok kanan bawah. */
function BrandPattern() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Cahaya latar */}
      <div className="absolute -top-40 -right-40 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(69,123,157,0.45),transparent_70%)]" />

      {/* Grid tipis, memudar dari pojok kanan bawah ke arah teks */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at 100% 100%, black 10%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 100% 100%, black 10%, transparent 65%)',
        }}
      />

      {/* Finder pattern QR (outline), terpotong di pojok */}
      <svg
        viewBox="0 0 140 140"
        fill="none"
        stroke="white"
        className="absolute -right-24 -bottom-24 size-[26rem] opacity-[0.09]"
      >
        <rect x="5" y="5" width="130" height="130" rx="22" strokeWidth="2" />
        <rect x="25" y="25" width="90" height="90" rx="14" strokeWidth="1.5" />
        <rect x="45" y="45" width="50" height="50" rx="8" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/** Motif sisi form: cahaya lembut dan grid tipis, mengikuti warna tema (terang/gelap). */
function FormPattern() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Cahaya latar */}
      <div className="absolute -bottom-48 -left-48 size-[32rem] rounded-full bg-primary/10 blur-3xl" />

      {/* Grid tipis, memudar dari pojok kanan atas */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at 100% 0%, black 5%, transparent 55%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 100% 0%, black 5%, transparent 55%)',
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Panel branding (desktop) */}
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-[#1d3557] p-12 text-white lg:flex">
        <BrandPattern />

        <Logo inverted size="lg" />

        <div className="max-w-sm space-y-4">
          <h1 className="text-3xl leading-snug font-semibold">Dashboard bot otomatis Anda.</h1>
          <p className="leading-relaxed text-white/70">
            Kelola pesanan, Cek pembelian, Laporan Penjualan dalam 1 dashboard terintegrasi.
          </p>
        </div>

        <p className="text-sm text-white/50">© {new Date().getFullYear()} Autoko</p>
      </aside>

      {/* Form */}
      <main className="relative isolate flex items-center justify-center overflow-hidden bg-background p-6 sm:p-10">
        <FormPattern />

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
            Belum punya akun atau lupa kata sandi? Hubungi admin Autoko.
          </p>
        </div>
      </main>
    </div>
  );
}
