'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { adminApi, type Subadmin, type SubadminBalanceAdjustment } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { FormField } from '@/components/shared/FormField';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { AmountInput } from '@/components/shared/AmountInput';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { Pagination } from '@/components/shared/Pagination';
import { Textarea } from '@/components/ui/textarea';
import { BalanceLogTable } from '@/features/subadmin/BalanceLogTable';
import { BalanceBreakdown, DailyRecapTable } from '@/features/subadmin/BalanceRecap';

const KEYS = ['admin-subadmins'];
const MIN_PASSWORD = 8;

interface FormState {
  name: string;
  email: string;
  password: string;
  qrisIds: number[];
}
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState, isEdit: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Nama wajib diisi';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Email tidak valid';
  if ((!isEdit || form.password) && form.password.length < MIN_PASSWORD) errors.password = `Minimal ${MIN_PASSWORD} karakter`;
  if (!form.qrisIds.length) errors.qrisIds = 'Pilih minimal satu QRIS';
  return errors;
}

/** takenBy: id QRIS -> nama sub admin lain yang sudah memegangnya (satu QRIS hanya satu sub admin). */
function SubadminDialog({ subadmin, takenBy }: { subadmin?: Subadmin; takenBy: Map<number, string> }) {
  const isEdit = !!subadmin;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', qrisIds: [] });
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: qrisList } = useQuery({
    queryKey: ['admin-manual-qris'],
    queryFn: adminApi.getManualQris,
    select: (res) => res.data,
    enabled: open,
  });

  const mutation = useApiMutation(
    () => {
      const body = { name: form.name.trim(), email: form.email.trim(), qrisIds: form.qrisIds };
      return subadmin
        ? adminApi.updateSubadmin(subadmin.id, { ...body, ...(form.password ? { password: form.password } : {}) })
        : adminApi.createSubadmin({ ...body, password: form.password });
    },
    { invalidate: [KEYS], onSuccess: () => setOpen(false) },
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleQris = (id: number, checked: boolean) =>
    set('qrisIds', checked ? [...form.qrisIds, id] : form.qrisIds.filter((q) => q !== id));

  const openDialog = () => {
    setForm({ name: subadmin?.name ?? '', email: subadmin?.email ?? '', password: '', qrisIds: subadmin?.qris.map((q) => q.id) ?? [] });
    setErrors({});
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(form, isEdit);
    setErrors(next);
    if (!Object.values(next).some(Boolean)) mutation.mutate();
  };

  return (
    <>
      {subadmin ? (
        <Button variant="ghost" size="icon-sm" onClick={openDialog} aria-label="Ubah sub admin">
          <Pencil />
        </Button>
      ) : (
        <Button onClick={openDialog}>
          <Plus /> Tambah Sub Admin
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah Sub Admin' : 'Tambah Sub Admin'}</DialogTitle>
            <DialogDescription>Sub admin hanya bisa melihat dan menandai dibayar transaksi dari QRIS yang dipilih.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Nama *" htmlFor="sa-name" error={errors.name}>
              <Input id="sa-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </FormField>
            <FormField label="Email *" htmlFor="sa-email" error={errors.email}>
              <Input id="sa-email" type="email" autoComplete="off" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </FormField>
            <FormField
              label={isEdit ? 'Password Baru' : 'Password *'}
              htmlFor="sa-password"
              error={errors.password}
              hint={isEdit ? 'Kosongkan jika tidak diubah.' : `Minimal ${MIN_PASSWORD} karakter.`}
            >
              <Input
                id="sa-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </FormField>
            <FormField label="QRIS yang Boleh Dipantau *" error={errors.qrisIds}>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                {!qrisList ? (
                  <p className="p-1 text-sm text-muted-foreground">Memuat QRIS...</p>
                ) : !qrisList.length ? (
                  <p className="p-1 text-sm text-muted-foreground">Belum ada QRIS. Tambahkan dulu di menu QRIS.</p>
                ) : (
                  qrisList.map((q) => {
                    const holder = takenBy.get(q.id);
                    return (
                      <label
                        key={q.id}
                        className={
                          holder
                            ? 'flex items-center gap-2 rounded-md p-1.5 text-sm text-muted-foreground'
                            : 'flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm hover:bg-muted'
                        }
                      >
                        <input
                          type="checkbox"
                          className="size-4 cursor-pointer rounded accent-primary disabled:cursor-not-allowed"
                          checked={form.qrisIds.includes(q.id)}
                          disabled={!!holder}
                          onChange={(e) => toggleQris(q.id, e.target.checked)}
                        />
                        {q.name}
                        {holder && <span className="text-xs">· dipegang {holder}</span>}
                      </label>
                    );
                  })
                )}
              </div>
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Buat Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ADJUST_OPTIONS = [
  { value: 'SUBTRACT', label: 'Kurangi saldo (mis. uang disetor)' },
  { value: 'ADD', label: 'Tambah saldo' },
];
const LOG_LIMIT = 10;

function BalanceDialog({ subadmin }: { subadmin: Subadmin }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SubadminBalanceAdjustment['type']>('SUBTRACT');
  const [amount, setAmount] = useState<number | undefined>();
  const [description, setDescription] = useState('');
  const [amountError, setAmountError] = useState<string>();
  const [page, setPage] = useState(1);

  const balanceKey = ['admin-subadmin-balance', subadmin.id];
  const { data, isLoading, error } = useQuery({
    queryKey: [...balanceKey, page],
    queryFn: () => adminApi.getSubadminBalance(subadmin.id, { page, limit: LOG_LIMIT }),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const detail = data?.data;

  const mutation = useApiMutation(
    () => adminApi.adjustSubadminBalance(subadmin.id, { type, amount: amount!, description: description.trim() || undefined }),
    {
      invalidate: [KEYS, balanceKey, ['admin-subadmin-daily', subadmin.id]],
      onSuccess: () => {
        setAmount(undefined);
        setDescription('');
        setPage(1);
      },
    },
  );

  const openDialog = () => {
    setType('SUBTRACT');
    setAmount(undefined);
    setDescription('');
    setAmountError(undefined);
    setPage(1);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = detail?.balance ?? subadmin.balance;
    const next = !amount ? 'Nominal wajib diisi' : type === 'SUBTRACT' && amount > balance ? 'Melebihi saldo saat ini' : undefined;
    setAmountError(next);
    if (!next) mutation.mutate();
  };

  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={openDialog} aria-label="Kelola saldo">
        <Wallet />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saldo {subadmin.name}</DialogTitle>
            <DialogDescription>
              Uang yang dipegang sub admin ini dari semua QRIS-nya. Kurangi saldo saat uangnya sudah disetor.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Saldo Dipegang</p>
              <p className="text-lg font-semibold">{formatCurrency(detail?.balance ?? subadmin.balance)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Masuk Hari Ini</p>
              <p className="text-lg font-semibold">{formatCurrency(detail?.today.amount ?? subadmin.todayIncome)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Masuk</p>
              <p className="text-lg font-semibold">{detail ? formatCurrency(detail.allTime.incoming) : '-'}</p>
            </div>
          </div>

          {!!detail?.qris.length && (
            <div className="flex flex-wrap gap-1 text-xs">
              {detail.qris.map((q) => (
                <ToneBadge key={q.id} tone={q.isAssigned ? 'neutral' : 'warning'}>
                  {q.name}: {formatCurrency(q.totalAmount)}
                  {!q.isAssigned && ' (sudah dipindah)'}
                </ToneBadge>
              ))}
            </div>
          )}

          {detail && <BalanceBreakdown breakdown={detail.allTime.breakdown} />}

          <form onSubmit={submit} className="space-y-3 rounded-lg border p-3">
            <FormField label="Jenis" htmlFor="bal-type">
              <SimpleSelect
                id="bal-type"
                value={type}
                onValueChange={(v) => setType((v || 'SUBTRACT') as SubadminBalanceAdjustment['type'])}
                options={ADJUST_OPTIONS}
              />
            </FormField>
            <FormField label="Nominal *" htmlFor="bal-amount" error={amountError}>
              <AmountInput
                id="bal-amount"
                value={amount}
                onChange={(v) => {
                  setAmount(v);
                  setAmountError(undefined);
                }}
                invalid={!!amountError}
              />
            </FormField>
            <FormField label="Catatan" htmlFor="bal-note">
              <Textarea
                id="bal-note"
                rows={2}
                placeholder="Mis. setor tunai ke kantor"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" variant={type === 'SUBTRACT' ? 'destructive' : 'default'} disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : type === 'SUBTRACT' ? 'Kurangi Saldo' : 'Tambah Saldo'}
              </Button>
            </div>
          </form>

          <DailyRecapTable
            id={`recap-period-${subadmin.id}`}
            queryKey={['admin-subadmin-daily', subadmin.id]}
            fetchRecap={(range) => adminApi.getSubadminDailyRecap(subadmin.id, range)}
          />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Riwayat Saldo</p>
            <div className="rounded-lg border">
              <BalanceLogTable logs={detail?.logs ?? []} isLoading={isLoading} error={error} />
            </div>
            <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Subadmins() {
  const { data, isLoading, error } = useQuery({ queryKey: KEYS, queryFn: adminApi.getSubadmins, select: (res) => res.data });

  const toggle = useApiMutation(({ id, isActive }: { id: number; isActive: boolean }) => adminApi.updateSubadmin(id, { isActive }), {
    invalidate: [KEYS],
    successMessage: 'Status sub admin disimpan',
  });
  const remove = useApiMutation(adminApi.deleteSubadmin, { invalidate: [KEYS] });

  const subadmins = data ?? [];
  const holders = new Map(subadmins.flatMap((s) => s.qris.map((q) => [q.id, { userId: s.id, name: s.name }] as const)));
  // QRIS yang dipegang sub admin lain tidak bisa dipilih untuk sub admin ini
  const takenFor = (userId?: number) => new Map([...holders].filter(([, h]) => h.userId !== userId).map(([qrisId, h]) => [qrisId, h.name]));

  return (
    <>
      <PageHeader title="Sub Admin" description="Akun yang memantau transaksi QRIS tertentu dan bisa menandai invoice-nya dibayar.">
        <SubadminDialog takenBy={takenFor()} />
      </PageHeader>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>QRIS</TableHead>
              <TableHead className="text-right">Saldo Dipegang</TableHead>
              <TableHead className="text-right">Masuk Hari Ini</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!subadmins.length} emptyText="Belum ada sub admin" />
            {subadmins.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {s.qris.length
                      ? s.qris.map((q) => (
                          <ToneBadge key={q.id} tone="neutral">
                            {q.name}
                          </ToneBadge>
                        ))
                      : '-'}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(s.balance)}</TableCell>
                <TableCell className="text-right whitespace-nowrap text-emerald-600">{formatCurrency(s.todayIncome)}</TableCell>
                <TableCell>
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(checked) => toggle.mutate({ id: s.id, isActive: checked })}
                    disabled={toggle.isPending}
                    aria-label={`Aktifkan ${s.name}`}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(s.createdAt, false)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <BalanceDialog subadmin={s} />
                    <SubadminDialog subadmin={s} takenBy={takenFor(s.id)} />
                    <ConfirmAction
                      destructive
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus sub admin"
                      title={`Hapus sub admin "${s.name}"?`}
                      description="Akun ini tidak bisa login lagi. Data transaksi tidak terpengaruh. QRIS-nya bisa ditugaskan ke sub admin lain."
                      confirmLabel="Hapus"
                      onConfirm={() => remove.mutateAsync(s.id)}
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
