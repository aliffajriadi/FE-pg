'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminSupportApi } from '@/lib/api/support';
import { formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Dalam Proses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Ditutup' },
];

export default function TicketsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-tickets', { page, search, status }],
    queryFn: () => adminSupportApi.getTickets({ page, search, status }),
    placeholderData: keepPreviousData,
  });

  const tickets = data?.data ?? [];

  return (
    <>
      <PageHeader title="Support Tiket" description="Pertanyaan dan kendala dari merchant.">
        <SearchForm
          placeholder="Cari subjek atau merchant..."
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
              <TableHead>#</TableHead>
              <TableHead>Toko / Merchant</TableHead>
              <TableHead>Subjek</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead>Pesan</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={8} isLoading={isLoading} error={error} isEmpty={!tickets.length} emptyText="Tidak ada tiket ditemukan" />
            {tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground">#{t.id}</TableCell>
                <TableCell>
                  <p className="font-medium">{t.store?.name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{t.store?.user?.name ?? '-'}</p>
                </TableCell>
                <TableCell className="max-w-56 truncate" title={t.subject}>
                  {t.subject}
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.priority} />
                </TableCell>
                <TableCell className="text-muted-foreground">{t._count?.messages ?? 0}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(t.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/support/${t.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Lihat
                  </Link>
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
