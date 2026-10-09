'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InvoiceDetailDialog } from '@/components/shared/InvoiceDetailDialog';
import { DateRangeFilter, EMPTY_RANGE, rangeToQuery } from '@/components/shared/DateRangeFilter';
import { ExportButton } from '@/components/shared/ExportButton';
import { exportTransactions } from '@/lib/export-transactions';
import { CreateOrderDialog } from './CreateOrderDialog';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function OrdersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [range, setRange] = useState(EMPTY_RANGE);

  const filters = { search, status, ...rangeToQuery(range) };

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant-orders', { page, search, status, range }],
    queryFn: () => merchantApi.getOrders({ ...filters, page }),
    placeholderData: keepPreviousData,
  });

  const options = { invalidate: [['merchant-orders'], ['merchant-dashboard']] };
  const sync = useApiMutation(merchantApi.syncOrder, { ...options, successMessage: 'Status transaksi diperbarui' });

  const orders = data?.data ?? [];

  return (
    <>
      <PageHeader title="Data Transaksi" description="Daftar invoice dan status pembayarannya.">
        <CreateOrderDialog />
      </PageHeader>

      <StatusTabs
        tabs={STATUS_TABS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <SearchForm
          fill
          placeholder="Cari invoice, produk, pelanggan..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DateRangeFilter
            value={range}
            onChange={(value) => {
              setRange(value);
              setPage(1);
            }}
          />
          <ExportButton
            onExport={() =>
              exportTransactions({
                fetchPage: (p, limit) => merchantApi.getOrders({ ...filters, page: p, limit }),
                includeStore: false,
                range,
                prefix: 'transaksi',
              })
            }
          />
        </div>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Invoice</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead>Dibayar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              colSpan={8}
              isLoading={isLoading}
              error={error}
              isEmpty={!orders.length}
              emptyText="Belum ada transaksi. Buat invoice pertama Anda untuk mulai menerima pembayaran."
            />
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <code className="font-mono text-xs text-muted-foreground">{order.invoiceCode}</code>
                </TableCell>
                <TableCell className="max-w-48 truncate" title={order.productName}>
                  {order.productName}
                </TableCell>
                <TableCell>{order.customerName || '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                <TableCell>
                  <StatusBadge status={order.paymentStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {order.paidAt ? formatDate(order.paidAt) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <InvoiceDetailDialog order={order} viewer="merchant" />
                    {order.paymentStatus !== 'PAID' && (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        title="Cek status pembayaran"
                        aria-label="Cek status pembayaran"
                        disabled={sync.isPending && sync.variables === order.invoiceCode}
                        onClick={() => sync.mutate(order.invoiceCode)}
                      >
                        <RefreshCw className={sync.isPending && sync.variables === order.invoiceCode ? 'animate-spin' : ''} />
                      </Button>
                    )}
                    {order.paymentUrl && (
                      <a
                        href={order.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka link pembayaran"
                        aria-label="Buka link pembayaran"
                        className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
                      >
                        <ExternalLink />
                      </a>
                    )}
                  </div>
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
