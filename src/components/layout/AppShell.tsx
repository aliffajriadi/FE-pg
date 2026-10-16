'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  FolderPlus,
  Code2,
  UserRound,
  BookOpen,
  BookMarked,
  LifeBuoy,
  Wallet,
  ClipboardList,
  FileText,
  FlaskConical,
  Headphones,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  QrCode,
  Settings,
  Download,
  CreditCard,
  KeyRound,
  Smartphone,
  Store,
  Trophy,
  Users,
  Webhook,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '@/components/shared/Logo';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { TierBadge } from '@/components/shared/TierBadge';
import { ProfileDialog } from './ProfileDialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLogout, useMe } from '@/features/auth/hooks';
import { adminSupportApi } from '@/lib/api/support';
import { merchantApi } from '@/lib/api/merchant';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  /** Judul kelompok yang tampil di atas item ini (item pertama tiap kelompok). */
  group?: string;
  icon: LucideIcon;
  badge?: number;
  /** Buka di tab baru (di luar panel) */
  external?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Ikhtisar', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/stores', label: 'Toko / Merchant', icon: Store },
  { href: '/admin/tracking', label: 'Tracking Transaksi', icon: Trophy },
  { href: '/admin/transactions', label: 'Riwayat Transaksi', icon: FileText },
  { href: '/admin/withdrawals', label: 'Penarikan Saldo', icon: Banknote },
  { href: '/admin/bank-accounts', label: 'Rekening Bank', icon: Landmark },
  { href: '/admin/qris', label: 'Daftar QRIS', icon: QrCode },
  { href: '/admin/integrations', label: 'Integrasi Merchant', icon: Plug },
  { href: '/admin/mypg', label: 'MyPG Merchant', icon: Smartphone },
  { href: '/admin/mypg/licenses', label: 'Lisensi MyPG', icon: KeyRound },
  { href: '/admin/mypg/app', label: 'Aplikasi MyPG', icon: Download },
  { href: '/admin/project-requests', label: 'Pengajuan Proyek', icon: FolderPlus },
  { href: '/admin/settings', label: 'Pengaturan Sistem', icon: Settings },
  { href: '/admin/guides', label: 'Tata Cara', icon: BookMarked },
  { href: '/admin/logs', label: 'Log Aktivitas', icon: ClipboardList },
  { href: '/admin/webhook-logs', label: 'Log Webhook Merchant', icon: Webhook },
  { href: '/admin/support', label: 'Support Tiket', icon: Headphones },
];

const MERCHANT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Transaksi', icon: FileText },
  { href: '/dashboard/withdrawals', label: 'Tarik Saldo', icon: Wallet },
  { href: '/dashboard/bank-accounts', label: 'Rekening Saya', icon: Landmark },
  { href: '/dashboard/settings', label: 'Integrasi API', icon: Code2 },
  { href: '/dashboard/sandbox', label: 'Sandbox', icon: FlaskConical },
  { href: '/dashboard/account', label: 'Akun Saya', icon: UserRound },
  { href: '/dashboard/guides', label: 'Tata Cara', icon: BookMarked },
  { href: '/dashboard/support', label: 'Bantuan / Support', icon: LifeBuoy },
  { href: '/docs', label: 'Dokumentasi API', icon: BookOpen, external: true },
];

// Panel MyPG: hanya untuk toko dengan akses MyPG, terpisah dari menu live
const MYPG_NAV: NavItem[] = [
  { href: '/dashboard/mypg', label: 'Beranda', icon: LayoutDashboard, group: 'MyPG' },
  { href: '/dashboard/mypg/orders', label: 'Transaksi', icon: FileText },
  { href: '/dashboard/mypg/devices', label: 'Perangkat & QRIS', icon: Smartphone, group: 'Pengaturan' },
  { href: '/dashboard/mypg/settings', label: 'Pengaturan MyPG', icon: Settings },
  { href: '/dashboard/mypg/billing', label: 'Billing & Lisensi', icon: CreditCard },
  { href: '/dashboard/mypg/integration', label: 'Integrasi API', icon: Code2, group: 'Developer' },
  { href: '/dashboard/mypg/sandbox', label: 'Sandbox', icon: FlaskConical },
  { href: '/docs/mypg', label: 'Dokumentasi API', icon: BookOpen, external: true },
  { href: '/dashboard/mypg/guides', label: 'Tata Cara', icon: BookMarked, group: 'Bantuan' },
];

