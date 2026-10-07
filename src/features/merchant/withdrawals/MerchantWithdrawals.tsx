'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye, Loader2 } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { assetUrl } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import type { Withdrawal } from '@/types';
import { describeFeeRule, NON_DANA_SURCHARGE } from './fee';
import { WithdrawalForm } from './WithdrawalForm';

function DetailDialog({ withdrawal: w }: { withdrawal: Withdrawal }) {
  const [open, setOpen] = useState(false);
  const rows: [string, React.ReactNode][] = [
    ['Jumlah Pengajuan', formatCurrency(w.amount)],
    ['Biaya Admin', <span key="fee" className="text-red-600">- {formatCurrency(w.fee)}</span>],
    ['Dana Diterima', <strong key="net" className="text-emerald-600">{formatCurrency(w.amount - (w.fee ?? 0))}</strong>],
    [
      'Rekening Tujuan',
      <span key="bank">
        <strong>{w.bankName}</strong>
        <br />
        {w.bankAccount}
        <br />
        <span className="text-xs text-muted-foreground">a.n. {w.bankHolderName}</span>
      </span>,
    ],
    ['Catatan Anda', w.note || '-'],
    [
      'Catatan Admin',
      <span key="admin">
        {w.adminNote || '-'}
        {w.adminPhotoUrl && (
          <a href={assetUrl(w.adminPhotoUrl)} target="_blank" rel="noreferrer" className="block text-xs text-primary underline">
            Lihat bukti transfer
          </a>
        )}
      </span>,
    ],
    ['Status', <StatusBadge key="status" status={w.status} />],
    ['Tanggal Dibuat', formatDate(w.createdAt)],
  ];

  return (
    <>
      <Button variant="outline" size="icon-sm" aria-label="Detail penarikan" onClick={() => setOpen(true)}>
        <Eye />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Penarikan</DialogTitle>
          </DialogHeader>
          <div className="divide-y text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-1.5">
                <span className="text-muted-foreground">{label}</span>
                <div className="text-right">{value}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MerchantWithdrawals() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const dashboard = useQuery({ queryKey: ['merchant-dashboard'], queryFn: merchantApi.getDashboard, select: (r) => r.data });
  const banks = useQuery({
    queryKey: ['merchant-bank-accounts'],
    queryFn: merchantApi.getBankAccounts,
    select: (r) => r.data.filter((b) => b.status === 'APPROVED'),
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant-withdrawals', { page, search }],
    queryFn: () => merchantApi.getWithdrawals({ page, search }),
    placeholderData: keepPreviousData,
  });

  const cancel = useApiMutation(merchantApi.cancelWithdrawal, {
    invalidate: [['merchant-withdrawals'], ['merchant-dashboard']],
  });

  const withdrawals = data?.data ?? [];
  const d = dashboard.data;

  return (
    <>
      <PageHeader title="Tarik Saldo" description="Ajukan penarikan saldo ke rekening yang sudah disetujui." />

      {d && (
        <Card>
          <CardHeader>
            <CardTitle>Ketentuan Biaya Admin &amp; Saldo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <ul className="list-disc space-y-1 rounded-lg bg-muted/50 p-4 pl-8">
              <li>
                Biaya penarikan: <strong>{describeFeeRule(d)}</strong> per penarikan.
              </li>
              <li>
                Biaya tambahan <strong>+{formatCurrency(NON_DANA_SURCHARGE)}</strong> jika rekening tujuan selain DANA.
              </li>
              {d.wdMaxAmount && (
                <li>
                  Maksimal penarikan: <strong>{formatCurrency(d.wdMaxAmount)}</strong> per transaksi.
                </li>
              )}
            </ul>
            <p className="rounded-lg bg-muted/50 p-4 text-muted-foreground">
              Hasil penjualan masuk ke <strong className="text-foreground">Saldo Tertunda</strong> selama{' '}
              <strong className="text-foreground">{d.balanceHoldHours} jam</strong> demi keamanan sebelum pindah ke Saldo
              Utama dan bisa ditarik.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {dashboard.isLoading || banks.isLoading ? (
          <Card>
            <CardContent className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat...
            </CardContent>
          </Card>
        ) : d ? (
          <WithdrawalForm dashboard={d} bankAccounts={banks.data ?? []} />
        ) : (
          <Card>
            <CardContent className="text-destructive">Gagal memuat saldo: {dashboard.error?.message}</CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Riwayat Penarikan</h2>
            <SearchForm
              placeholder="Cari bank atau rekening..."
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Dana Diterima</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableState colSpan={5} isLoading={isLoading} error={error} isEmpty={!withdrawals.length} emptyText="Belum ada riwayat penarikan" />
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(w.amount - (w.fee ?? 0))}</TableCell>
                    <TableCell>
                      <p>{w.bankName}</p>
                      <p className="text-xs text-muted-foreground">{w.bankAccount}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(w.createdAt, false)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <DetailDialog withdrawal={w} />
                        {w.status === 'PENDING' && (
                          <ConfirmAction
                            destructive
                            title="Batalkan penarikan?"
                            description={`Penarikan ${formatCurrency(w.amount)} dibatalkan dan saldo dikembalikan ke akun Anda.`}
                            confirmLabel="Batalkan"
                            onConfirm={() => cancel.mutateAsync(w.id)}
                          >
                            Batalkan
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
        </div>
      </div>
    </>
  );
}
