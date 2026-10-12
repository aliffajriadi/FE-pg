'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Landmark, Loader2, Plus, Trash2 } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';

const BANKS_KEY = ['merchant-bank-accounts'];

const E_WALLETS = ['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'];
const BANKS = [
  'BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Permata', 'Danamon', 'BTN', 'OCBC NISP',
  'Maybank', 'Panin', 'Mega', 'Jago', 'SeaBank', 'Blu by BCA Digital', 'Neo Commerce', 'Jenius (BTPN)',
];
const BANK_OPTIONS = [
  ...E_WALLETS.map((name) => ({ value: name, label: `${name} (E-Wallet)` })),
  ...BANKS.map((name) => ({ value: name, label: name })),
];
const isWallet = (name: string) => E_WALLETS.includes(name);

const bankSchema = z
  .object({
    bankName: z.string().min(1, 'Pilih bank atau e-wallet'),
    accountNumber: z.string().trim().regex(/^\d+$/, 'Hanya angka, tanpa spasi atau tanda hubung'),
    accountHolder: z.string().trim().min(3, 'Nama pemilik wajib diisi'),
  })
  .superRefine((data, ctx) => {
    const len = data.accountNumber.length;
    const [min, max, label] = isWallet(data.bankName) ? [10, 15, 'Nomor HP'] : [8, 20, 'Nomor rekening'];
    if (/^\d+$/.test(data.accountNumber) && (len < min || len > max)) {
      ctx.addIssue({ code: 'custom', path: ['accountNumber'], message: `${label} harus ${min}-${max} digit` });
    }
  });
type BankForm = z.infer<typeof bankSchema>;

function AddBankDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: { bankName: '', accountNumber: '', accountHolder: '' },
  });
  const { errors } = form.formState;
  const bankName = useWatch({ control: form.control, name: 'bankName' });
  const wallet = isWallet(bankName);

  const mutation = useApiMutation(merchantApi.createBankAccount, {
    successMessage: 'Rekening ditambahkan dan menunggu persetujuan admin',
    invalidate: [BANKS_KEY],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Tambah Rekening
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-md">
          <DialogHeader className="border-b bg-muted/40 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Landmark className="size-5" />
              </span>
              <div className="space-y-0.5">
                <DialogTitle>Tambah Rekening Baru</DialogTitle>
                <DialogDescription>Rekening tujuan untuk penarikan saldo Anda.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5 p-6">
            <FormField label="Bank / E-Wallet" htmlFor="bank-name" error={errors.bankName?.message}>
              <Controller
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <SimpleSelect
                    id="bank-name"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={BANK_OPTIONS}
                    placeholder="Pilih bank atau e-wallet"
                  />
                )}
              />
            </FormField>

            <FormField
              label={wallet ? 'Nomor HP' : 'Nomor Rekening'}
              htmlFor="bank-number"
              error={errors.accountNumber?.message}
              hint={wallet ? 'Nomor HP yang terdaftar di e-wallet, contoh: 081234567890.' : 'Hanya angka, tanpa spasi atau tanda hubung.'}
            >
              <Input
                id="bank-number"
                inputMode="numeric"
                autoComplete="off"
                placeholder={wallet ? '081234567890' : '1234567890'}
                {...form.register('accountNumber', {
                  onChange: (e) => form.setValue('accountNumber', e.target.value.replace(/\D/g, ''), { shouldValidate: form.formState.isSubmitted }),
                })}
              />
            </FormField>

            <FormField
              label="Atas Nama"
              htmlFor="bank-holder"
              error={errors.accountHolder?.message}
              hint="Harus sama persis dengan nama pemilik di buku tabungan atau aplikasi."
            >
              <Input id="bank-holder" autoComplete="off" placeholder="Nama lengkap pemilik" {...form.register('accountHolder')} />
            </FormField>

            <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Rekening akan ditinjau admin dulu sebelum bisa dipakai untuk penarikan. Periksa kembali data sebelum menyimpan.
            </p>

            <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  'Simpan Rekening'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MerchantBankAccounts() {
  const { data, isLoading, error } = useQuery({
    queryKey: BANKS_KEY,
    queryFn: merchantApi.getBankAccounts,
    select: (res) => res.data,
  });
  const remove = useApiMutation(merchantApi.deleteBankAccount, { invalidate: [BANKS_KEY] });
  const accounts = data ?? [];

  return (
    <>
      <PageHeader title="Rekening Saya" description="Rekening tujuan untuk penarikan saldo.">
        <AddBankDialog />
      </PageHeader>

      <p className="flex gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="size-4 shrink-0" />
        Rekening yang ditambahkan harus disetujui admin sebelum bisa dipakai untuk penarikan saldo.
      </p>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Bank</TableHead>
              <TableHead>Nomor Rekening</TableHead>
              <TableHead>Atas Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!accounts.length} emptyText="Belum ada rekening yang ditambahkan" />
            {accounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium">{acc.bankName}</TableCell>
                <TableCell>{acc.accountNumber}</TableCell>
                <TableCell>{acc.accountHolder}</TableCell>
                <TableCell>
                  <StatusBadge status={acc.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(acc.createdAt, false)}</TableCell>
                <TableCell className="text-right">
                  {acc.status === 'APPROVED' ? (
                    <span className="text-xs text-muted-foreground italic">Hubungi admin untuk menghapus</span>
                  ) : (
                    <ConfirmAction
                      destructive
                      title="Hapus rekening ini?"
                      description={`${acc.bankName} - ${acc.accountNumber}`}
                      confirmLabel="Hapus"
                      onConfirm={() => remove.mutateAsync(acc.id)}
                    >
                      <Trash2 /> Hapus
                    </ConfirmAction>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
