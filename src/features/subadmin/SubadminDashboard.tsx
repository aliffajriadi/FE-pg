'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CheckCircle2, ChevronRight, Clock, Receipt, Wallet } from 'lucide-react';
import { subadminApi } from '@/lib/api/subadmin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';

const chartConfig = { paidVolume: { label: 'Uang Masuk', color: 'var(--chart-5)' } } satisfies ChartConfig;

type Period = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hari ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'custom', label: 'Pilih tanggal...' },
];
const MAX_RANGE_DAYS = 92;
const DAY_MS = 24 * 60 * 60 * 1000;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Tanggal WIB (YYYY-MM-DD), mundur `daysAgo` hari dari hari ini. */
const wibDate = (daysAgo = 0) => new Date(Date.now() + WIB_OFFSET_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);

function presetRange(period: Exclude<Period, 'custom'>): DateRange {
  switch (period) {
    case 'today':
      return { from: wibDate(), to: wibDate() };
    case 'yesterday':
      return { from: wibDate(1), to: wibDate(1) };
    case '7d':
      return { from: wibDate(6), to: wibDate() };
    case '30d':
      return { from: wibDate(29), to: wibDate() };
    case 'month':
      return { from: `${wibDate().slice(0, 8)}01`, to: wibDate() };
  }
}

const daysBetween = ({ from, to }: DateRange) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;
const dayLabel = (date: string, withYear = false) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: withYear ? 'short' : undefined,
    day: '2-digit',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  });
const successRate = (paid: number, total: number) => (total ? `${Math.round((paid / total) * 100)}%` : '-');

export default function SubadminDashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [custom, setCustom] = useState<DateRange>(() => presetRange('7d'));

  const range = period === 'custom' ? custom : presetRange(period);
  const rangeError =
    period !== 'custom'
      ? null
      : !custom.from || !custom.to
        ? 'Pilih tanggal awal dan akhir'
        : daysBetween(custom) > MAX_RANGE_DAYS
          ? `Rentang maksimal ${MAX_RANGE_DAYS} hari`
          : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['subadmin-dashboard', range],
    queryFn: () => subadminApi.getDashboard(range),
    select: (res) => res.data,
    enabled: !rangeError,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const periodLabel = data
    ? data.range.from === data.range.to
      ? dayLabel(data.range.from, true)
      : `${dayLabel(data.range.from)} – ${dayLabel(data.range.to, true)}`
    : '';

  return (
    <>
      <PageHeader title="Dashboard" description="Ringkasan transaksi dari QRIS yang ditugaskan ke akun Anda.">
        <SimpleSelect
          id="dashboard-period"
          value={period}
          onValueChange={(v) => {
            const next = (v || '7d') as Period;
            if (next === 'custom') setCustom(range);
            setPeriod(next);
          }}
          options={PERIOD_OPTIONS}
          className="sm:w-44"
        />
      </PageHeader>

      {period === 'custom' && (
        <div className="flex flex-col gap-1">
          <DateRangeFilter value={custom} onChange={setCustom} />
          {rangeError && <p className="text-xs text-destructive">{rangeError}</p>}
        </div>
      )}

      {isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </>
      ) : error || !data ? (
        <Card>
          <CardContent className={error ? 'text-destructive' : 'text-muted-foreground'}>
            {error ? `Gagal memuat dashboard: ${error.message}` : rangeError}
          </CardContent>
        </Card>
      ) : !data.qris.length ? (
        <Card>
          <CardContent className="text-muted-foreground">Belum ada QRIS yang ditugaskan ke akun Anda. Hubungi super admin.</CardContent>
        </Card>
      ) : (
        <>
          <p className="-mt-2 text-sm text-muted-foreground">
            Periode: <strong className="text-foreground">{periodLabel}</strong> (WIB)
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Uang Masuk"
              icon={Wallet}
              value={formatCurrency(data.totals.paidVolume)}
              hint="Invoice dibayar dalam periode"
            />
            <StatCard
              label="Transaksi Berhasil"
              icon={CheckCircle2}
              value={data.totals.paidCount.toLocaleString('id-ID')}
              hint={`Sukses ${successRate(data.totals.paidCount, data.totals.invoiceCount)} dari invoice periode ini`}
            />
            <StatCard label="Invoice Dibuat" icon={Receipt} value={data.totals.invoiceCount.toLocaleString('id-ID')} hint="Dalam periode" />
            <StatCard
              label="Menunggu Pembayaran"
              icon={Clock}
              value={data.totals.pendingCount.toLocaleString('id-ID')}
              hint="Invoice aktif saat ini"
            />
          </div>

          {data.daily.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Uang Masuk per Hari</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={data.daily.map((d) => ({ ...d, label: dayLabel(d.date) }))}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={70}
                      tickFormatter={(v: number) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(v)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => (
                            <span>
                              Uang masuk: <strong>{formatCurrency(Number(value))}</strong> ({item.payload.paidCount} transaksi)
                            </span>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="paidVolume" fill="var(--color-paidVolume)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Card className="gap-0 pb-0">
              <CardHeader className="pb-4">
                <CardTitle>Per QRIS</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>QRIS</TableHead>
                    <TableHead className="text-right">Uang Masuk</TableHead>
                    <TableHead className="text-right">Berhasil / Invoice</TableHead>
                    <TableHead>Terakhir Dibayar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.qris.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <p className="font-medium">{q.name}</p>
                        {q.pendingCount > 0 && <p className="text-xs text-amber-600">{q.pendingCount} menunggu</p>}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(q.paidVolume)}</TableCell>
                      <TableCell className="text-right">
                        {q.paidCount.toLocaleString('id-ID')} / {q.invoiceCount.toLocaleString('id-ID')}
                        <p className="text-xs text-muted-foreground">sukses {successRate(q.paidCount, q.invoiceCount)}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {q.lastPaidAt ? formatDate(q.lastPaidAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="gap-0 pb-0">
              <CardHeader className="pb-4">
                <CardTitle>Rincian per Hari</CardTitle>
              </CardHeader>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Invoice</TableHead>
                      <TableHead className="text-right">Dibayar</TableHead>
                      <TableHead className="text-right">Uang Masuk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...data.daily].reverse().map((d) => (
                      <TableRow key={d.date}>
                        <TableCell className="whitespace-nowrap">{dayLabel(d.date, true)}</TableCell>
                        <TableCell className="text-right">{d.invoiceCount.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">{d.paidCount.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(d.paidVolume)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          <Card className="gap-0 pb-0">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>Transaksi Terbaru</CardTitle>
              <Link href="/subadmin/transactions" className="flex items-center text-sm text-primary hover:underline">
                Lihat semua <ChevronRight className="size-4" />
              </Link>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Merchant / QRIS</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data.recent.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      Belum ada transaksi
                    </TableCell>
                  </TableRow>
                )}
                {data.recent.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <code className="font-mono text-xs text-muted-foreground">{tx.invoiceCode}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.store.name} · {tx.qris.name ?? '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(tx.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={tx.paymentStatus} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </>
  );
}
