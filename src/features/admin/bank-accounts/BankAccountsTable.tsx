'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
];

export default function BankAccountsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-bank-accounts', { page, search, status }],
    queryFn: () => adminApi.getBankAccounts({ page, search, status }),
    placeholderData: keepPreviousData,
  });

  const options = { invalidate: [['admin-bank-accounts']] };
  const approve = useApiMutation(adminApi.approveBankAccount, options);
  const reject = useApiMutation(adminApi.rejectBankAccount, options);
  const remove = useApiMutation(adminApi.deleteBankAccount, options);

  const accounts = data?.data ?? [];

  return (
    <>
      <PageHeader title="Persetujuan Rekening" description="Verifikasi rekening bank yang diajukan merchant.">
        <SearchForm
          placeholder="Cari toko, bank, rekening..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </PageHeader>

      <StatusTabs
        tabs={STATUS_TABS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Toko / Merchant</TableHead>
              <TableHead>Info Rekening</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Diajukan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={5} isLoading={isLoading} error={error} isEmpty={!accounts.length} emptyText="Tidak ada data rekening" />
            {accounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium">{acc.store?.name}</TableCell>
                <TableCell>
                  <p className="font-medium">{acc.bankName}</p>
                  <p className="text-xs text-muted-foreground">{acc.accountNumber}</p>
                  <p className="text-xs text-muted-foreground">a.n. {acc.accountHolder}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={acc.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(acc.createdAt, false)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {acc.status === 'PENDING' && (
                      <>
                        <ConfirmAction
                          title="Setujui rekening ini?"
                          description={`${acc.bankName} - ${acc.accountNumber} a.n. ${acc.accountHolder}`}
                          confirmLabel="Setujui"
                          onConfirm={() => approve.mutateAsync(acc.id)}
                        >
                          Setujui
                        </ConfirmAction>
                        <ConfirmAction
                          destructive
                          title="Tolak rekening ini?"
                          description={`${acc.bankName} - ${acc.accountNumber} a.n. ${acc.accountHolder}`}
                          confirmLabel="Tolak"
                          onConfirm={() => reject.mutateAsync(acc.id)}
                        >
                          Tolak
                        </ConfirmAction>
                      </>
                    )}
                    <ConfirmAction
                      destructive
                      size="icon-sm"
                      title="Hapus rekening?"
                      description="Rekening akan dihapus permanen dari sistem."
                      confirmLabel="Hapus"
                      aria-label="Hapus rekening"
                      onConfirm={() => remove.mutateAsync(acc.id)}
                    >
                      <Trash2 />
                    </ConfirmAction>
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
