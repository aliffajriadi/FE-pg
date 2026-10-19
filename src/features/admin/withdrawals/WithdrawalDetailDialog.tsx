'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye, UserCheck } from 'lucide-react';
import { adminApi, type AdminWithdrawal } from '@/lib/api/admin';
import type { WithdrawalStatus } from '@/types';
import { statusLabel } from '@/lib/status';
import { assetUrl } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { PhotoInput } from '@/components/shared/PhotoInput';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

type Mode = 'detail' | 'pay' | 'reject' | 'status' | 'assign';
type Action = Exclude<Mode, 'detail' | 'assign'>;

const WD_STATUSES: WithdrawalStatus[] = ['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'];
// Status yang saldonya masih terpotong (sama dengan logika backend)
const HELD_STATUSES: WithdrawalStatus[] = ['PENDING', 'APPROVED', 'PAID'];
// Status yang masih bisa dilempar ke sub admin
const ASSIGNABLE_STATUSES: WithdrawalStatus[] = ['PENDING', 'APPROVED'];
const INVALIDATE = [['admin-withdrawals'], ['admin-stores'], ['admin-subadmins']];

export function WithdrawalDetailDialog({ withdrawal: w }: { withdrawal: AdminWithdrawal }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('detail');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [noteError, setNoteError] = useState('');
  const [newStatus, setNewStatus] = useState<WithdrawalStatus | ''>('');
  const [statusError, setStatusError] = useState('');
  const [subadminId, setSubadminId] = useState('');

  const fee = w.fee ?? 0;
  const net = w.amount - fee;

  const openDialog = () => {
    setMode('detail');
    setNote('');
    setPhoto(null);
    setNoteError('');
    setNewStatus('');
    setStatusError('');
    setSubadminId('');
    setOpen(true);
  };

  const canAssign = ASSIGNABLE_STATUSES.includes(w.status);
  const subadmins = useQuery({
    queryKey: ['admin-subadmins'],
    queryFn: adminApi.getSubadmins,
    select: (res) => res.data.filter((s) => s.isActive),
    enabled: open && mode === 'assign',
  });
  const subadminOptions = (subadmins.data ?? []).map((s) => ({
    value: String(s.id),
    label: `${s.name} — saldo ${formatCurrency(s.balance)}${s.balance < net ? ' (kurang)' : ''}`,
    disabled: s.balance < net || s.id === w.assignedSubadmin?.id,
  }));

  const assign = useApiMutation((id: number | null) => adminApi.assignWithdrawal(w.id, id), {
    invalidate: INVALIDATE,
    onSuccess: () => setOpen(false),
  });

  const mutation = useApiMutation(
    (action: Action) => {
      const body = new FormData();
      if (note) body.append('note', note);
      if (photo) body.append('photo', photo);
      if (action === 'status') {
        body.append('status', newStatus);
        return adminApi.updateWithdrawalStatus(w.id, body);
      }
      return action === 'pay' ? adminApi.markWithdrawalPaid(w.id, body) : adminApi.rejectWithdrawal(w.id, body);
    },
    {
      invalidate: INVALIDATE,
      onSuccess: () => setOpen(false),
    },
  );

  const balanceEffect =
    newStatus && HELD_STATUSES.includes(w.status) !== HELD_STATUSES.includes(newStatus)
      ? HELD_STATUSES.includes(newStatus)
        ? 'debit'
        : 'credit'
      : null;

  const submit = (action: Action) => {
    if (action === 'status' && !newStatus) return setStatusError('Pilih status baru');
    const needsReason = action === 'reject' || (action === 'status' && newStatus === 'REJECTED');
    if (needsReason && !note.trim()) return setNoteError('Alasan penolakan wajib diisi');
    mutation.mutate(action);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <Eye /> Detail
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === 'pay'
                ? 'Konfirmasi Pembayaran Penarikan'
                : mode === 'reject'
                  ? 'Tolak Penarikan'
                  : mode === 'status'
                    ? 'Ubah Status Penarikan'
                    : mode === 'assign'
                      ? 'Lempar ke Sub Admin'
                      : 'Detail Penarikan'}
            </DialogTitle>
          </DialogHeader>

          <div className="divide-y text-sm">
            <Row label="Toko / Merchant">
              <p className="font-semibold">{w.store.name}</p>
              <p className="text-xs text-muted-foreground">{w.store.user?.name}</p>
            </Row>
            <Row label="Sisa Saldo">
              <p className="font-semibold">{formatCurrency(w.store.balance)}</p>
              <p className="text-xs text-muted-foreground">Total: {formatCurrency(w.store.totalBalance)}</p>
            </Row>
            <Row label="Jumlah (Gross)">{formatCurrency(w.amount)}</Row>
            <Row label="Biaya Admin">
              <span className="text-red-600">- {formatCurrency(fee)}</span>
            </Row>
            <Row label="Net Transfer">
              <span className="text-base font-bold text-emerald-600">{formatCurrency(net)}</span>
            </Row>
            <Row label="Rekening Tujuan">
              <p className="font-semibold">{w.bankName}</p>
              <p>{w.bankAccount}</p>
              <p className="text-xs text-muted-foreground">a.n. {w.bankHolderName}</p>
            </Row>
            {mode === 'detail' && (
              <>
                <Row label="Jenis">{w.isAuto ? 'Otomatis (sistem)' : 'Manual (merchant)'}</Row>
                <Row label={w.isAuto ? 'Catatan Sistem' : 'Catatan Merchant'}>{w.note || '-'}</Row>
                <Row label="Catatan Admin">
                  {w.adminNote || '-'}
                  {w.adminPhotoUrl && (
                    <a href={assetUrl(w.adminPhotoUrl)} target="_blank" rel="noreferrer" className="block text-xs text-primary underline">
                      Lihat bukti
                    </a>
                  )}
                </Row>
                <Row label="Status">
                  <StatusBadge status={w.status} />
                </Row>
                {w.assignedSubadmin && (
                  <Row label="Ditangani Sub Admin">
                    <p className="font-semibold">{w.assignedSubadmin.name}</p>
                    {w.status === 'PAID' ? (
                      <p className="text-xs text-muted-foreground">
                        {w.paidBySubadmin ? 'Ditransfer dari saldo sub admin' : 'Dibayar langsung oleh admin'}
                      </p>
                    ) : (
                      w.assignedAt && <p className="text-xs text-muted-foreground">Sejak {formatDate(w.assignedAt)}</p>
                    )}
                  </Row>
                )}
                <Row label="Tanggal Dibuat">{formatDate(w.createdAt)}</Row>
              </>
            )}
          </div>

          {mode === 'reject' && (
            <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                Penarikan ditolak dan <strong>saldo akan dikembalikan</strong> otomatis ke merchant.
              </span>
            </div>
          )}

          {mode === 'assign' && (
            <div className="space-y-3">
              <FormField label="Sub Admin *" htmlFor="wd-subadmin">
                <SimpleSelect
                  id="wd-subadmin"
                  value={subadminId}
                  onValueChange={setSubadminId}
                  options={subadminOptions}
                  placeholder={subadmins.isLoading ? 'Memuat...' : subadminOptions.length ? 'Pilih sub admin' : 'Belum ada sub admin aktif'}
                />
              </FormField>
              <div className="flex gap-2 rounded-lg bg-blue-500/15 p-3 text-sm text-blue-700 dark:text-blue-400">
                <UserCheck className="size-4 shrink-0" />
                <span>
                  Sub admin mentransfer <strong>{formatCurrency(net)}</strong> ke rekening merchant dari uang yang dipegangnya, lalu
                  saldonya otomatis berkurang. Biaya admin tidak ditampilkan ke sub admin.
                </span>
              </div>
            </div>
          )}

          {mode === 'status' && (
            <div className="space-y-3">
              <FormField label="Status Baru *" htmlFor="wd-status" error={statusError}>
                <SimpleSelect
                  id="wd-status"
                  value={newStatus}
                  onValueChange={(v) => {
                    setNewStatus(v as WithdrawalStatus);
                    setStatusError('');
                    setNoteError('');
                  }}
                  options={WD_STATUSES.filter((s) => s !== w.status).map((s) => ({ value: s, label: statusLabel(s) }))}
                  placeholder={`Saat ini: ${statusLabel(w.status)}`}
                />
              </FormField>
              {w.status === 'PAID' && w.paidBySubadmin && newStatus && (
                <div className="flex gap-2 rounded-lg bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>
                    Potongan saldo sub admin {w.assignedSubadmin?.name} sebesar {formatCurrency(net)} akan <strong>dibatalkan</strong>.
                  </span>
                </div>
              )}
              {balanceEffect && (
                <div className="flex gap-2 rounded-lg bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>
                    {balanceEffect === 'credit' ? (
                      <>
                        Saldo merchant akan <strong>dikembalikan</strong> sebesar {formatCurrency(w.amount)}.
                      </>
                    ) : (
                      <>
                        Saldo merchant akan <strong>dipotong lagi</strong> sebesar {formatCurrency(w.amount)}.
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {mode !== 'detail' && mode !== 'assign' && (
            <div className="space-y-4">
              <FormField
                label={
                  mode === 'reject' || (mode === 'status' && newStatus === 'REJECTED') ? 'Alasan Penolakan *' : 'Catatan Admin (Opsional)'
                }
                htmlFor="wd-note"
                error={noteError}
              >
                <Textarea
                  id="wd-note"
                  rows={3}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setNoteError('');
                  }}
                  placeholder={mode === 'reject' ? 'Contoh: Nomor rekening tidak valid...' : 'Contoh: Sudah transfer ke rekening BCA...'}
                />
              </FormField>
              <FormField label={mode === 'reject' ? 'Foto Bukti (Opsional)' : 'Foto Bukti Transfer (Opsional)'}>
                <PhotoInput id="wd-photo" file={photo} onChange={setPhoto} />
              </FormField>
            </div>
          )}

          <DialogFooter>
            {mode === 'detail' ? (
              <>
                <Button variant="outline" onClick={() => setMode('status')}>
                  Ubah Status
                </Button>
                {canAssign && w.assignedSubadmin && (
                  <Button variant="outline" onClick={() => assign.mutate(null)} disabled={assign.isPending}>
                    Tarik dari Sub Admin
                  </Button>
                )}
                {canAssign && (
                  <Button variant="outline" onClick={() => setMode('assign')}>
                    <UserCheck /> {w.assignedSubadmin ? 'Ganti Sub Admin' : 'Lempar ke Sub Admin'}
                  </Button>
                )}
                {w.status === 'PENDING' && (
                  <>
                    <Button variant="destructive" onClick={() => setMode('reject')}>
                      Tolak
                    </Button>
                    <Button onClick={() => setMode('pay')}>Bayar</Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode('detail')} disabled={mutation.isPending || assign.isPending}>
                  Kembali
                </Button>
                {mode === 'assign' ? (
                  <Button onClick={() => assign.mutate(Number(subadminId))} disabled={!subadminId || assign.isPending}>
                    {assign.isPending ? 'Memproses...' : 'Lempar'}
                  </Button>
                ) : (
                  <Button
                    variant={mode === 'reject' || (mode === 'status' && newStatus === 'REJECTED') ? 'destructive' : 'default'}
                    onClick={() => submit(mode)}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending
                      ? 'Memproses...'
                      : mode === 'reject'
                        ? 'Tolak Penarikan'
                        : mode === 'status'
                          ? 'Simpan Status'
                          : 'Tandai Dibayar'}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