export function AppShell({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);
  const { data: me } = useMe();
  const logout = useLogout();
  const isAdmin = role === 'ADMIN';

  const { data: openTickets } = useQuery({
    queryKey: ['admin-support-open-count'],
    queryFn: adminSupportApi.getOpenCount,
    select: (res) => res.data.count,
    enabled: isAdmin,
    refetchInterval: 60 * 1000,
  });

  const { data: merchantTier } = useQuery({
    queryKey: ['merchant-stats'],
    queryFn: merchantApi.getStats,
    select: (res) => res.data.tier.current,
    enabled: !isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const hasMypg = !isAdmin && !!me?.store?.mypgEnabled;
  const inMypg = !isAdmin && pathname.startsWith('/dashboard/mypg');
  const navItems = (isAdmin ? ADMIN_NAV : inMypg ? MYPG_NAV : MERCHANT_NAV).map((item) =>
    item.href === '/admin/support' ? { ...item, badge: openTickets } : item
  );
  const rootHref = isAdmin ? '/admin' : inMypg ? '/dashboard/mypg' : '/dashboard';
  // Item dengan path lebih spesifik menang (mis. /admin/mypg/licenses tidak ikut menyalakan /admin/mypg)
  const isActive = (href: string) =>
    href === rootHref
      ? pathname === href
      : pathname.startsWith(href) &&
        !navItems.some((item) => item.href.length > href.length && item.href.startsWith(href) && pathname.startsWith(item.href));

  const user = me?.user;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <Logo />
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        >
          <X />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {(hasMypg || inMypg) && (
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium" role="tablist" aria-label="Pilih panel">
            {[
              { href: '/dashboard', label: 'Live', icon: Store, active: !inMypg },
              { href: '/dashboard/mypg', label: 'MyPG', icon: Smartphone, active: inMypg },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                role="tab"
                aria-selected={tab.active}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 whitespace-nowrap transition-colors',
                  tab.active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </Link>
            ))}
          </div>
        )}
        {!navItems[0]?.group && (
          <p className="px-3 pt-2 pb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {isAdmin ? 'Administrasi' : 'Merchant'}
          </p>
        )}
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Fragment key={item.href}>
              {item.group && (
                <p className={cn('px-3 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase', index === 0 ? 'pt-2' : 'pt-4')}>
                  {item.group}
                </p>
              )}
              <Link
                href={item.href}
                target={item.external ? '_blank' : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {!!item.badge && (
                  <span className="rounded-full bg-destructive px-1.5 text-xs font-semibold text-white">{item.badge}</span>
                )}
              </Link>
            </Fragment>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t p-4">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setProfileOpen(true);
          }}
          className="-m-1.5 flex min-w-0 flex-1 items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-muted"
          title="Lihat profil"
        >
          <UserAvatar name={user?.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user?.name ?? '...'}</span>
            {merchantTier ? (
              <TierBadge tier={merchantTier} className="mt-0.5 px-2 py-0 text-[11px]" />
            ) : (
              <span className="block truncate text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Merchant'}</span>
            )}
          </span>
        </button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={() => setConfirmLogout(true)} title="Keluar" aria-label="Keluar">
          <LogOut />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">{sidebar}</aside>

      {/* Sidebar mobile (drawer) */}
      {/* Selalu dirender agar transisi buka/tutup bisa dianimasikan */}
      <div className={cn('fixed inset-0 z-40 md:hidden', !mobileOpen && 'pointer-events-none')} aria-hidden={!mobileOpen}>
        <div
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          inert={!mobileOpen}
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85%] bg-card shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebar}
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-card px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
            <Menu />
          </Button>
          <Logo />
          {inMypg && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">MyPG</span>}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        store={me?.store}
        tier={merchantTier}
        onLogout={() => {
          setProfileOpen(false);
          setConfirmLogout(true);
        }}
      />

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Autoko?</AlertDialogTitle>
            <AlertDialogDescription>Anda perlu masuk kembali untuk mengakses dashboard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button variant="destructive" onClick={logout}>
              Ya, keluar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
