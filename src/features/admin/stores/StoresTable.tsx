'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type AdminStore } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { BalanceDialog, FeeDialog, HoldHoursDialog } from './StoreDialogs';

function formatFee(store: AdminStore) {
  return store.feeType === 'FIXED' ? formatCurrency(store.feeValue) : `${store.feeValue}%`;
}

export default function StoresTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stores', { page, search }],
    queryFn: () => adminApi.getStores({ page, search }),
    placeholderData: keepPreviousData,
  });

  const options = { invalidate: [['admin-stores']] };
  const approve = useApiMutation(adminApi.approveStore, { ...options, successMessage: 'Toko disetujui' });
  const suspend = useApiMutation(adminApi.suspendStore, { ...options, successMessage: 'Toko ditutup sementara' });
  const activate = useApiMutation(adminApi.activateStore, { ...options, successMessage: 'Toko dibuka kembali' });
  const toggleAutoWd = useApiMutation(
    ({ id, excluded }: { id: number; excluded: boolean }) => adminApi.updateStoreAutoWd(id, excluded),
    { ...options, successMessage: 'Pengaturan auto penarikan disimpan' }
  );

  const toggleManualInvoice = useApiMutation(
    ({ id, enabled }: { id: number; enabled: boolean }) => adminApi.updateStoreManualInvoice(id, enabled),
    { ...options, successMessage: 'Pengaturan invoice manual disimpan' }
  );

  const stores = data?.data ?? [];

  return (
    <>
      <PageHeader title="Manajemen Toko" description="Kelola merchant, fee, penarikan, dan saldo.">
        <SearchForm
          placeholder="Cari toko atau pemilik..."
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
              <TableHead>Toko / Merchant</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Hold</TableHead>
              <TableHead>Auto WD</TableHead>
              <TableHead>Invoice Manual</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={8} isLoading={isLoading} error={error} isEmpty={!stores.length} emptyText="Belum ada toko" />
            {stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>
                  <p className="font-medium">{store.name}</p>
                  <p className="text-xs text-muted-foreground">{store.user?.name}</p>
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(store.balance)}</TableCell>
                <TableCell>
                  <StatusBadge status={store.status} />
                </TableCell>
                <TableCell>{formatFee(store)}</TableCell>
                <TableCell>
                  <ToneBadge tone="warning">{store.balanceHoldHours ?? 48} jam</ToneBadge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!store.autoWdExcluded}
                    onCheckedChange={(checked) => toggleAutoWd.mutate({ id: store.id, excluded: !checked })}
                    disabled={toggleAutoWd.isPending}
                    aria-label={`Auto penarikan ${store.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!store.manualInvoiceEnabled}
                    onCheckedChange={(checked) => toggleManualInvoice.mutate({ id: store.id, enabled: checked })}
                    disabled={toggleManualInvoice.isPending}
                    aria-label={`Invoice manual ${store.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <BalanceDialog store={store} />
                    <FeeDialog store={store} mode="fee" />
                    <FeeDialog store={store} mode="wd" />
                    <HoldHoursDialog store={store} />
                    {store.status === 'PENDING' && (
                      <ConfirmAction
                        title="Setujui toko?"
                        description={store.name}
                        confirmLabel="Setujui"
                        onConfirm={() => approve.mutateAsync(store.id)}
                      >
                        Setujui
                      </ConfirmAction>
                    )}
                    {store.status === 'APPROVED' && (
                      <ConfirmAction
                        destructive
                        title="Tutup toko sementara?"
                        description={`${store.name} tidak dapat menerima transaksi sampai dibuka kembali.`}
                        confirmLabel="Tutup Toko"
                        onConfirm={() => suspend.mutateAsync(store.id)}
                      >
                        Tutup
                      </ConfirmAction>
                    )}
                    {(store.status === 'SUSPENDED' || store.status === 'REJECTED') && (
                      <ConfirmAction
                        title="Buka kembali toko?"
                        description={store.name}
                        confirmLabel="Buka Toko"
                        onConfirm={() => activate.mutateAsync(store.id)}
                      >
                        Buka
                      </ConfirmAction>
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
