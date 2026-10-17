'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CalendarCheck, CheckCircle2, ChevronRight, Clock, Wallet } from 'lucide-react';
import { subadminApi } from '@/lib/api/subadmin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';

const chartConfig = { totalAmount: { label: 'Uang Masuk', color: 'var(--chart-5)' } } satisfies ChartConfig;

export default function SubadminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['subadmin-dashboard'],
    queryFn: subadminApi.getDashboard,
    select: (res) => res.data,
    refetchInterval: 60_000,
  });

  return (
    <>
      <PageHeader title="Dashboard" description="Ringkasan transaksi dari QRIS yang ditugaskan ke akun Anda." />

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
          <CardContent className="text-destructive">Gagal memuat dashboard: {error?.message}</CardContent>
        </Card>
      ) : !data.qris.length ? (
        <Card>
          <CardContent className="text-muted-foreground">Belum ada QRIS yang ditugaskan ke akun Anda. Hubungi super admin.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Uang Masuk Hari Ini"
              icon={CalendarCheck}
              value={formatCurrency(data.totals.todayVolume)}
              hint={`${data.totals.todayCount.toLocaleString('id-ID')} transaksi dibayar`}
            />
            <StatCard label="Total Uang Masuk" icon={Wallet} value={formatCurrency(data.totals.paidVolume)} hint="Sepanjang waktu" />
            <StatCard
              label="Transaksi Berhasil"
              icon={CheckCircle2}
              value={data.totals.paidCount.toLocaleString('id-ID')}
              hint="Sepanjang waktu"
            />
            <StatCard
              label="Menunggu Pembayaran"
              icon={Clock}
              value={data.totals.pendingCount.toLocaleString('id-ID')}
              hint="Invoice aktif saat ini"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uang Masuk (7 Hari Terakhir)</CardTitle>
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
                            Uang masuk: <strong>{formatCurrency(Number(value))}</strong>
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

          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Card className="gap-0 pb-0">
              <CardHeader className="pb-4">
                <CardTitle>Per QRIS</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>QRIS</TableHead>
                    <TableHead className="text-right">Hari Ini</TableHead>
                    <TableHead className="text-right">Total</TableHead>
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
                      <TableCell className="text-right">
                        <span className="font-semibold text-emerald-600">{formatCurrency(q.todayVolume)}</span>
                        <p className="text-xs text-muted-foreground">{q.todayCount} transaksi</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{formatCurrency(q.paidVolume)}</span>
                        <p className="text-xs text-muted-foreground">{q.paidCount.toLocaleString('id-ID')} transaksi</p>
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data.recent.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        Belum ada transaksi
                      </TableCell>
                    </TableRow>
                  )}
                  {data.recent.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <code className="font-mono text-xs text-muted-foreground">{tx.invoiceCode}</code>
                        <p className="text-xs text-muted-foreground">
                          {tx.store.name} · {tx.qris.name ?? '-'}
                        </p>
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
          </div>
        </>
      )}
    </>
  );
}
