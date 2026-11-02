'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppWindow, Pencil, Plus } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { EXTERNAL_APPS_KEY } from './shared';

export default function AdminExternalApps() {
  const { data, isLoading, error } = useQuery({ queryKey: EXTERNAL_APPS_KEY, queryFn: adminApi.getExternalApps, select: (res) => res.data });
  const remove = useApiMutation(adminApi.deleteExternalApp, { invalidate: [EXTERNAL_APPS_KEY] });
  const rows = data ?? [];

  return (
    <>
      <PageHeader title="Aplikasi Eksternal" description="Kelola versi, update wajib, dan pengumuman untuk aplikasi Android lain di luar Autoko MyPG.">
        <Link href="/admin/external-apps/new" className={buttonVariants()}>
          <Plus /> Tambah Aplikasi
        </Link>
      </PageHeader>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aplikasi</TableHead>
              <TableHead>Versi Terbaru</TableHead>
              <TableHead>Minimum</TableHead>
              <TableHead>Pengumuman</TableHead>
              <TableHead className="text-right">Pengecekan 7 Hari</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada aplikasi eksternal. Klik Tambah Aplikasi." />
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AppWindow className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <Link href={`/admin/external-apps/${a.id}`} className="hover:underline">
                          {a.name}
                        </Link>{' '}
                        {!a.isActive && <ToneBadge tone="neutral">Nonaktif</ToneBadge>}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{a.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{a.latestVersionCode ? `${a.latestVersionName || '-'} (kode ${a.latestVersionCode})` : <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>{a.minVersionCode ? `Kode ${a.minVersionCode}` : <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell className="max-w-56">
                  {a.announcement ? (
                    <p className="truncate text-sm" title={a.announcement}>
                      {a.announcement}
                      {a.announcementEndsAt && <span className="block text-xs text-muted-foreground">s.d. {formatDate(a.announcementEndsAt)}</span>}
                    </p>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{(a.recentChecks ?? 0).toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/external-apps/${a.id}`} className={buttonVariants({ variant: 'outline', size: 'xs' })}>
                      <Pencil /> Edit
                    </Link>
                    <ConfirmAction
                      destructive
                      size="xs"
                      title={`Hapus ${a.name}?`}
                      description="Aplikasi dan statistik pengecekannya dihapus. Aplikasi yang masih memanggil API ini akan menerima 404."
                      confirmLabel="Hapus"
                      onConfirm={() => remove.mutateAsync(a.id)}
                    >
                      Hapus
                    </ConfirmAction>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
