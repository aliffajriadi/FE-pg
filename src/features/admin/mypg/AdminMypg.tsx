'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type AdminMypgOrder } from '@/lib/api/admin';
import { MYPG_PROVIDER_LABEL, type MypgNotificationStatus } from '@/lib/api/mypg';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import { StatusTabs } from '@/components/shared/StatusTabs';

type Tab = 'merchants' | 'orders' | 'notifications';
type StoreFilter = { id: number; name: string } | null;

/** Chip penanda tampilan sedang dibatasi ke satu merchant. */
function StoreFilterChip({ store, onClear }: { store: NonNullable<StoreFilter>; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Menampilkan khusus:</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 py-0.5 pr-1 pl-3 font-medium text-primary">
        {store.name}
        <button type="button" onClick={onClear} aria-label="Hapus filter merchant" className="rounded-full p-1 hover:bg-primary/20">
          <X className="size-3.5" />
        </button>
      </span>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium break-words">{children}</span>
    </div>
  );
}

function OrderDetailDialog({ order }: { order: AdminMypgOrder }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Eye /> Detail
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Transaksi MyPG</DialogTitle>
          </DialogHeader>
          <div className="divide-y">
            <DetailRow label="Invoice">
              <span className="font-mono text-xs">{order.invoiceCode}</span>
            </DetailRow>
            <DetailRow label="Toko">{order.store.name}</DetailRow>
            <DetailRow label="Status">
              <StatusBadge status={order.paymentStatus} />
            </DetailRow>
            <DetailRow label="Produk">{order.productName}</DetailRow>
            {order.externalId && <DetailRow label="ID Eksternal">{order.externalId}</DetailRow>}
            {order.customerName && <DetailRow label="Pelanggan">{order.customerName}</DetailRow>}
            {order.customerContact && <DetailRow label="Kontak">{order.customerContact}</DetailRow>}
            <DetailRow label="Nominal">{formatCurrency(order.amount)}</DetailRow>
            <DetailRow label="Kode Unik">{order.uniqueCode}</DetailRow>
            <DetailRow label="Total Dibayar">{formatCurrency(order.totalAmount)}</DetailRow>
            {order.paidVia && <DetailRow label="Dibayar Via">{order.paidVia}</DetailRow>}
            <DetailRow label="Dibuat">{formatDate(order.createdAt)}</DetailRow>
            {order.paidAt && <DetailRow label="Dibayar">{formatDate(order.paidAt)}</DetailRow>}
            {order.expiredAt && <DetailRow label="Kedaluwarsa">{formatDate(order.expiredAt)}</DetailRow>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MerchantsTab({ onView }: { onView: (tab: 'orders' | 'notifications', store: { id: number; name: string }) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-mypg-merchants'],
    queryFn: adminApi.getMypgMerchants,
    select: (res) => res.data,
    refetchInterval: 60_000,
  });
  const rows = data ?? [];
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Toko / Merchant</TableHead>
            <TableHead>Lisensi</TableHead>
            <TableHead>QRIS Aktif</TableHead>
            <TableHead>HP Online</TableHead>
            <TableHead>Notifikasi Terakhir</TableHead>
            <TableHead className="text-right">Hari Ini</TableHead>
            <TableHead className="text-right">Total Sukses</TableHead>
            <TableHead className="text-right">Lihat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableState
            colSpan={8}
            isLoading={isLoading}
            error={error}
            isEmpty={!rows.length}
            emptyText="Belum ada merchant MyPG. Aktifkan di menu Toko / Merchant."
          />
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.user?.email}</p>
              </TableCell>
              <TableCell>
                {m.mypgActiveUntil && new Date(m.mypgActiveUntil) > new Date() ? (
                  <>
                    <ToneBadge tone="success">Aktif</ToneBadge>
                    <p className="mt-0.5 text-xs text-muted-foreground">s.d. {formatDate(m.mypgActiveUntil, false)}</p>
                  </>
                ) : (
                  <ToneBadge tone="danger">{m.mypgActiveUntil ? 'Berakhir' : 'Belum aktif'}</ToneBadge>
                )}
              </TableCell>
              <TableCell>
                {m.activeQris ? (
                  <>
                    <p className="text-sm">{m.activeQris.name}</p>
                    <p className="text-xs text-muted-foreground">{MYPG_PROVIDER_LABEL[m.activeQris.provider]}</p>
                  </>
                ) : (
                  <ToneBadge tone="warning">Belum ada</ToneBadge>
                )}
              </TableCell>
              <TableCell>
                <ToneBadge tone={m.onlineDevices ? 'success' : m.deviceCount ? 'danger' : 'warning'}>
                  {m.onlineDevices} / {m.deviceCount}
                </ToneBadge>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                {m.lastNotificationAt ? formatDate(m.lastNotificationAt) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <p className="font-medium">{formatCurrency(m.todayVolume)}</p>
                <p className="text-xs text-muted-foreground">{m.todayCount} trx</p>
              </TableCell>
              <TableCell className="text-right">
                <p className="font-medium">{formatCurrency(m.paidVolume)}</p>
                <p className="text-xs text-muted-foreground">{m.paidCount} trx</p>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="outline" size="xs" onClick={() => onView('orders', { id: m.id, name: m.name })}>
                    Transaksi
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => onView('notifications', { id: m.id, name: m.name })}>
                    Log
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

const ORDER_TABS = [
  { value: '', label: 'Semua' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

function OrdersTab({ store, onClearStore }: { store: StoreFilter; onClearStore: () => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-mypg-orders', { page, search, status, storeId: store?.id }],
    queryFn: () => adminApi.getMypgOrders({ page, search, status, storeId: store?.id }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  return (
    <>
      {store && <StoreFilterChip store={store} onClear={onClearStore} />}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs
          tabs={ORDER_TABS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <SearchForm
          placeholder="Cari invoice, produk, pelanggan, toko..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Toko</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada transaksi MyPG" />
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-mono text-xs">{o.invoiceCode}</p>
                  <p className="text-xs text-muted-foreground">{o.productName}</p>
                </TableCell>
                <TableCell>{o.store.name}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.paymentStatus} />
                  {o.paidVia && <p className="mt-0.5 text-xs text-muted-foreground">via {o.paidVia}</p>}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <OrderDetailDialog order={o} />
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

const NOTIF_TABS = [
  { value: '', label: 'Semua' },
  { value: 'MATCHED', label: 'Cocok' },
  { value: 'NO_MATCH', label: 'Tidak ada invoice' },
  { value: 'AMBIGUOUS', label: 'Nominal ganda' },
  { value: 'IGNORED', label: 'Diabaikan' },
];
const NOTIF_TONE: Record<MypgNotificationStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  MATCHED: 'success',
  NO_MATCH: 'warning',
  AMBIGUOUS: 'danger',
  IGNORED: 'info',
};

function NotificationsTab({ store, onClearStore }: { store: StoreFilter; onClearStore: () => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-mypg-notifications', { page, status, search, storeId: store?.id }],
    queryFn: () => adminApi.getMypgNotifications({ page, status, search, storeId: store?.id }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  return (
    <>
      {store && <StoreFilterChip store={store} onClear={onClearStore} />}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs
          tabs={NOTIF_TABS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <SearchForm
          placeholder="Cari isi notifikasi, toko..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Toko</TableHead>
              <TableHead>Hasil</TableHead>
              <TableHead>Isi Notifikasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={4} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada notifikasi masuk" />
            {rows.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(n.createdAt)}</TableCell>
                <TableCell>{n.store?.name}</TableCell>
                <TableCell>
                  <ToneBadge tone={NOTIF_TONE[n.status]}>{n.status}</ToneBadge>
                  {n.amount !== null && <p className="mt-0.5 text-xs">{formatCurrency(n.amount)}</p>}
                </TableCell>
                <TableCell className="max-w-md text-sm break-words whitespace-normal text-muted-foreground">
                  {n.text}
                  {n.message && <p className="mt-0.5 text-xs text-foreground">{n.message}</p>}
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

export default function AdminMypg() {
  const [tab, setTab] = useState<Tab>('merchants');
  const [store, setStore] = useState<StoreFilter>(null);
  return (
    <>
      <PageHeader
        title="MyPG Merchant"
        description="Pantau merchant yang memakai QRIS sendiri: status HP, transaksi, dan notifikasi masuk. Akses diatur di menu Toko / Merchant."
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="merchants">Merchant</TabsTrigger>
          <TabsTrigger value="orders">Transaksi</TabsTrigger>
          <TabsTrigger value="notifications">Log Notifikasi</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === 'merchants' ? (
        <MerchantsTab
          onView={(next, s) => {
            setStore(s);
            setTab(next);
          }}
        />
      ) : tab === 'orders' ? (
        <OrdersTab store={store} onClearStore={() => setStore(null)} />
      ) : (
        <NotificationsTab store={store} onClearStore={() => setStore(null)} />
      )}
    </>
  );
}
