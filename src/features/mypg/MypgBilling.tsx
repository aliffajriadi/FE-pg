'use client';

import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, CheckCircle2, KeyRound, XCircle } from 'lucide-react';
import { mypgApi } from '@/lib/api/mypg';
import { LICENSE_WARNING_DAYS } from './MypgGuard';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';

export const BILLING_KEYS = [['mypg-billing'], ['mypg-summary'], ['me']];

const redeemSchema = z.object({
  code: z
    .string()
    .trim()
    .refine((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^MYPG/, '').length === 12, 'Format kode: MYPG-XXXX-XXXX-XXXX'),
});

function StatusCard() {
  const { data, isLoading } = useQuery({ queryKey: ['mypg-billing'], queryFn: mypgApi.getBilling, select: (res) => res.data });
  if (isLoading || !data) return <Skeleton className="h-36 rounded-xl" />;

  const expiringSoon = data.active && data.daysLeft <= LICENSE_WARNING_DAYS;
  return (
    <Card className={data.active ? (expiringSoon ? 'border-amber-500/50' : 'border-emerald-500/40') : 'border-destructive/40'}>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
            data.active ? (expiringSoon ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600') : 'bg-destructive/10 text-destructive'
          }`}
        >
          {data.active ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">Status Lisensi MyPG</p>
          <p className="text-2xl font-bold">
            {data.active ? `Aktif · ${data.daysLeft} hari lagi` : data.activeUntil ? 'Sudah berakhir' : 'Belum aktif'}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-4" />
            {data.activeUntil
              ? `${data.active ? 'Berlaku hingga' : 'Berakhir pada'} ${formatDate(data.activeUntil)}`
              : 'Masukkan kode lisensi untuk mulai menerima pembayaran MyPG.'}
          </p>
          {data.quota.limit !== null && (
            <p className="text-sm text-muted-foreground">
              Kuota transaksi: {formatCurrency(data.quota.used)} / {formatCurrency(data.quota.limit)} terpakai (sisa{' '}
              {formatCurrency(data.quota.remaining)})
            </p>
          )}
        </div>
      </CardContent>
      {data.active && data.quota.remaining === 0 && (
        <p className="mx-4 mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 sm:mx-6">
          Batas transaksi lisensi sudah habis. Invoice MyPG baru ditolak sampai Anda memasukkan kode lisensi baru.
        </p>
      )}
      {!data.active && (
        <p className="mx-4 mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6">
          Selama lisensi tidak aktif, invoice MyPG baru (API & panel) ditolak. Sandbox tetap bisa dipakai, dan invoice yang sudah
          dibuat tetap diproses saat dibayar.
        </p>
      )}
    </Card>
  );
}

function RedeemCard() {
  const form = useForm<z.infer<typeof redeemSchema>>({ resolver: zodResolver(redeemSchema), defaultValues: { code: '' } });
  const mutation = useApiMutation((data: z.infer<typeof redeemSchema>) => mypgApi.redeemLicense(data.code), {
    invalidate: BILLING_KEYS,
    onSuccess: () => form.reset({ code: '' }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Masukkan Kode Lisensi</CardTitle>
        <CardDescription>
          Masa aktif ditambahkan dari tanggal berakhir lisensi saat ini, jadi memperpanjang lebih awal tidak mengurangi sisa hari.
          Hubungi admin untuk membeli kode lisensi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <FormField label="Kode Lisensi" htmlFor="license-code" error={form.formState.errors.code?.message}>
              <Input
                id="license-code"
                placeholder="MYPG-XXXX-XXXX-XXXX"
                autoComplete="off"
                className="font-mono uppercase"
                {...form.register('code')}
              />
            </FormField>
          </div>
          <Button type="submit" className="sm:mt-6" disabled={mutation.isPending}>
            <KeyRound /> {mutation.isPending ? 'Memproses...' : 'Aktifkan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HistoryCard() {
  const { data, isLoading } = useQuery({ queryKey: ['mypg-billing'], queryFn: mypgApi.getBilling, select: (res) => res.data.history });
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-4">
        <CardTitle>Riwayat Lisensi</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Durasi</TableHead>
            <TableHead>Batas Transaksi</TableHead>
            <TableHead>Ditukarkan</TableHead>
            <TableHead>Masa Aktif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Skeleton className="h-8" />
              </TableCell>
            </TableRow>
          ) : !data?.length ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Belum ada lisensi yang ditukarkan
              </TableCell>
            </TableRow>
          ) : (
            data.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-xs">{l.code}</TableCell>
                <TableCell>{l.durationDays} hari</TableCell>
                <TableCell>{l.maxAmount ? formatCurrency(l.maxAmount) : "Tanpa batas"}</TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(l.redeemedAt)}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDate(l.activeFrom, false)} – {formatDate(l.activeUntil, false)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function MypgBilling() {
  return (
    <>
      <PageHeader title="Billing MyPG" description="Kelola masa aktif lisensi MyPG toko Anda." />
      <StatusCard />
      <RedeemCard />
      <HistoryCard />
    </>
  );
}
