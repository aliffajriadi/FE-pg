'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type RankingPeriod, type RankingSort } from '@/lib/api/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SimpleSelect } from '@/components/shared/SimpleSelect';

const SORT_OPTIONS: { value: RankingSort; label: string }[] = [
  { value: 'volume', label: 'Urutkan: Total nominal' },
  { value: 'count', label: 'Urutkan: Jumlah transaksi' },
  { value: 'fee', label: 'Urutkan: Total fee' },
  { value: 'average', label: 'Urutkan: Rata-rata transaksi' },
];
const MEDAL = ['🥇', '🥈', '🥉'];

export default function MerchantSummary({ period }: { period: RankingPeriod }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<RankingSort>('volume');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-merchant-ranking', { page, search, period, sortBy }],
    queryFn: () => adminApi.getMerchantRanking({ page, search, period, sortBy }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <SimpleSelect
          id="ranking-sort"
          value={sortBy}
          onValueChange={(v) => {
            setSortBy((v || 'volume') as RankingSort);
            setPage(1);
          }}
          options={SORT_OPTIONS}
        />
        <SearchForm
          placeholder="Cari toko atau pemilik..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Toko / Merchant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Transaksi Sukses</TableHead>
              <TableHead className="text-right">Total Nominal</TableHead>
              <TableHead className="text-right">Total Fee</TableHead>
              <TableHead className="text-right">Rata-rata</TableHead>
              <TableHead>Terakhir Dibayar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={8} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada merchant" />
            {rows.map((row) => (
              <TableRow key={row.store.id}>
                <TableCell className="text-base font-semibold">{MEDAL[row.rank - 1] ?? row.rank}</TableCell>
                <TableCell>
                  <p className="font-medium">{row.store.name}</p>
                  <p className="text-xs text-muted-foreground">{row.store.user?.email}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.store.status} />
                </TableCell>
                <TableCell className="text-right font-semibold">{row.paidCount.toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.totalVolume)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.totalFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(Math.round(row.averageAmount))}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {row.lastPaidAt ? formatDate(row.lastPaidAt) : '-'}
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
