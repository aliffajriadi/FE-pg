'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminGuidesApi } from '@/lib/api/guides';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';

export const AUDIENCE_LABEL = { ALL: 'Semua merchant', MYPG: 'Merchant MyPG' } as const;
export const merchantGuideHref = (audience: 'ALL' | 'MYPG', slug: string) =>
  audience === 'MYPG' ? `/dashboard/mypg/guides/${slug}` : `/dashboard/guides/${slug}`;

export default function AdminGuides() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-guides'], queryFn: adminGuidesApi.list, select: (res) => res.data });
  const remove = useApiMutation(adminGuidesApi.remove, { invalidate: [['admin-guides']] });
  const rows = data ?? [];

  return (
    <>
      <PageHeader title="Tata Cara" description="Tulis panduan berisi teks, langkah, gambar, dan video untuk merchant.">
        <Link href="/admin/guides/new" className={buttonVariants()}>
          <Plus /> Buat Panduan
        </Link>
      </PageHeader>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Pembaca</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Urutan</TableHead>
              <TableHead>Diperbarui</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada panduan" />
            {rows.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <p className="font-medium">{g.title}</p>
                  {g.summary && <p className="line-clamp-1 text-xs text-muted-foreground">{g.summary}</p>}
                </TableCell>
                <TableCell>{AUDIENCE_LABEL[g.audience]}</TableCell>
                <TableCell>
                  <ToneBadge tone={g.isPublished ? 'success' : 'warning'}>{g.isPublished ? 'Terbit' : 'Draf'}</ToneBadge>
                </TableCell>
                <TableCell className="text-right">{g.sortOrder}</TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(g.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    {g.isPublished && (
                      <Link
                        href={merchantGuideHref(g.audience, g.slug)}
                        target="_blank"
                        className={buttonVariants({ variant: 'ghost', size: 'icon-xs' })}
                        title="Lihat seperti merchant"
                        aria-label="Lihat seperti merchant"
                      >
                        <ExternalLink />
                      </Link>
                    )}
                    <Link href={`/admin/guides/${g.id}`} className={buttonVariants({ variant: 'outline', size: 'xs' })}>
                      <Pencil /> Edit
                    </Link>
                    <ConfirmAction
                      destructive
                      variant="ghost"
                      size="xs"
                      className="text-destructive"
                      title={`Hapus "${g.title}"?`}
                      description="Panduan langsung hilang dari halaman merchant. Tindakan ini tidak bisa dibatalkan."
                      confirmLabel="Hapus"
                      onConfirm={() => remove.mutateAsync(g.id)}
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
    </>
  );
}
