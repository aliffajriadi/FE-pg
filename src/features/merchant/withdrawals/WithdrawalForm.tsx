'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { merchantApi, type DashboardData } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import type { BankAccount } from '@/types';
import { estimateWithdrawalFee, MIN_WITHDRAWAL } from './fee';

export function WithdrawalForm({ dashboard, bankAccounts }: { dashboard: DashboardData; bankAccounts: BankAccount[] }) {
  const available = dashboard.availableBalance;
  const maxAmount = dashboard.wdMaxAmount ? Math.min(available, dashboard.wdMaxAmount) : available;

  const schema = z.object({
    amount: z
      .number({ error: 'Nominal wajib diisi' })
      .min(MIN_WITHDRAWAL, `Minimal ${formatCurrency(MIN_WITHDRAWAL)}`)
      .max(maxAmount, `Maksimal ${formatCurrency(maxAmount)}`),
    bankAccountId: z.string().min(1, 'Pilih rekening tujuan'),
    note: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { bankAccountId: '', note: '' } });
  const { errors } = form.formState;
  const [amount, bankAccountId] = useWatch({ control: form.control, name: ['amount', 'bankAccountId'] });

  const selectedBank = bankAccounts.find((b) => String(b.id) === bankAccountId);
  const fee = estimateWithdrawalFee(amount || MIN_WITHDRAWAL, dashboard, selectedBank?.bankName);
  const canWithdraw = available >= MIN_WITHDRAWAL;

  const mutation = useApiMutation(
    (data: FormValues) =>
      merchantApi.createWithdrawal({ amount: data.amount, bankAccountId: Number(data.bankAccountId), note: data.note }),
    {
      successMessage: 'Penarikan berhasil diajukan. Saldo telah dipotong dan menunggu proses admin.',
      invalidate: [['merchant-withdrawals'], ['merchant-dashboard']],
      onSuccess: () => form.reset({ bankAccountId: '', note: '' }),
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajukan Penarikan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="flex justify-between">
            <span>Saldo Utama (bisa ditarik)</span>
            <strong className="text-emerald-600">{formatCurrency(available)}</strong>
          </p>
          <p className="flex justify-between text-xs text-muted-foreground">
            <span>Saldo Tertunda (hold {dashboard.balanceHoldHours} jam)</span>
            <span>{formatCurrency(dashboard.pendingBalance)}</span>
          </p>
        </div>

        {!canWithdraw && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            Saldo Utama minimal {formatCurrency(MIN_WITHDRAWAL)} untuk mengajukan penarikan.
          </p>
        )}

        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <FormField
            label={`Jumlah Penarikan (min ${formatCurrency(MIN_WITHDRAWAL)}${dashboard.wdMaxAmount ? `, maks ${formatCurrency(dashboard.wdMaxAmount)}` : ''})`}
            htmlFor="wd-amount"
            error={errors.amount?.message}
          >
            <Input id="wd-amount" type="number" placeholder="Contoh: 50000" {...form.register('amount', { valueAsNumber: true })} />
          </FormField>
          <p className="-mt-2 text-xs text-muted-foreground">
            Biaya admin: <strong>{formatCurrency(fee)}</strong>
            {amount >= MIN_WITHDRAWAL && (
              <>
                {' '}
                · Dana diterima: <strong className="text-emerald-600">{formatCurrency(amount - fee)}</strong>
              </>
            )}
          </p>

          <FormField label="Rekening Tujuan" htmlFor="wd-bank" error={errors.bankAccountId?.message}>
            <Controller
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <SimpleSelect
                  id="wd-bank"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="-- Pilih Rekening --"
                  options={bankAccounts.map((b) => ({
                    value: String(b.id),
                    label: `${b.bankName} - ${b.accountNumber} (${b.accountHolder})`,
                  }))}
                />
              )}
            />
          </FormField>
          {!bankAccounts.length && (
            <p className="-mt-2 text-xs text-destructive">
              Belum ada rekening yang disetujui.{' '}
              <Link href="/dashboard/bank-accounts" className="underline">
                Tambah rekening
              </Link>
            </p>
          )}

          <FormField label="Catatan (Opsional)" htmlFor="wd-note">
            <Textarea id="wd-note" rows={2} placeholder="Catatan tambahan untuk admin..." {...form.register('note')} />
          </FormField>

          <p className="flex gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0" />
            Saldo Utama langsung dipotong saat pengajuan dibuat. Selama status masih Pending, Anda bisa membatalkannya.
          </p>

          <Button type="submit" className="w-full" size="lg" disabled={!canWithdraw || mutation.isPending}>
            {mutation.isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
