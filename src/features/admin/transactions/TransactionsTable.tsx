'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { SimpleSelect } from '@/components/shared/SimpleSelect';

const ALL = 'ALL';

export default function TransactionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState(ALL);
  const [storeSearch, setStoreSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-transactions', { page, search, storeId }],
    queryFn: () =>
      adminApi.getTransactions({ page, search, storeId: storeId === ALL ? undefined : Number(storeId) }),
    placeholderData: keepPreviousData,
  });

  // Daftar merchant untuk filter, dicari di server agar tidak memuat semua toko
  const { data: stores } = useQuery({
    queryKey: ['admin-stores', { search: storeSearch, limit: 20 }],
    queryFn: () => adminApi.getStores({ search: storeSearch, limit: 20 }),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
  });

  const options = { invalidate: [['admin-transactions'], ['admin-dashboard']] };
  const markPaid = useApiMutation(adminApi.markTransactionPaid, options);
  const cancel = useApiMutation(adminApi.cancelTransaction, options);

  const transactions = data?.data ?? [];
  const storeOptions = [{ value: ALL, label: 'Semua Merchant' }, ...(stores ?? []).map((s) => ({ value: String(s.id), label: s.name }))];

  return (
    <>
      <PageHeader title="Riwayat Transaksi" description="Seluruh transaksi dari semua merchant.">
        <Input
          placeholder="Cari merchant..."
          value={storeSearch}
          onChange={(e) => setStoreSearch(e.target.value)}
          className="w-full sm:w-40"
        />
        <SimpleSelect
          value={storeId}
          onValueChange={(v) => {
            setStoreId(v || ALL);
            setPage(1);
          }}
          options={storeOptions}
          className="sm:w-48"
        />
        <SearchForm
          placeholder="Cari invoice, produk, pelanggan..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </PageHeader>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Kode Invoice</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!transactions.length} emptyText="Belum ada transaksi" />
            {transactions.map((tx) => {
              const canAct = tx.paymentStatus === 'PENDING' || tx.paymentStatus === 'WAITING_PAYMENT';
              return (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.store?.name ?? '-'}</TableCell>
                  <TableCell>
                    <code className="font-mono text-xs text-muted-foreground">{tx.invoiceCode}</code>
                  </TableCell>
                  <TableCell className="max-w-40 truncate" title={tx.productName}>
                    {tx.productName}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(tx.totalAmount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={tx.paymentStatus} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {canAct ? (
                        <>
                          <ConfirmAction
                            title="Tandai sebagai dibayar?"
                            description={`Transaksi ${tx.invoiceCode} akan ditandai DIBAYAR, saldo merchant bertambah, dan webhook dikirim ke merchant.`}
                            confirmLabel="Tandai Dibayar"
                            onConfirm={() => markPaid.mutateAsync(tx.id)}
                          >
                            Dibayar
                          </ConfirmAction>
                          <ConfirmAction
                            destructive
                            title="Batalkan transaksi?"
                            description={`Transaksi ${tx.invoiceCode} akan dibatalkan.`}
                            confirmLabel="Batalkan"
                            onConfirm={() => cancel.mutateAsync(tx.id)}
                          >
                            Batalkan
                          </ConfirmAction>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}
