'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowUpRight, Clock, Wallet } from 'lucide-react';
import { subadminApi, type SubadminWithdrawal } from '@/lib/api/subadmin';
import { assetUrl } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import { StatCard } from '@/components/shared/StatCard';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { CopyButton } from '@/components/shared/CopyButton';
import { FormField } from '@/components/shared/FormField';
import { PhotoInput } from '@/components/shared/PhotoInput';

const STATUS_TABS = [
  { value: 'OPEN', label: 'Perlu Ditransfer' },
  { value: 'DONE', label: 'Selesai' },
  { value: 'ALL', label: 'Semua' },
];
const OPEN_STATUSES = ['PENDING', 'APPROVED'];
const INVALIDATE = [['subadmin-withdrawals'], ['subadmin-balance'], ['subadmin-balance-logs'], ['subadmin-balance-daily']];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

/** Detail penarikan + aksi: tandai sudah ditransfer (saldo dipotong) atau kembalikan ke admin. */
function WithdrawalDialog({ withdrawal: w, balance }: { withdrawal: SubadminWithdrawal; balance?: number }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'detail' | 'pay' | 'return'>('detail');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');

  const isOpen = OPEN_STATUSES.includes(w.status);
  const insufficient = balance !== undefined && balance < w.transferAmount;

  const openDialog = () => {
    setMode('detail');
    setNote('');
    setPhoto(null);
    setError('');
    setOpen(true);
  };

  const mutation = useApiMutation(
    () => {
      if (mode === 'return') return subadminApi.returnWithdrawal(w.id, note.trim());
      const body = new FormData();
      if (note.trim()) body.append('note', note.trim());
      if (photo) body.append('photo', photo);
      return subadminApi.markWithdrawalPaid(w.id, body);
    },
    { invalidate: INVALIDATE, onSuccess: () => setOpen(false) },
  );

  const submit = () => {
    if (mode === 'return' && !note.trim()) return setError('Alasan wajib diisi');
    mutation.mutate();
  };

  return (
    <>
      <Button variant={isOpen ? 'default' : 'outline'} size="sm" onClick={openDialog}>
        {isOpen ? 'Proses' : 'Detail'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === 'pay' ? 'Konfirmasi Transfer' : mode === 'return' ? 'Kembalikan ke Admin' : `Penarikan #${w.id}`}
            </DialogTitle>
            <DialogDescription>
              {mode === 'return'
                ? 'Penarikan dikembalikan ke admin untuk ditangani. Saldo Anda tidak berubah.'
                : 'Transfer nominal di bawah ke rekening merchant, lalu tandai sudah ditransfer.'}
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y text-sm">
            <Row label="Merchant">
              <span className="font-semibold">{w.store.name}</span>
            </Row>
            <Row label="Nominal Transfer">
              <span className="inline-flex items-center gap-1">
                <span className="text-base font-bold text-emerald-600">{formatCurrency(w.transferAmount)}</span>
                <CopyButton value={String(w.transferAmount)} label="Salin nominal" />
              </span>
            </Row>
            <Row label="Rekening Tujuan">
              <p className="font-semibold">{w.bankName}</p>
              <p className="inline-flex items-center gap-1 font-mono">
                {w.bankAccount}
                <CopyButton value={w.bankAccount} label="Salin nomor rekening" />
              </p>
              <p className="text-xs text-muted-foreground">a.n. {w.bankHolderName}</p>
            </Row>
            {mode === 'detail' && (
              <>
                <Row label="Catatan Merchant">{w.note || '-'}</Row>
                <Row label="Status">
                  <StatusBadge status={w.status} />
                </Row>
                <Row label="Ditugaskan">{w.assignedAt ? formatDate(w.assignedAt) : '-'}</Row>
                {w.paidAt && <Row label="Ditransfer">{formatDate(w.paidAt)}</Row>}
                {(w.adminNote || w.adminPhotoUrl) && (
                  <Row label="Catatan Transfer">
                    {w.adminNote || '-'}
                    {w.adminPhotoUrl && (
                      <a href={assetUrl(w.adminPhotoUrl)} target="_blank" rel="noreferrer" className="block text-xs text-primary underline">
                        Lihat bukti
                      </a>
                    )}
                  </Row>
                )}
              </>
            )}
          </div>

          {mode === 'pay' && (
            <div
              className={
                insufficient
                  ? 'flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive'
                  : 'flex gap-2 rounded-lg bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400'
              }
            >
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                {insufficient ? (
                  <>Saldo Anda ({formatCurrency(balance)}) tidak cukup untuk penarikan ini. Kembalikan ke admin.</>
                ) : (
                  <>
                    Saldo Anda akan <strong>dipotong {formatCurrency(w.transferAmount)}</strong>
                    {balance !== undefined && <> (sisa {formatCurrency(balance - w.transferAmount)})</>}.
                  </>
                )}
              </span>
            </div>
          )}

          {mode !== 'detail' && (
            <div className="space-y-4">
              <FormField label={mode === 'return' ? 'Alasan *' : 'Catatan (Opsional)'} htmlFor="sub-wd-note" error={error}>
                <Textarea
                  id="sub-wd-note"
                  rows={3}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setError('');
                  }}
                  placeholder={mode === 'return' ? 'Contoh: Nama pemilik rekening tidak sesuai...' : 'Contoh: Transfer via BCA mobile...'}
                />
              </FormField>
              {mode === 'pay' && (
                <FormField label="Foto Bukti Transfer (Opsional)">
                  <PhotoInput id="sub-wd-photo" file={photo} onChange={setPhoto} />
                </FormField>
              )}
            </div>
          )}

          <DialogFooter>
            {mode === 'detail' ? (
              isOpen && (
                <>
                  <Button variant="outline" onClick={() => setMode('return')}>
                    Kembalikan ke Admin
                  </Button>
                  <Button onClick={() => setMode('pay')}>Sudah Ditransfer</Button>
                </>
              )
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode('detail')} disabled={mutation.isPending}>
                  Kembali
                </Button>
                <Button
                  variant={mode === 'return' ? 'destructive' : 'default'}
                  onClick={submit}
                  disabled={mutation.isPending || (mode === 'pay' && insufficient)}
                >
                  {mutation.isPending ? 'Memproses...' : mode === 'return' ? 'Kembalikan' : 'Tandai Sudah Ditransfer'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SubadminWithdrawals() {
  const [status, setStatus] = useState<'OPEN' | 'DONE' | 'ALL'>('OPEN');
  const [page, setPage] = useState(1);

  const balance = useQuery({ queryKey: ['subadmin-balance'], queryFn: subadminApi.getBalance, select: (res) => res.data });
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['subadmin-withdrawals', status, page],
    queryFn: () => subadminApi.getWithdrawals({ status, page }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });

  const withdrawals = data?.data ?? [];
  const openTotal = status === 'OPEN' ? withdrawals.reduce((sum, w) => sum + w.transferAmount, 0) : undefined;

  return (
    <>
      <PageHeader
        title="Penarikan Merchant"
        description="Penarikan yang diteruskan admin ke Anda. Transfer ke rekening merchant dari uang yang Anda pegang; saldo otomatis berkurang."
      >
        <RefreshButton onRefresh={() => Promise.all([refetch(), balance.refetch()])} loading={isFetching || balance.isFetching} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo Dipegang"
          icon={Wallet}
          value={balance.data ? formatCurrency(balance.data.balance) : '-'}
          hint="Sumber dana transfer"
        />
        <StatCard
          label="Perlu Ditransfer"
          icon={Clock}
          value={(data?.openCount ?? 0).toLocaleString('id-ID')}
          hint={openTotal !== undefined && data?.pagination.totalPages === 1 ? `Total ${formatCurrency(openTotal)}` : 'Penarikan menunggu'}
        />
        <StatCard
          label="Total Ditransfer"
          icon={ArrowUpRight}
          value={balance.data ? formatCurrency(balance.data.allTime.withdrawn) : '-'}
          hint={`${(balance.data?.allTime.withdrawnCount ?? 0).toLocaleString('id-ID')} penarikan`}
        />
      </div>

      <StatusTabs
        tabs={STATUS_TABS}
        value={status}
        onChange={(v) => {
          setStatus(v as typeof status);
          setPage(1);
        }}
      />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Rekening Tujuan</TableHead>
              <TableHead className="text-right">Nominal Transfer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ditugaskan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              colSpan={6}
              isLoading={isLoading}
              error={error}
              isEmpty={!withdrawals.length}
              emptyText={status === 'OPEN' ? 'Tidak ada penarikan yang perlu ditransfer' : 'Belum ada penarikan'}
            />
            {withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <p className="font-medium">{w.store.name}</p>
                  <p className="text-xs text-muted-foreground">#{w.id}</p>
                </TableCell>
                <TableCell>
                  <p>{w.bankName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{w.bankAccount}</p>
                  <p className="text-xs text-muted-foreground">a.n. {w.bankHolderName}</p>
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap text-emerald-600">
                  {formatCurrency(w.transferAmount)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <StatusBadge status={w.status} />
                    {w.status === 'PAID' && !w.paidBySubadmin && <ToneBadge tone="neutral">Oleh admin</ToneBadge>}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{w.assignedAt ? formatDate(w.assignedAt) : '-'}</TableCell>
                <TableCell className="text-right">
                  <WithdrawalDialog withdrawal={w} balance={balance.data?.balance} />
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
