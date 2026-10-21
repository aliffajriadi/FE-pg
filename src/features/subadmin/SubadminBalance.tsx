'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDownCircle, CalendarCheck, Coins, TrendingUp, Wallet } from 'lucide-react';
import { subadminApi } from '@/lib/api/subadmin';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { Pagination } from '@/components/shared/Pagination';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { BALANCE_LOG_TABS, BalanceLogTable } from './BalanceLogTable';
import { BalanceBreakdown, DailyRecapTable, QrisBalanceTable } from './BalanceRecap';

export default function SubadminBalance() {
  const [type, setType] = useState('ALL');
  const [page, setPage] = useState(1);

  const summary = useQuery({
    queryKey: ['subadmin-balance'],
    queryFn: subadminApi.getBalance,
    select: (res) => res.data,
    refetchInterval: 60_000,
  });
  const logs = useQuery({
    queryKey: ['subadmin-balance-logs', type, page],
    queryFn: () => subadminApi.getBalanceLogs({ page, type: type === 'ALL' ? undefined : type }),
    placeholderData: keepPreviousData,
    // Riwayat dimuat setelah ringkasan menyinkronkan invoice dibayar terbaru
    enabled: summary.isSuccess,
  });

  const data = summary.data;

  return (
    <>
      <PageHeader title="Saldo" description="Total uang yang masuk dan Anda pegang dari semua QRIS yang ditugaskan ke akun Anda.">
        <RefreshButton onRefresh={() => summary.refetch().then(() => logs.refetch())} loading={summary.isFetching || logs.isFetching} />
      </PageHeader>

      {summary.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : summary.error || !data ? (
        <Card>
          <CardContent className="text-destructive">Gagal memuat saldo: {summary.error?.message}</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Saldo Dipegang" icon={Wallet} value={formatCurrency(data.balance)} hint="Gabungan semua QRIS Anda" />
            <StatCard
              label="Saldo Pendapatan"
              icon={Coins}
              value={formatCurrency(data.income)}
              hint="Pendapatan platform yang Anda pegang, belum disetor"
            />
            <StatCard
              label="Masuk Hari Ini"
              icon={CalendarCheck}
              value={formatCurrency(data.today.amount)}
              hint={`${data.today.count.toLocaleString('id-ID')} transaksi (WIB)`}
            />
            <StatCard
              label="Total Masuk"
              icon={TrendingUp}
              value={formatCurrency(data.allTime.incoming)}
              hint={`${data.allTime.incomingCount.toLocaleString('id-ID')} transaksi sepanjang waktu`}
            />
            <StatCard
              label="Uang Keluar"
              icon={ArrowDownCircle}
              value={formatCurrency(data.allTime.subtracted + data.allTime.withdrawn)}
              hint={`Penarikan merchant ${formatCurrency(data.allTime.withdrawn)} · dikurangi admin ${formatCurrency(data.allTime.subtracted)}${data.allTime.added ? ` · ditambah admin ${formatCurrency(data.allTime.added)}` : ''}`}
            />
          </div>

          <Card className="gap-3">
            <CardHeader>
              <CardTitle>Rincian Total Masuk</CardTitle>
              <p className="text-sm text-muted-foreground">
                Uang yang dibayar pembeli = hak merchant + fee platform + kode unik. Hari ini:{' '}
                {formatCurrency(data.today.breakdown.merchant)} merchant · {formatCurrency(data.today.breakdown.fee)} fee ·{' '}
                {formatCurrency(data.today.breakdown.unique)} kode unik.
              </p>
            </CardHeader>
            <CardContent>
              <BalanceBreakdown breakdown={data.allTime.breakdown} />
            </CardContent>
          </Card>

          <Card className="gap-0 pb-0">
            <CardHeader className="pb-4">
              <CardTitle>Per QRIS</CardTitle>
            </CardHeader>
            <QrisBalanceTable qris={data.qris} emptyText="Belum ada QRIS yang ditugaskan ke akun Anda." />
          </Card>
        </>
      )}

      <DailyRecapTable
        id="recap-period"
        queryKey={['subadmin-balance-daily']}
        fetchRecap={subadminApi.getDailyRecap}
        fetchLogs={subadminApi.getBalanceLogs}
      />

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Riwayat Saldo</h2>
        <StatusTabs
          tabs={BALANCE_LOG_TABS}
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
        />
        <Card className="py-0">
          <BalanceLogTable logs={logs.data?.data ?? []} isLoading={logs.isLoading || summary.isLoading} error={logs.error} />
        </Card>
        <Pagination page={page} totalPages={logs.data?.pagination.totalPages ?? 1} onPageChange={setPage} />
      </div>
    </>
  );
}
