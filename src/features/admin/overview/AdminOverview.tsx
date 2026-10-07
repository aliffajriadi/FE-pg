'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import {
  Banknote,
  BarChart3,
  CheckCircle2,
  CreditCard,
  PiggyBank,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { adminApi, type DashboardStats } from '@/lib/api/admin';
import { API_ORIGIN } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';

const statusChartConfig = {
  paid: { label: 'Terbayar', color: 'var(--chart-1)' },
  unpaid: { label: 'Pending / Gagal', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const financeChartConfig = {
  amount: { label: 'Rupiah' },
  volume: { label: 'Volume', color: 'var(--chart-3)' },
  fee: { label: 'Fee PG', color: 'var(--chart-1)' },
  wdFee: { label: 'Fee WD', color: 'var(--chart-4)' },
} satisfies ChartConfig;

function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total Pesanan" value={stats.totalOrders} icon={ShoppingCart} />
      <StatCard label="Terbayar" value={stats.paidOrders} icon={CheckCircle2} />
      <StatCard label="Volume Transaksi" value={formatCurrency(stats.totalVolume)} icon={BarChart3} />
      <StatCard label="Pendapatan Fee" value={formatCurrency(stats.totalFee)} icon={CreditCard} />
      <StatCard label="Fee Penarikan" value={formatCurrency(stats.totalWdFee)} icon={Wallet} />
      <StatCard label="Total Pendapatan" value={formatCurrency(stats.totalFee + stats.totalWdFee)} icon={Banknote} />
    </div>
  );
}

export default function AdminOverview() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startInput, setStartInput] = useState(today);
  const [endInput, setEndInput] = useState(today);
  const [range, setRange] = useState({ startDate: '', endDate: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard', range],
    queryFn: () => adminApi.getDashboard(range),
    select: (res) => res.data,
  });

  const resetToToday = () => {
    setStartInput(today);
    setEndInput(today);
    setRange({ startDate: '', endDate: '' });
  };

  const rangeLabel = `${range.startDate || today} s/d ${range.endDate || today}`;

  return (
    <>
      <PageHeader title="Ikhtisar Admin" description="Ringkasan transaksi dan pendapatan sistem.">
        <Input type="date" value={startInput} onChange={(e) => setStartInput(e.target.value)} className="w-auto" />
        <span className="text-muted-foreground">-</span>
        <Input type="date" value={endInput} onChange={(e) => setEndInput(e.target.value)} className="w-auto" />
        <Button onClick={() => setRange({ startDate: startInput, endDate: endInput })}>Filter</Button>
        <Button variant="outline" onClick={resetToToday}>
          Hari Ini
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : error || !data ? (
        <Card>
          <CardContent className="text-destructive">Gagal memuat data dashboard: {error?.message}</CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-semibold">Statistik Rentang Tanggal ({rangeLabel})</h2>
            <StatsGrid stats={data.range} />
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Total Keseluruhan (Semua Waktu)</h2>
            <StatsGrid stats={data.allTime} />
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Saldo Merchant (Real-time)</h2>
            <StatCard
              label="Total Uang di Merchant"
              value={formatCurrency(data.merchantBalance.totalBalance)}
              hint="Total saldo seluruh merchant saat ini"
              icon={PiggyBank}
              className="max-w-md border-primary/40 bg-primary/5"
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Transaksi (Rentang Tanggal)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.range.totalOrders === 0 ? (
                  <p className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                    Belum ada transaksi pada rentang ini
                  </p>
                ) : (
                  <ChartContainer config={statusChartConfig} className="mx-auto h-60 w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
                      <Pie
                        data={[
                          { key: 'paid', value: data.range.paidOrders },
                          { key: 'unpaid', value: Math.max(0, data.range.totalOrders - data.range.paidOrders) },
                        ]}
                        dataKey="value"
                        nameKey="key"
                        innerRadius={55}
                      >
                        <Cell fill="var(--color-paid)" />
                        <Cell fill="var(--color-unpaid)" />
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rincian Keuangan (Rentang Tanggal)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={financeChartConfig} className="h-60 w-full">
                  <BarChart
                    data={[
                      { key: 'volume', amount: data.range.totalVolume, fill: 'var(--color-volume)' },
                      { key: 'fee', amount: data.range.totalFee, fill: 'var(--color-fee)' },
                      { key: 'wdFee', amount: data.range.totalWdFee, fill: 'var(--color-wdFee)' },
                    ]}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="key"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(key: keyof typeof financeChartConfig) => String(financeChartConfig[key]?.label)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={70}
                      tickFormatter={(v: number) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(v)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="key"
                          hideLabel
                          formatter={(value, _name, item) => (
                            <span>
                              {String(financeChartConfig[item.payload.key as keyof typeof financeChartConfig]?.label)}:{' '}
                              <strong>{formatCurrency(Number(value))}</strong>
                            </span>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="amount" radius={6} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Sistem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">URL Webhook untuk Pakasir:</p>
                <code className="block rounded-md bg-muted p-3 font-mono text-xs break-all">
                  {API_ORIGIN}/api/payment/webhook?key=
                </code>
                <p className="text-xs text-muted-foreground italic">
                  * Masukkan URL di atas pada pengaturan Webhook/Callback di Dashboard Pakasir.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Keamanan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Pastikan Secret Key dikelola dengan baik. Sistem menggunakan HMAC SHA256 untuk memverifikasi keaslian
                data webhook.
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
