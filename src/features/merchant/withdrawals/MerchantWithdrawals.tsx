'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { merchantApi, type DashboardData } from '@/lib/api/merchant';
import { assetUrl } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import type { Withdrawal } from '@/types';
import { describeFeeRule, MIN_WITHDRAWAL, NON_DANA_SURCHARGE } from './fee';
import { WithdrawalForm } from './WithdrawalForm';
import { AutoWithdrawalCard, formatHours } from './AutoWithdrawalCard';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

function TypeBadge({ isAuto }: { isAuto?: boolean }) {
  return isAuto ? <Badge variant="secondary">Otomatis</Badge> : <Badge variant="outline">Manual</Badge>;
}

function DetailDialog({ withdrawal: w }: { withdrawal: Withdrawal }) {
  const [open, setOpen] = useState(false);
  const rows: [string, React.ReactNode][] = [
    ['Jenis', <TypeBadge key="type" isAuto={w.isAuto} />],
    ['Status', <StatusBadge key="status" status={w.status} />],
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
    ['Catatan', w.note || '-'],
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
            <DialogTitle>Detail Penarikan #{w.id}</DialogTitle>
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

function Stat({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${className ?? ''}`}>{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BalanceSummary({ d }: { d: DashboardData }) {
  const auto = d.autoWithdrawal;

  return (
    <Card className="border-t-4 border-t-primary">
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Saldo Bisa Ditarik</p>
          <p className="text-3xl font-bold tracking-tight text-emerald-600">{formatCurrency(d.availableBalance)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t pt-4 lg:grid-cols-3">
          <Stat
            label="Saldo Tertunda"
            value={formatCurrency(d.pendingBalance)}
            hint={`Ditahan ${d.balanceHoldHours} jam`}
            className="text-amber-600"
          />
          <Stat label="Total Saldo" value={formatCurrency(d.totalBalance)} />
          {auto?.enabled && (
            <div className="col-span-2 lg:col-span-1">
              <Stat
                label={`Penarikan Otomatis (tiap ${formatHours(auto.hours)})`}
                value={auto.nextRunAt ? formatDate(auto.nextRunAt) : 'Menunggu siklus'}
                hint={
                  auto.bankAccount ? (
                    `ke ${auto.bankAccount.bankName} ${auto.bankAccount.accountNumber}`
                  ) : (
                    <span className="text-destructive">Belum ada rekening disetujui</span>
                  )
                }
                className="text-base"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RulesCard({ d }: { d: DashboardData }) {
  const auto = d.autoWithdrawal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ketentuan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            Biaya penarikan <strong className="text-foreground">{describeFeeRule(d)}</strong>, ditambah{' '}
            <strong className="text-foreground">{formatCurrency(NON_DANA_SURCHARGE)}</strong> jika rekening tujuan selain DANA.
          </li>
          <li>
            Minimal penarikan <strong className="text-foreground">{formatCurrency(MIN_WITHDRAWAL)}</strong>
            {d.wdMaxAmount && (
              <>
                , maksimal <strong className="text-foreground">{formatCurrency(d.wdMaxAmount)}</strong> per transaksi
              </>
            )}
            .
          </li>
          <li>
            Hasil penjualan ditahan <strong className="text-foreground">{d.balanceHoldHours} jam</strong> sebagai Saldo Tertunda
            sebelum bisa ditarik.
          </li>
          {auto?.enabled && (
            <li>Penarikan otomatis dilewati jika saldo di bawah minimal, dan dicoba lagi di siklus berikutnya.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function WithdrawalHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant-withdrawals', { page, search, status }],
    queryFn: () => merchantApi.getWithdrawals({ page, search, status }),
    placeholderData: keepPreviousData,
  });

  const cancel = useApiMutation(merchantApi.cancelWithdrawal, {
    invalidate: [['merchant-withdrawals'], ['merchant-dashboard'], ['merchant-auto-withdrawal']],
  });

  const withdrawals = data?.data ?? [];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Riwayat Penarikan</h2>
        <SearchForm
          placeholder="Cari bank atau rekening..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </div>
      <StatusTabs
        tabs={STATUS_TABS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />
      {/* Mobile: daftar kartu */}
      <div className="space-y-2 md:hidden">
        {isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : !withdrawals.length ? (
          <Card>
            <CardContent className="text-center text-sm text-muted-foreground">Belum ada riwayat penarikan</CardContent>
          </Card>
        ) : (
          withdrawals.map((w) => (
            <Card key={w.id} className="py-3">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-600">{formatCurrency(w.amount - (w.fee ?? 0))}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {w.bankName} · {w.bankAccount}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={w.status} />
                    <TypeBadge isAuto={w.isAuto} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</p>
                  <div className="flex gap-2">
                    <DetailDialog withdrawal={w} />
                    {w.status === 'PENDING' && !w.isAuto && (
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
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop: tabel */}
      <Card className="hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Rekening</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Dana Diterima</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!withdrawals.length} emptyText="Belum ada riwayat penarikan" />
            {withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(w.createdAt)}</TableCell>
                <TableCell>
                  <TypeBadge isAuto={w.isAuto} />
                </TableCell>
                <TableCell>
                  <p>{w.bankName}</p>
                  <p className="text-xs text-muted-foreground">{w.bankAccount}</p>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatCurrency(w.amount)}</TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap text-emerald-600">
                  {formatCurrency(w.amount - (w.fee ?? 0))}
                </TableCell>
                <TableCell>
                  <StatusBadge status={w.status} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <DetailDialog withdrawal={w} />
                    {w.status === 'PENDING' && !w.isAuto && (
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
    </section>
  );
}

export default function MerchantWithdrawals() {
  const dashboard = useQuery({ queryKey: ['merchant-dashboard'], queryFn: merchantApi.getDashboard, select: (r) => r.data });
  const banks = useQuery({
    queryKey: ['merchant-bank-accounts'],
    queryFn: merchantApi.getBankAccounts,
    select: (r) => r.data.filter((b) => b.status === 'APPROVED'),
  });

  const d = dashboard.data;
  const loading = dashboard.isLoading || banks.isLoading;

  return (
    <>
      <PageHeader title="Tarik Saldo" description="Tarik saldo ke rekening yang sudah disetujui, manual maupun otomatis." />

      {loading ? (
        <>
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </>
      ) : !d ? (
        <Card>
          <CardContent className="text-destructive">Gagal memuat saldo: {dashboard.error?.message}</CardContent>
        </Card>
      ) : (
        <>
          <BalanceSummary d={d} />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <WithdrawalForm dashboard={d} bankAccounts={banks.data ?? []} />
            <div className="space-y-4">
              <AutoWithdrawalCard bankAccounts={banks.data ?? []} />
              <RulesCard d={d} />
            </div>
          </div>
        </>
      )}

      <WithdrawalHistory />
    </>
  );
}
