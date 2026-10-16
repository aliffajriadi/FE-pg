'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { MYPG_PROVIDER_LABEL, type MypgNotificationStatus } from '@/lib/api/mypg';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import { StatusTabs } from '@/components/shared/StatusTabs';

type Tab = 'merchants' | 'orders' | 'notifications';

function MerchantsTab() {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableState
            colSpan={7}
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

function OrdersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-mypg-orders', { page, search, status }],
    queryFn: () => adminApi.getMypgOrders({ page, search, status }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  return (
    <>
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
          placeholder="Cari invoice, produk, toko..."
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
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={5} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada transaksi MyPG" />
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

function NotificationsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-mypg-notifications', { page, status }],
    queryFn: () => adminApi.getMypgNotifications({ page, status }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  return (
    <>
      <StatusTabs
        tabs={NOTIF_TABS}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />
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
      {tab === 'merchants' ? <MerchantsTab /> : tab === 'orders' ? <OrdersTab /> : <NotificationsTab />}
    </>
  );
}
