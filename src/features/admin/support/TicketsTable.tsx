'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminSupportApi } from '@/lib/api/support';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TicketList } from '@/features/support/TicketList';
import { TICKET_STATUS_TABS } from '@/features/support/utils';

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
      <PageHeader title="Support Tiket" description="Pertanyaan dan kendala dari merchant, terbaru di atas.">
        <SearchForm
          placeholder="Cari subjek atau merchant..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </PageHeader>

      <StatusTabs
        tabs={TICKET_STATUS_TABS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <TicketList
        tickets={tickets}
        viewer="ADMIN"
        hrefFor={(t) => `/admin/support/${t.id}`}
        isLoading={isLoading}
        error={error}
        empty={search || status ? 'Tidak ada tiket yang cocok dengan filter.' : 'Belum ada tiket dari merchant.'}
      />

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}
