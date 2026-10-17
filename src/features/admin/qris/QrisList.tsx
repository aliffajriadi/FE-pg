'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Plus, Receipt, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { adminApi, type QrisStatsValues, type RankingPeriod } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { StatCard } from '@/components/shared/StatCard';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { PERIOD_OPTIONS } from '@/features/admin/tracking/TransactionTracking';

const QRIS_KEY = ['admin-manual-qris'];

const qrisSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  qrisString: z.string().trim().min(1, 'String QRIS wajib diisi'),
});

function CreateQrisDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof qrisSchema>>({
    resolver: zodResolver(qrisSchema),
  });
  const { errors } = form.formState;
  const qrisString = useWatch({ control: form.control, name: 'qrisString' }) ?? '';

  const mutation = useApiMutation(adminApi.createManualQris, {
    invalidate: [QRIS_KEY, ['admin-settings'], ['admin-qris-stats']],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Tambah QRIS
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah QRIS Manual</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Nama / Label" htmlFor="qris-name" error={errors.name?.message}>
              <Input id="qris-name" placeholder="Misal: QRIS Dana Utama" {...form.register('name')} />
            </FormField>
            <FormField label="String Statis QRIS" htmlFor="qris-string" error={errors.qrisString?.message}>
              <Textarea
                id="qris-string"
                rows={5}
                className="font-mono text-xs"
                placeholder="Tempel string QRIS lengkap (diawali 000201010211...)"
                {...form.register('qrisString')}
              />
            </FormField>
            {qrisString.trim() && !qrisString.trim().startsWith('00020101') && (
              <p className="rounded-md bg-amber-500/15 p-2 text-xs text-amber-700 dark:text-amber-400">
                Peringatan: string QRIS biasanya diawali dengan &quot;00020101&quot;. Pastikan string sudah benar.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan QRIS'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const PROVIDER_LABEL = {
  DANA: 'DANA',
  SHOPEEPAY: 'ShopeePay',
  GOPAY: 'GoPay',
} as const;

const successRate = (s: QrisStatsValues) => (s.totalOrders ? `${Math.round((s.paidCount / s.totalOrders) * 100)}%` : '-');

function StatsCells({ stats }: { stats: QrisStatsValues }) {
  return (
    <>
      <TableCell>
        <span className="font-medium">{stats.paidCount.toLocaleString('id-ID')}</span>
        <span className="text-muted-foreground"> / {stats.totalOrders.toLocaleString('id-ID')}</span>
        {stats.pendingCount > 0 && <p className="text-xs text-amber-600">{stats.pendingCount} menunggu</p>}
      </TableCell>
      <TableCell>{successRate(stats)}</TableCell>
      <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(stats.volume)}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(stats.revenue)}</TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">{stats.lastPaidAt ? formatDate(stats.lastPaidAt) : '-'}</TableCell>
    </>
  );
}

export default function QrisList() {
  const [period, setPeriod] = useState<RankingPeriod>('30d');
  const { data, isLoading, error } = useQuery({
    queryKey: QRIS_KEY,
    queryFn: adminApi.getManualQris,
    select: (res) => res.data,
  });
  const stats = useQuery({
    queryKey: ['admin-qris-stats', period],
    queryFn: () => adminApi.getQrisStats(period),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
  });
  const remove = useApiMutation(adminApi.deleteManualQris, {
    successMessage: 'QRIS dihapus',
    invalidate: [QRIS_KEY, ['admin-settings'], ['admin-qris-stats']],
  });

  const list = data ?? [];
  const statsById = new Map(stats.data?.items.map((item) => [item.id, item]));
  const totals = stats.data?.totals;
  const unknown = stats.data?.unknown;

  return (
    <>
      <PageHeader
        title="QRIS"
        description="QRIS statis untuk gateway manual (DANA, ShopeePay, GoPay) beserta statistik transaksinya. Sandbox tidak dihitung."
      >
        <SimpleSelect
          id="qris-period"
          value={period}
          onValueChange={(v) => setPeriod((v || '30d') as RankingPeriod)}
          options={PERIOD_OPTIONS}
          className="sm:w-44"
        />
        <CreateQrisDialog />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Transaksi Berhasil"
          icon={Receipt}
          value={(totals?.paidCount ?? 0).toLocaleString('id-ID')}
          hint={totals ? `dari ${totals.totalOrders.toLocaleString('id-ID')} invoice · sukses ${successRate(totals)}` : undefined}
        />
        <StatCard label="Total Uang Masuk" icon={Wallet} value={formatCurrency(totals?.volume ?? 0)} hint="Semua QRIS, invoice dibayar" />
        <StatCard label="Pendapatan Platform" icon={TrendingUp} value={formatCurrency(totals?.revenue ?? 0)} hint="Fee + kode unik" />
        <StatCard
          label="Menunggu Pembayaran"
          icon={Clock}
          value={(totals?.pendingCount ?? 0).toLocaleString('id-ID')}
          hint={totals ? `${totals.failedCount.toLocaleString('id-ID')} kedaluwarsa / batal` : undefined}
        />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QRIS</TableHead>
              <TableHead>Dipakai</TableHead>
              <TableHead>Berhasil / Invoice</TableHead>
              <TableHead>Sukses</TableHead>
              <TableHead className="text-right">Uang Masuk</TableHead>
              <TableHead className="text-right">Pendapatan</TableHead>
              <TableHead>Terakhir Dibayar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              colSpan={8}
              isLoading={isLoading}
              error={error}
              isEmpty={!list.length}
              emptyText="Belum ada QRIS yang ditambahkan"
            />
            {list.map((q) => {
              const item = statsById.get(q.id);
              return (
                <TableRow key={q.id}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{q.name}</span>
                      {item?.provider && <ToneBadge tone="neutral">{PROVIDER_LABEL[item.provider]}</ToneBadge>}
                      {item?.isDefault && <ToneBadge tone="info">Default</ToneBadge>}
                    </div>
                    <p className="max-w-56 truncate font-mono text-xs text-muted-foreground" title={q.qrisString}>
                      #{q.id} · {q.qrisString}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item ? (
                      <>
                        <span className="font-medium">{item.storesCustom + item.storesDefault} toko</span>
                        {item.storesDefault > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.storesDefault} ikut default
                            {item.storesCustom > 0 && `, ${item.storesCustom} khusus`}
                          </p>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {item ? (
                    <StatsCells stats={item} />
                  ) : (
                    <TableCell colSpan={5} className="text-muted-foreground">
                      {stats.isError ? 'Gagal memuat statistik' : 'Memuat...'}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <ConfirmAction
                      destructive
                      size="icon-sm"
                      aria-label="Hapus QRIS"
                      title={`Hapus QRIS "${q.name}"?`}
                      description="QRIS yang masih dipakai toko atau sebagai default sistem tidak bisa dihapus. Riwayat statistiknya tetap tercatat."
                      confirmLabel="Hapus"
                      onConfirm={() => remove.mutateAsync(q.id)}
                    >
                      <Trash2 />
                    </ConfirmAction>
                  </TableCell>
                </TableRow>
              );
            })}
            {unknown && (
              <TableRow className="bg-muted/30">
                <TableCell>
                  <span className="font-medium text-muted-foreground">QRIS terhapus / tidak dikenali</span>
                  <p className="text-xs text-muted-foreground">Invoice lama yang QRIS-nya sudah tidak ada di daftar</p>
                </TableCell>
                <TableCell>-</TableCell>
                <StatsCells stats={unknown} />
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
