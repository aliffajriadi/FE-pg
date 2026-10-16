'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import { mypgApi } from '@/lib/api/mypg';
import { formatDate } from '@/lib/utils';
import { useMe } from '@/features/auth/hooks';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IntegrationClientProvider } from '@/features/merchant/settings/integration-client';

/** Peringatan di semua halaman MyPG bila lisensi tidak aktif atau berakhir dalam 7 hari. */
function LicenseBanner() {
  const { data } = useQuery({ queryKey: ['mypg-billing'], queryFn: mypgApi.getBilling, select: (res) => res.data, staleTime: 60_000 });
  if (!data || (data.active && data.daysLeft > 7)) return null;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
        data.active ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300' : 'border-destructive/40 bg-destructive/10 text-destructive'
      }`}
    >
      <AlertTriangle className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        {data.active ? (
          <>
            Lisensi MyPG tinggal <strong>{data.daysLeft} hari</strong>
            <span className="hidden sm:inline"> (berakhir {formatDate(data.activeUntil!, false)})</span>.
          </>
        ) : (
          <>
            <strong>Lisensi MyPG tidak aktif.</strong>
            <span className="hidden sm:inline"> Invoice baru ditolak sampai Anda memasukkan kode lisensi.</span>
          </>
        )}
      </p>
      <Link href="/dashboard/mypg/billing" className={buttonVariants({ size: 'xs', variant: data.active ? 'outline' : 'default' })}>
        {data.active ? 'Perpanjang' : 'Aktifkan'}
      </Link>
    </div>
  );
}

/** Panel MyPG hanya untuk merchant yang diberi akses admin. Semua halaman di dalamnya memakai data MyPG. */
export function MypgGuard({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return (
      <p className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat...
      </p>
    );
  }

  if (!me?.store?.mypgEnabled) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-3 py-6 text-center">
          <Lock className="mx-auto size-10 text-muted-foreground" />
          <p className="text-lg font-semibold">Panel MyPG belum aktif</p>
          <p className="text-sm text-muted-foreground">
            MyPG memungkinkan Anda menerima pembayaran langsung ke QRIS sendiri. Hubungi admin untuk mengaktifkan akses.
          </p>
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            Kembali ke Dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <IntegrationClientProvider scope="mypg">
      <LicenseBanner />
      {children}
    </IntegrationClientProvider>
  );
}
