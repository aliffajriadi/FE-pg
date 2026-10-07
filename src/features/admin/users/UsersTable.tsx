'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { ChangePasswordDialog, CreateUserDialog, UserLimitDialog } from './UserDialogs';

export default function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', { page, search }],
    queryFn: () => adminApi.getUsers({ page, search }),
    placeholderData: keepPreviousData,
  });

  const suspend = useApiMutation(adminApi.suspendUser, {
    successMessage: 'Pengguna dinonaktifkan',
    invalidate: [['admin-users']],
  });
  const activate = useApiMutation(adminApi.activateUser, {
    successMessage: 'Pengguna diaktifkan',
    invalidate: [['admin-users']],
  });

  const users = data?.data ?? [];

  return (
    <>
      <PageHeader title="Manajemen Pengguna" description="Kelola akun merchant dan admin.">
        <SearchForm
          placeholder="Cari nama atau email..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <CreateUserDialog />
      </PageHeader>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!users.length} emptyText="Belum ada pengguna" />
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <ToneBadge tone={user.role === 'ADMIN' ? 'info' : 'neutral'}>{user.role === 'ADMIN' ? 'Admin' : 'Merchant'}</ToneBadge>
                </TableCell>
                <TableCell>
                  <ToneBadge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Aktif' : 'Nonaktif'}</ToneBadge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(user.createdAt, false)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {user.isActive ? (
                      <ConfirmAction
                        destructive
                        title="Nonaktifkan pengguna?"
                        description={`${user.email} tidak akan bisa login sampai diaktifkan kembali.`}
                        confirmLabel="Nonaktifkan"
                        onConfirm={() => suspend.mutateAsync(user.id)}
                      >
                        Nonaktifkan
                      </ConfirmAction>
                    ) : (
                      <ConfirmAction
                        title="Aktifkan pengguna?"
                        description={user.email}
                        confirmLabel="Aktifkan"
                        onConfirm={() => activate.mutateAsync(user.id)}
                      >
                        Aktifkan
                      </ConfirmAction>
                    )}
                    <ChangePasswordDialog user={user} />
                    <UserLimitDialog user={user} />
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
