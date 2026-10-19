'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowLeft, CalendarCheck, Coins, Minus, Plus, Wallet } from 'lucide-react';
import { adminApi, type SubadminBalanceAdjustment } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/shared/StatCard';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { Pagination } from '@/components/shared/Pagination';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { BALANCE_LOG_TABS, BalanceLogTable } from '@/features/subadmin/BalanceLogTable';
import { BalanceBreakdown, DailyRecapTable, QrisBalanceTable } from '@/features/subadmin/BalanceRecap';
import { AdjustCard, type AdjustOption } from './AdjustCard';
import { SubadminIncomePanel } from './SubadminIncomePanel';
import { SUBADMINS_KEY, SubadminDialog, qrisHolders } from './Subadmins';

const LOG_LIMIT = 15;
const ADJUST_OPTIONS: AdjustOption<SubadminBalanceAdjustment['type']>[] = [
  { value: 'SUBTRACT', label: 'Kurangi Saldo', icon: Minus, out: true },
  { value: 'ADD', label: 'Tambah Saldo', icon: Plus, out: false },
];
type Tab = 'overview' | 'recap' | 'logs' | 'income';

/** Halaman kelola saldo satu sub admin: ringkasan, rekap harian, riwayat mutasi, dan saldo pendapatan. */
export default function SubadminDetail({ id }: { id: number }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [logType, setLogType] = useState('ALL');
  const [logPage, setLogPage] = useState(1);

  const list = useQuery({ queryKey: SUBADMINS_KEY, queryFn: adminApi.getSubadmins, select: (res) => res.data });
  const subadmin = list.data?.find((s) => s.id === id);

  const summaryKey = ['admin-subadmin-balance', id];
  const summary = useQuery({
    queryKey: summaryKey,
    // Ringkasan saja; riwayat diambil terpisah dengan filter & halaman sendiri
    queryFn: () => adminApi.getSubadminBalance(id, { limit: 1 }),
    select: (res) => res.data,
  });
  const logsKey = ['admin-subadmin-logs', id];
  const logs = useQuery({
    queryKey: [...logsKey, logType, logPage],
    queryFn: () => adminApi.getSubadminBalanceLogs(id, { page: logPage, limit: LOG_LIMIT, type: logType === 'ALL' ? undefined : logType }),
    placeholderData: keepPreviousData,
    enabled: tab === 'logs',
  });

  const adjust = useApiMutation((body: SubadminBalanceAdjustment) => adminApi.adjustSubadminBalance(id, body), {
    invalidate: [SUBADMINS_KEY, summaryKey, logsKey, ['admin-subadmin-daily', id]],
  });

  const data = summary.data;
  const refresh = () => Promise.all([list.refetch(), summary.refetch(), tab === 'logs' && logs.refetch()]);

  if (list.isSuccess && !subadmin) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <p className="text-muted-foreground">Sub admin tidak ditemukan atau sudah dihapus.</p>
          <Link href="/admin/subadmins" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft /> Kembali ke daftar
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <Link href="/admin/subadmins" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Sub Admin
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {subadmin ? (
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {subadmin.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{subadmin.name}</h1>
                  <ToneBadge tone={subadmin.isActive ? 'success' : 'neutral'}>{subadmin.isActive ? 'Aktif' : 'Nonaktif'}</ToneBadge>
                </div>
                <p className="text-sm text-muted-foreground">{subadmin.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {subadmin.qris.map((q) => (
                    <ToneBadge key={q.id} tone="info">
                      {q.name}
                    </ToneBadge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Skeleton className="h-16 w-64" />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton onRefresh={refresh} loading={list.isFetching || summary.isFetching} />
            {subadmin && list.data && <SubadminDialog subadmin={subadmin} takenBy={qrisHolders(list.data, subadmin.id)} withLabel />}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Saldo Dipegang"
          icon={Wallet}
          value={formatCurrency(data?.balance ?? subadmin?.balance ?? 0)}
          hint="Uang dari semua QRIS-nya"
        />
        <StatCard
          label="Saldo Pendapatan"
          icon={Coins}
          value={formatCurrency(subadmin?.income ?? 0)}
          hint="Fee + kode unik + biaya penarikan"
        />
        <StatCard
          label="Masuk Hari Ini"
          icon={CalendarCheck}
          value={formatCurrency(data?.today.amount ?? subadmin?.todayIncome ?? 0)}
          hint={data ? `${data.today.count.toLocaleString('id-ID')} transaksi (WIB)` : undefined}
        />
        <StatCard
          label="Uang Keluar"
          icon={ArrowDownCircle}
          value={data ? formatCurrency(data.allTime.withdrawn + data.allTime.subtracted) : '-'}
          hint={
            data ? `Penarikan ${formatCurrency(data.allTime.withdrawn)} · disetor ${formatCurrency(data.allTime.subtracted)}` : undefined
          }
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="recap">Rekap Harian</TabsTrigger>
          <TabsTrigger value="logs">Riwayat Saldo</TabsTrigger>
          <TabsTrigger value="income">Pendapatan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-2">
          <div className="grid items-start gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rincian Total Masuk</CardTitle>
                  <CardDescription>
                    Uang yang dibayar pembeli = hak merchant + fee platform + kode unik.
                    {data &&
                      ` ${data.allTime.incomingCount.toLocaleString('id-ID')} transaksi, total ${formatCurrency(data.allTime.incoming)}.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>{data ? <BalanceBreakdown breakdown={data.allTime.breakdown} /> : <Skeleton className="h-20" />}</CardContent>
              </Card>
              <Card className="gap-0 pb-0">
                <CardHeader className="pb-4">
                  <CardTitle>Per QRIS</CardTitle>
                </CardHeader>
                {data ? (
                  <QrisBalanceTable qris={data.qris} emptyText="Belum ada QRIS yang ditugaskan." />
                ) : (
                  <Skeleton className="m-4 h-24" />
                )}
              </Card>
            </div>
            <AdjustCard
              title="Sesuaikan Saldo Dipegang"
              description="Kurangi saat uangnya sudah disetor, atau tambah untuk koreksi."
              current={data?.balance}
              currentLabel="Saldo dipegang"
              options={ADJUST_OPTIONS}
              notePlaceholder="Mis. setor tunai ke kantor"
              onSubmit={(body) => adjust.mutateAsync(body)}
            />
          </div>
        </TabsContent>

        <TabsContent value="recap" className="mt-2">
          <Card>
            <CardContent>
              <DailyRecapTable
                id={`recap-period-${id}`}
                queryKey={['admin-subadmin-daily', id]}
                fetchRecap={(range) => adminApi.getSubadminDailyRecap(id, range)}
                fetchLogs={(params) => adminApi.getSubadminBalanceLogs(id, params)}
                exportName={subadmin?.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-2 space-y-3">
          <StatusTabs
            tabs={BALANCE_LOG_TABS}
            value={logType}
            onChange={(v) => {
              setLogType(v);
              setLogPage(1);
            }}
          />
          <Card className="py-0">
            <BalanceLogTable logs={logs.data?.data ?? []} isLoading={logs.isLoading} error={logs.error} />
          </Card>
          <Pagination page={logPage} totalPages={logs.data?.pagination.totalPages ?? 1} onPageChange={setLogPage} />
        </TabsContent>

        <TabsContent value="income" className="mt-2">
          <SubadminIncomePanel subadminId={id} />
        </TabsContent>
      </Tabs>
    </>
  );
}
