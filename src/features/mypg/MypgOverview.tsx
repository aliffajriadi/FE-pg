'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, QrCode, Smartphone, Wallet } from 'lucide-react';
import { MYPG_PROVIDER_LABEL, mypgApi } from '@/lib/api/mypg';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PageHeader } from '@/components/shared/PageHeader';
import { CreateMypgOrderDialog } from './CreateMypgOrderDialog';

const chartConfig = { totalAmount: { label: 'Penjualan', color: 'var(--chart-5)' } } satisfies ChartConfig;

function SetupChecklist({ licensed, hasQris, hasDevice, online }: { licensed: boolean; hasQris: boolean; hasDevice: boolean; online: boolean }) {
  const items = [
    { done: licensed, label: 'Aktifkan lisensi MyPG', href: '/dashboard/mypg/billing' },
    { done: hasQris, label: 'Tambahkan QRIS milik Anda', href: '/dashboard/mypg/devices' },
    { done: hasDevice, label: 'Daftarkan HP & pasang APK', href: '/dashboard/mypg/devices' },
    { done: online, label: 'Pastikan HP online', href: '/dashboard/mypg/devices' },
  ];
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;

  return (
    <Card className="border-amber-500/40 bg-amber-500/5" size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          <p className="flex-1 font-medium">Lengkapi pengaturan agar pembayaran terdeteksi otomatis</p>
          <span className="text-xs font-medium text-muted-foreground">
            {doneCount}/{items.length} selesai
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-amber-500/15">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) =>
            item.done ? (
              <li key={item.label} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> {item.label}
              </li>
            ) : (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-background px-2.5 py-2 text-sm font-medium transition-colors hover:border-amber-500"
                >
                  <Clock className="size-4 shrink-0 text-amber-600" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value, hint, tone }: { icon: typeof Wallet; label: string; value: string; hint: string; tone?: 'good' | 'bad' }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </p>
        <p className="truncate text-lg font-bold sm:text-xl" title={value}>
          {value}
        </p>
        <p className={`truncate text-xs ${tone === 'bad' ? 'text-destructive' : tone === 'good' ? 'text-emerald-600' : 'text-muted-foreground'}`}>{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function MypgOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mypg-summary'],
    queryFn: mypgApi.getSummary,
    select: (res) => res.data,
    refetchInterval: 30_000,
  });

  const onlineCount = data?.devices.filter((d) => d.isActive && d.isOnline).length ?? 0;

  return (
    <>
      <PageHeader title="Beranda MyPG" description="Pembayaran masuk langsung ke QRIS Anda sendiri, terpisah dari saldo dashboard live.">
        <CreateMypgOrderDialog />
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : error || !data ? (
        <Card>
          <CardContent className="text-destructive">Gagal memuat data: {error?.message}</CardContent>
        </Card>
      ) : (
        <>
          <SetupChecklist licensed={data.licenseActive} hasQris={!!data.activeQris} hasDevice={data.devices.length > 0} online={onlineCount > 0} />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={Wallet} label="Penjualan Hari Ini" value={formatCurrency(data.todayVolume)} hint={`${data.todayCount} transaksi`} />
            <Stat icon={Clock} label="Menunggu Bayar" value={formatCurrency(data.pendingAmount)} hint={`${data.pendingCount} invoice`} />
            <Stat
              icon={QrCode}
              label="QRIS Aktif"
              value={data.activeQris?.name ?? 'Belum ada'}
              hint={data.activeQris ? MYPG_PROVIDER_LABEL[data.activeQris.provider] : 'Tambahkan QRIS'}
              tone={data.activeQris ? undefined : 'bad'}
            />
            <Stat
              icon={Smartphone}
              label="HP Online"
              value={`${onlineCount} dari ${data.devices.length}`}
              hint={onlineCount ? 'Siap menerima pembayaran' : 'Tidak ada HP online'}
              tone={onlineCount ? 'good' : 'bad'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Penjualan MyPG (7 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={data.chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickFormatter={(v: number) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(v)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span>
                            Penjualan: <strong>{formatCurrency(Number(value))}</strong>
                          </span>
                        )}
                      />
                    }
                  />
                  <Area dataKey="totalAmount" type="monotone" stroke="var(--color-totalAmount)" fill="var(--color-totalAmount)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
              <p className="mt-3 text-sm text-muted-foreground">
                Total sepanjang waktu: <strong>{formatCurrency(data.paidVolume)}</strong> dari {data.paidCount.toLocaleString('id-ID')} transaksi.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
