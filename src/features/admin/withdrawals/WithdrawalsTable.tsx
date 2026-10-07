'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WithdrawalDetailDialog } from './WithdrawalDetailDialog';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function WithdrawalsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-withdrawals', { page, search, status }],
    queryFn: () => adminApi.getWithdrawals({ page, search, status }),
    placeholderData: keepPreviousData,
  });

  const withdrawals = data?.data ?? [];

  return (
    <>
      <PageHeader title="Daftar Penarikan" description="Proses pengajuan penarikan saldo merchant.">
        <SearchForm
          placeholder="Cari toko, bank, rekening..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </PageHeader>

      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as string);
          setPage(1);
        }}
      >
        <TabsList className="max-w-full overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Toko / Merchant</TableHead>
              <TableHead className="text-right">Sisa Saldo</TableHead>
              <TableHead className="text-right">Net Transfer</TableHead>
              <TableHead>Rekening</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              colSpan={7}
              isLoading={isLoading}
              error={error}
              isEmpty={!withdrawals.length}
              emptyText="Tidak ada pengajuan penarikan"
            />
            {withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <p className="font-medium">{w.store.name}</p>
                  <p className="text-xs text-muted-foreground">{w.store.user?.name}</p>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{formatCurrency(w.store.balance)}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(w.amount - (w.fee ?? 0))}</TableCell>
                <TableCell>
                  <p>{w.bankName}</p>
                  <p className="text-xs text-muted-foreground">{w.bankAccount}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={w.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(w.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <WithdrawalDetailDialog withdrawal={w} />
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
