'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { mypgApi, type MypgOrder } from '@/lib/api/mypg';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { DateRangeFilter, EMPTY_RANGE, rangeToQuery } from '@/components/shared/DateRangeFilter';
import { CreateMypgOrderDialog } from './CreateMypgOrderDialog';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];
const ACTIVE = ['PENDING', 'WAITING_PAYMENT'];
// Invoice kedaluwarsa tetap bisa ditandai lunas (mis. pelanggan membayar terlambat)
const MARKABLE = [...ACTIVE, 'EXPIRED'];

function OrderActions({
  order,
  onMarkPaid,
  onCancel,
}: {
  order: MypgOrder;
  onMarkPaid: (code: string) => Promise<unknown>;
  onCancel: (code: string) => Promise<unknown>;
}) {
  return (
    <div className="flex justify-end gap-1.5">
      {MARKABLE.includes(order.paymentStatus) && (
        <ConfirmAction
          size="xs"
          title="Tandai invoice ini sudah dibayar?"
          description={
            <>
              Pastikan dana <strong>{formatCurrency(order.totalAmount)}</strong> sudah benar-benar masuk ke akun QRIS Anda.
              Status menjadi Dibayar dan webhook payment.paid dikirim (bisa dimatikan di Pengaturan).
            </>
          }
          confirmLabel="Ya, Tandai Dibayar"
          onConfirm={() => onMarkPaid(order.invoiceCode)}
        >
          Tandai Dibayar
        </ConfirmAction>
      )}
      {ACTIVE.includes(order.paymentStatus) && (
        <ConfirmAction
          destructive
          size="xs"
          title="Batalkan invoice?"
          description={`${order.invoiceCode} tidak bisa dibayar lagi.`}
          confirmLabel="Batalkan"
          onConfirm={() => onCancel(order.invoiceCode)}
        >
          Batalkan
        </ConfirmAction>
      )}
      <Link
        href={`/pay/mypg/${order.invoiceCode}`}
        target="_blank"
        className={buttonVariants({ variant: 'ghost', size: 'icon-xs' })}
        aria-label="Buka halaman bayar"
        title="Buka halaman bayar"
      >
        <ExternalLink />
      </Link>
    </div>
  );
}

function StatusCell({ order }: { order: MypgOrder }) {
  return (
    <>
      <StatusBadge status={order.paymentStatus} />
      {order.paidVia && (
        <p className="mt-0.5 text-xs text-muted-foreground">{order.paidVia === 'MANUAL' ? 'ditandai manual' : `via ${order.paidVia}`}</p>
      )}
    </>
  );
}

export default function MypgOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [range, setRange] = useState(EMPTY_RANGE);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mypg-orders', { page, search, status, range }],
    queryFn: () => mypgApi.getOrders({ page, search, status, ...rangeToQuery(range) }),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
  const cancel = useApiMutation(mypgApi.cancelOrder, { invalidate: [['mypg-orders'], ['mypg-summary']] });
  const markPaid = useApiMutation(mypgApi.markOrderPaid, { invalidate: [['mypg-orders'], ['mypg-summary']] });
  const orders = data?.data ?? [];

  return (
    <>
      <PageHeader title="Transaksi MyPG" description="Invoice yang dibayar ke QRIS Anda. Terpisah dari transaksi dashboard live.">
        <CreateMypgOrderDialog />
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
          placeholder="Cari invoice, produk, pelanggan, external ID..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <DateRangeFilter
          value={range}
          onChange={(value) => {
            setRange(value);
            setPage(1);
          }}
        />
      </div>

      {/* HP: daftar kartu agar tidak perlu menggeser tabel ke samping */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : error ? (
          <p className="text-sm text-destructive">Gagal memuat data: {error.message}</p>
        ) : !orders.length ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi MyPG</CardContent>
          </Card>
        ) : (
          orders.map((o) => (
            <Card key={o.id} size="sm">
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.productName}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{o.invoiceCode}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusCell order={o} />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(o.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.createdAt)}
                      {o.uniqueCode > 0 && ` · +${o.uniqueCode} kode unik`}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <OrderActions order={o} onMarkPaid={markPaid.mutateAsync} onCancel={cancel.mutateAsync} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="hidden py-0 md:flex">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead className="text-right">Total Dibayar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!orders.length} emptyText="Belum ada transaksi MyPG" />
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-mono text-xs">{o.invoiceCode}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.productName}
                    {o.externalId && ` · ${o.externalId}`}
                  </p>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(o.amount)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(o.totalAmount)}
                  {o.uniqueCode > 0 && <p className="text-xs font-normal text-muted-foreground">+{o.uniqueCode} kode unik</p>}
                </TableCell>
                <TableCell>
                  <StatusCell order={o} />
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                <TableCell>
                  <OrderActions order={o} onMarkPaid={markPaid.mutateAsync} onCancel={cancel.mutateAsync} />
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
