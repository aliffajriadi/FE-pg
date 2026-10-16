'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type RankingPeriod } from '@/lib/api/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import MerchantSummary from './MerchantSummary';

export const PERIOD_OPTIONS: { value: RankingPeriod; label: string }[] = [
  { value: 'today', label: 'Hari ini' },
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
  { value: 'all', label: 'Semua waktu' },
];

type Tab = 'amount' | 'fee' | 'merchant';

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function TransactionList({ sortBy, period }: { sortBy: 'amount' | 'fee'; period: RankingPeriod }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-tracking', { page, search, period, sortBy }],
    queryFn: () => adminApi.getTransactionTracking({ page, search, period, sortBy }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  const offset = ((data?.pagination.page ?? 1) - 1) * (data?.pagination.limit ?? 20);

  return (
    <>
      <SearchForm
        placeholder="Cari invoice, produk, atau toko..."
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Toko / Merchant</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Dibayar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada transaksi berhasil" />
            {rows.map((o, i) => (
              <TableRow key={o.id}>
                <TableCell className="text-muted-foreground">{offset + i + 1}</TableCell>
                <TableCell>
                  <p className="font-mono text-xs">{o.invoiceCode}</p>
                  <p className="text-xs text-muted-foreground">{o.productName}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{o.store.name}</p>
                  <p className="text-xs text-muted-foreground">{o.store.user?.email}</p>
                </TableCell>
                <TableCell className={`text-right ${sortBy === 'amount' ? 'font-bold' : ''}`}>{formatCurrency(o.amount)}</TableCell>
                <TableCell className={`text-right ${sortBy === 'fee' ? 'font-bold text-emerald-600' : ''}`}>
                  {formatCurrency(o.platformFee)}
                </TableCell>
                <TableCell className="text-sm uppercase">{o.paymentMethod ?? '-'}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{o.paidAt ? formatDate(o.paidAt) : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}

export default function TransactionTracking() {
  const [period, setPeriod] = useState<RankingPeriod>('today');
  const [tab, setTab] = useState<Tab>('amount');

  // Ringkasan periode (tidak bergantung pada tab/pencarian)
  const { data: summaryData } = useQuery({
    queryKey: ['admin-tracking-summary', period],
    queryFn: () => adminApi.getTransactionTracking({ period, limit: 1 }),
    select: (res) => res.summary,
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Tracking Transaksi"
        description="Pantau transaksi dengan nominal dan fee terbesar. Hanya transaksi berhasil (sudah dibayar), sandbox tidak dihitung."
      >
        <SimpleSelect
          id="tracking-period"
          value={period}
          onValueChange={(v) => setPeriod((v || 'today') as RankingPeriod)}
          options={PERIOD_OPTIONS}
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Transaksi Sukses" value={(summaryData?.count ?? 0).toLocaleString('id-ID')} />
        <SummaryCard label="Total Nominal" value={formatCurrency(summaryData?.totalVolume)} />
        <SummaryCard label="Total Fee" value={formatCurrency(summaryData?.totalFee)} hint={`Fee terbesar: ${formatCurrency(summaryData?.maxFee)}`} />
        <SummaryCard label="Transaksi Terbesar" value={formatCurrency(summaryData?.maxAmount)} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="amount">Transaksi Terbesar</TabsTrigger>
          <TabsTrigger value="fee">Fee Terbesar</TabsTrigger>
          <TabsTrigger value="merchant">Per Merchant</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'merchant' ? (
        <MerchantSummary period={period} />
      ) : (
        <TransactionList key={`${tab}-${period}`} sortBy={tab} period={period} />
      )}
    </>
  );
}
