'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Receipt, Wallet } from 'lucide-react';
import { subadminApi } from '@/lib/api/subadmin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { StatCard } from '@/components/shared/StatCard';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { DateRangeFilter, EMPTY_RANGE, rangeToQuery } from '@/components/shared/DateRangeFilter';
import { ConfirmAction } from '@/components/shared/ConfirmAction';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];
const ALL = 'ALL';
// Kedaluwarsa tetap bisa ditandai dibayar (pembeli membayar terlambat)
const MARKABLE = ['PENDING', 'WAITING_PAYMENT', 'EXPIRED'];

export default function SubadminTransactions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [qrisId, setQrisId] = useState(ALL);
  const [range, setRange] = useState(EMPTY_RANGE);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['subadmin-transactions', { page, search, status, qrisId, range }],
    queryFn: () =>
      subadminApi.getTransactions({ page, search, status, qrisId: qrisId === ALL ? undefined : Number(qrisId), ...rangeToQuery(range) }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });

  const markPaid = useApiMutation(subadminApi.markPaid, { invalidate: [['subadmin-transactions'], ['subadmin-dashboard']] });

  const transactions = data?.data ?? [];
  const qrisList = data?.qris ?? [];
  const summary = data?.summary;
  const resetPage =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  return (
    <>
      <PageHeader
        title="Riwayat Transaksi"
        description={
          qrisList.length
            ? `Transaksi dari QRIS: ${qrisList.map((q) => q.name).join(', ')}.`
            : data
              ? 'Belum ada QRIS yang ditugaskan ke akun Anda. Hubungi super admin.'
              : 'Transaksi dari QRIS yang ditugaskan ke akun Anda.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Invoice" icon={Receipt} value={(summary?.total ?? 0).toLocaleString('id-ID')} hint="Sesuai filter" />
        <StatCard label="Dibayar" icon={CheckCircle2} value={(summary?.paidCount ?? 0).toLocaleString('id-ID')} hint="Sesuai filter" />
        <StatCard label="Uang Masuk" icon={Wallet} value={formatCurrency(summary?.paidVolume ?? 0)} hint="Total invoice dibayar" />
      </div>

      <StatusTabs tabs={STATUS_TABS} value={status} onChange={resetPage(setStatus)} />
      <div className="space-y-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchForm fill placeholder="Cari kode invoice atau produk..." onSearch={resetPage(setSearch)} />
          {qrisList.length > 1 && (
            <SimpleSelect
              value={qrisId}
              onValueChange={(v) => resetPage(setQrisId)(v || ALL)}
              options={[{ value: ALL, label: 'Semua QRIS' }, ...qrisList.map((q) => ({ value: String(q.id), label: q.name }))]}
              className="lg:w-48"
            />
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <DateRangeFilter value={range} onChange={resetPage(setRange)} />
          <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
        </div>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Invoice</TableHead>
              <TableHead>QRIS</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Total Bayar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead>Dibayar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={9} isLoading={isLoading} error={error} isEmpty={!transactions.length} emptyText="Belum ada transaksi" />
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <code className="font-mono text-xs text-muted-foreground">{tx.invoiceCode}</code>
                </TableCell>
                <TableCell className="whitespace-nowrap">{tx.qris.name ?? '-'}</TableCell>
                <TableCell className="font-medium">{tx.store.name}</TableCell>
                <TableCell className="max-w-40 truncate" title={tx.productName}>
                  {tx.productName}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold">{formatCurrency(tx.totalAmount)}</span>
                  {!!tx.uniqueCode && <p className="text-xs text-muted-foreground">kode unik +{tx.uniqueCode}</p>}
                </TableCell>
                <TableCell>
                  <StatusBadge status={tx.paymentStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {tx.paidAt ? formatDate(tx.paidAt) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  {MARKABLE.includes(tx.paymentStatus) && (
                    <ConfirmAction
                      size="xs"
                      title="Tandai invoice ini sudah dibayar?"
                      description={
                        <>
                          Pastikan dana <strong>{formatCurrency(tx.totalAmount)}</strong> sudah benar-benar masuk ke QRIS {tx.qris.name}.
                          Saldo merchant {tx.store.name} bertambah dan webhook dikirim ke merchant. Tindakan ini tercatat atas nama Anda.
                        </>
                      }
                      confirmLabel="Ya, Tandai Dibayar"
                      onConfirm={() => markPaid.mutateAsync(tx.id)}
                    >
                      Tandai Dibayar
                    </ConfirmAction>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}
