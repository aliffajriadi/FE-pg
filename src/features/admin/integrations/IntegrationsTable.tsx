'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type AdminIntegrationRow, type IntegrationCount } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';

/** "Live 2/3  Sandbox 1/1" (aktif/total). Kosong ditampilkan sebagai strip. */
function CountPair({ live, sandbox }: { live: IntegrationCount; sandbox: IntegrationCount }) {
  if (!live.total && !sandbox.total) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {live.total > 0 && (
        <ToneBadge tone="info">
          Live {live.active}/{live.total}
        </ToneBadge>
      )}
      {sandbox.total > 0 && (
        <ToneBadge tone="warning">
          Sandbox {sandbox.active}/{sandbox.total}
        </ToneBadge>
      )}
    </div>
  );
}

function Row({ store }: { store: AdminIntegrationRow }) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{store.name}</p>
        <p className="text-xs text-muted-foreground">
          {store.user.name} · {store.user.email}
        </p>
      </TableCell>
      <TableCell>
        <StatusBadge status={store.status} />
      </TableCell>
      <TableCell className="text-center">{store.projectCount || <span className="text-muted-foreground">—</span>}</TableCell>
      <TableCell>
        <CountPair {...store.apiKeys} />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <CountPair {...store.webhooks} />
          {store.hasLegacyWebhook && <ToneBadge tone="neutral">Webhook lama</ToneBadge>}
          {!store.webhooks.live.total && !store.webhooks.sandbox.total && !store.hasLegacyWebhook && (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {store.lastKeyUsedAt ? formatDate(store.lastKeyUsedAt) : 'Belum pernah'}
      </TableCell>
      <TableCell className="text-right">
        <Link href={`/admin/integrations/${store.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Lihat
        </Link>
      </TableCell>
    </TableRow>
  );
}

export default function IntegrationsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-integrations', { page, search }],
    queryFn: () => adminApi.getIntegrations({ page, search }),
    placeholderData: keepPreviousData,
  });
  const stores = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Integrasi Merchant"
        description="Pengaturan API Key dan Webhook tiap merchant. Hanya untuk dilihat."
      >
        <SearchForm
          placeholder="Cari toko atau pemilik..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
      </PageHeader>

      <p className="text-xs text-muted-foreground">
        Angka pada API Key dan Webhook menunjukkan <strong>aktif/total</strong>.
      </p>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Toko / Merchant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Proyek</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Webhook</TableHead>
              <TableHead>Key Terakhir Dipakai</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!stores.length} emptyText="Tidak ada merchant ditemukan" />
            {stores.map((store) => (
              <Row key={store.id} store={store} />
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}
