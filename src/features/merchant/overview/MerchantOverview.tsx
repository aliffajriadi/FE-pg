'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowUpRight, Info } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useMe } from '@/features/auth/hooks';
import { formatCurrency } from '@/lib/utils';
import { statusLabel } from '@/lib/status';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PageHeader } from '@/components/shared/PageHeader';
import { useInvoiceLimits } from '@/hooks/use-invoice-limits';
import { CreateOrderDialog } from '../orders/CreateOrderDialog';

const salesChartConfig = { totalAmount: { label: 'Penjualan', color: 'var(--chart-5)' } } satisfies ChartConfig;

// Urutan label dari backend: Berhasil, Pending, Gagal/Batal
const statusChartConfig = {
  s0: { label: 'Berhasil', color: 'var(--chart-1)' },
  s1: { label: 'Pending', color: 'var(--chart-2)' },
  s2: { label: 'Gagal/Batal', color: 'var(--chart-4)' },
} satisfies ChartConfig;

function Stat({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${className ?? ''}`}>{value}</p>
    </div>
  );
}

export default function MerchantOverview() {
  const { data: me } = useMe();
  const { dailyTxLimit, dailyTxUsed } = useInvoiceLimits();
  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: merchantApi.getDashboard,
    select: (res) => res.data,
  });

  const store = me?.store;
  const holdHours = data?.balanceHoldHours ?? 48;
  const donutData = (data?.donutChartData.data ?? []).map((value, i) => ({ key: `s${i}`, value }));
  const hasOrders = donutData.some((d) => d.value > 0);

  return (
    <>
      <PageHeader title="Beranda" description={store ? store.name : 'Ringkasan saldo dan transaksi toko Anda.'} />

      {store && store.status !== 'APPROVED' && (
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Status toko Anda <strong>{statusLabel(store.status)}</strong>. Pembuatan invoice hanya bisa dilakukan setelah toko
            disetujui admin.
          </span>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-44 rounded-xl" />
      ) : error || !data ? (
        <Card>
          <CardContent className="text-destructive">Gagal memuat data beranda: {error?.message}</CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-t-4 border-t-primary">
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Tersedia</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(data.availableBalance)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/dashboard/withdrawals" className={buttonVariants({ size: 'lg' })}>
                    <ArrowUpRight /> Tarik Saldo
                  </Link>
                  <CreateOrderDialog variant="outline" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-4 lg:grid-cols-4">
                <Stat label={`Saldo Tertunda (Hold ${holdHours} jam)`} value={formatCurrency(data.pendingBalance)} className="text-amber-600" />
                <Stat label="Total Saldo" value={formatCurrency(data.totalBalance)} />
                <Stat label="Total Transaksi" value={data.totalOrders} />
                <Stat label="Transaksi Berhasil" value={data.paidOrders} className="text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-800 dark:text-blue-300">
            <Info className="size-4 shrink-0" />
            <span>
              Setiap pembayaran masuk ditahan selama <strong>{holdHours} jam</strong> sebelum bisa ditarik. Setelah itu saldo
              otomatis pindah ke Saldo Tersedia.
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Transaksi (Keseluruhan)</CardTitle>
              </CardHeader>
              <CardContent>
                {hasOrders ? (
                  <ChartContainer config={statusChartConfig} className="mx-auto h-60 w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
                      <Pie data={donutData} dataKey="value" nameKey="key" innerRadius={55}>
                        {donutData.map((d) => (
                          <Cell key={d.key} fill={`var(--color-${d.key})`} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="flex h-60 items-center justify-center text-sm text-muted-foreground">Belum ada transaksi</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistik Hari Ini</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Penjualan Berhasil</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(data.todayStats.salesAmount)}</p>
                  <p className="text-xs text-muted-foreground">{data.todayStats.salesCount} transaksi</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Menunggu Pembayaran</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(data.todayStats.pendingAmount)}</p>
                  <p className="text-xs text-muted-foreground">{data.todayStats.pendingCount} transaksi</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Kuota Transaksi Hari Ini</p>
                  <p className={`text-xl font-bold ${dailyTxLimit > 0 && dailyTxUsed >= dailyTxLimit ? 'text-destructive' : ''}`}>
                    {dailyTxUsed.toLocaleString('id-ID')} / {dailyTxLimit > 0 ? dailyTxLimit.toLocaleString('id-ID') : '∞'}
                  </p>
                  {dailyTxLimit > 0 && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${dailyTxUsed >= dailyTxLimit ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, (dailyTxUsed / dailyTxLimit) * 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dailyTxLimit > 0
                      ? 'Transaksi berhasil hari ini. Reset 00:00 WIB.'
                      : 'Tidak ada batas transaksi harian untuk toko Anda.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Total Penjualan (7 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig} className="h-64 w-full">
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
                  <Area
                    dataKey="totalAmount"
                    type="monotone"
                    stroke="var(--color-totalAmount)"
                    fill="var(--color-totalAmount)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
