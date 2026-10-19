'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Coins, Pencil, Plus, Trash2, Users, Wallet } from 'lucide-react';
import { adminApi, type Subadmin } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { TableState } from '@/components/shared/TableState';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { FormField } from '@/components/shared/FormField';
import { ToneBadge } from '@/components/shared/StatusBadge';

export const SUBADMINS_KEY = ['admin-subadmins'];
const KEYS = SUBADMINS_KEY;
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
export function SubadminDialog({
  subadmin,
  takenBy,
  withLabel,
}: {
  subadmin?: Subadmin;
  takenBy: Map<number, string>;
  withLabel?: boolean;
}) {
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
        withLabel ? (
          <Button variant="outline" onClick={openDialog}>
            <Pencil /> Ubah Akun
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={openDialog} aria-label="Ubah sub admin">
            <Pencil />
          </Button>
        )
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

/** id QRIS -> nama sub admin lain yang sudah memegangnya (satu QRIS hanya satu sub admin). */
export const qrisHolders = (subadmins: Subadmin[], exceptUserId?: number) =>
  new Map(subadmins.filter((s) => s.id !== exceptUserId).flatMap((s) => s.qris.map((q) => [q.id, s.name] as const)));

export default function Subadmins() {
  const { data, isLoading, error } = useQuery({ queryKey: KEYS, queryFn: adminApi.getSubadmins, select: (res) => res.data });

  const toggle = useApiMutation(({ id, isActive }: { id: number; isActive: boolean }) => adminApi.updateSubadmin(id, { isActive }), {
    invalidate: [KEYS],
    successMessage: 'Status sub admin disimpan',
  });
  const remove = useApiMutation(adminApi.deleteSubadmin, { invalidate: [KEYS] });

  const subadmins = data ?? [];
  const total = (pick: (s: Subadmin) => number) => subadmins.reduce((sum, s) => sum + pick(s), 0);

  return (
    <>
      <PageHeader
        title="Sub Admin"
        description="Akun yang memegang QRIS tertentu: memantau transaksinya, menandai dibayar, dan mentransfer penarikan merchant."
      >
        <SubadminDialog takenBy={qrisHolders(subadmins)} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sub Admin"
          icon={Users}
          value={subadmins.length.toLocaleString('id-ID')}
          hint={`${subadmins.filter((s) => s.isActive).length} aktif`}
        />
        <StatCard label="Total Saldo Dipegang" icon={Wallet} value={formatCurrency(total((s) => s.balance))} hint="Semua sub admin" />
        <StatCard label="Total Saldo Pendapatan" icon={Coins} value={formatCurrency(total((s) => s.income))} hint="Belum disetor" />
        <StatCard label="Masuk Hari Ini" icon={CalendarCheck} value={formatCurrency(total((s) => s.todayIncome))} hint="Semua QRIS (WIB)" />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sub Admin</TableHead>
              <TableHead>QRIS</TableHead>
              <TableHead className="text-right">Saldo Dipegang</TableHead>
              <TableHead className="text-right">Pendapatan</TableHead>
              <TableHead className="text-right">Masuk Hari Ini</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!subadmins.length} emptyText="Belum ada sub admin" />
            {subadmins.map((s) => (
              <TableRow key={s.id} className={s.isActive ? undefined : 'opacity-60'}>
                <TableCell>
                  <Link href={`/admin/subadmins/${s.id}`} className="group flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium group-hover:text-primary group-hover:underline">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">{s.email}</span>
                    </span>
                  </Link>
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
                <TableCell className="text-right whitespace-nowrap">{formatCurrency(s.income)}</TableCell>
                <TableCell className="text-right whitespace-nowrap text-emerald-600">{formatCurrency(s.todayIncome)}</TableCell>
                <TableCell>
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(checked) => toggle.mutate({ id: s.id, isActive: checked })}
                    disabled={toggle.isPending}
                    aria-label={`Aktifkan ${s.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/subadmins/${s.id}`} className={buttonVariants({ size: 'sm' })}>
                      <Wallet /> Kelola Saldo
                    </Link>
                    <SubadminDialog subadmin={s} takenBy={qrisHolders(subadmins, s.id)} />
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
