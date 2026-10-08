'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { merchantApi, type DashboardData } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import type { BankAccount } from '@/types';
import { estimateWithdrawalFee, MIN_WITHDRAWAL } from './fee';

export function WithdrawalForm({ dashboard, bankAccounts }: { dashboard: DashboardData; bankAccounts: BankAccount[] }) {
  const available = dashboard.availableBalance;
  const maxAmount = Math.floor(dashboard.wdMaxAmount ? Math.min(available, dashboard.wdMaxAmount) : available);

  const schema = z.object({
    amount: z
      .number({ error: 'Nominal wajib diisi' })
      .min(MIN_WITHDRAWAL, `Minimal ${formatCurrency(MIN_WITHDRAWAL)}`)
      .max(maxAmount, `Maksimal ${formatCurrency(maxAmount)}`),
    bankAccountId: z.string().min(1, 'Pilih rekening tujuan'),
    note: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  // Satu rekening saja: langsung terpilih
  const defaultBankId = bankAccounts.length === 1 ? String(bankAccounts[0].id) : '';
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { bankAccountId: defaultBankId, note: '' } });
  const { errors } = form.formState;
  const [amount, bankAccountId] = useWatch({ control: form.control, name: ['amount', 'bankAccountId'] });

  const selectedBank = bankAccounts.find((b) => String(b.id) === bankAccountId);
  const validAmount = Number.isFinite(amount) && amount >= MIN_WITHDRAWAL;
  const fee = estimateWithdrawalFee(validAmount ? amount : MIN_WITHDRAWAL, dashboard, selectedBank?.bankName);
  const canWithdraw = available >= MIN_WITHDRAWAL && bankAccounts.length > 0;

  const mutation = useApiMutation(
    (data: FormValues) =>
      merchantApi.createWithdrawal({ amount: data.amount, bankAccountId: Number(data.bankAccountId), note: data.note }),
    {
      successMessage: 'Penarikan berhasil diajukan dan menunggu proses admin.',
      invalidate: [['merchant-withdrawals'], ['merchant-dashboard'], ['merchant-auto-withdrawal']],
      onSuccess: () => form.reset({ bankAccountId: defaultBankId, note: '' }),
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajukan Penarikan</CardTitle>
        <CardDescription>
          Bisa ditarik: <strong className="text-emerald-600">{formatCurrency(available)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!bankAccounts.length ? (
          <div className="space-y-3 rounded-lg border border-dashed p-6 text-center text-sm">
            <p className="text-muted-foreground">Belum ada rekening yang disetujui admin.</p>
            <Link href="/dashboard/bank-accounts" className="font-medium text-primary underline">
              Tambah rekening bank
            </Link>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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

            <FormField
              label="Jumlah Penarikan"
              htmlFor="wd-amount"
              error={errors.amount?.message}
              hint={`Min ${formatCurrency(MIN_WITHDRAWAL)}${dashboard.wdMaxAmount ? ` · maks ${formatCurrency(dashboard.wdMaxAmount)} per transaksi` : ''}`}
            >
              <div className="flex gap-2">
                <Input
                  id="wd-amount"
                  type="number"
                  inputMode="numeric"
                  placeholder="Contoh: 50000"
                  {...form.register('amount', { valueAsNumber: true })}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={maxAmount < MIN_WITHDRAWAL}
                  onClick={() => form.setValue('amount', maxAmount, { shouldValidate: true })}
                >
                  Tarik Semua
                </Button>
              </div>
            </FormField>

            <dl className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Jumlah penarikan</dt>
                <dd>{validAmount ? formatCurrency(amount) : '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Biaya admin{selectedBank ? '' : ' (estimasi)'}</dt>
                <dd className="text-red-600">- {formatCurrency(fee)}</dd>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-semibold">
                <dt>Dana diterima</dt>
                <dd className="text-emerald-600">{validAmount ? formatCurrency(Math.max(0, amount - fee)) : '-'}</dd>
              </div>
            </dl>

            <FormField label="Catatan (opsional)" htmlFor="wd-note">
              <Textarea id="wd-note" rows={2} placeholder="Catatan tambahan untuk admin..." {...form.register('note')} />
            </FormField>

            <p className="flex gap-2 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0" />
              Saldo langsung dipotong saat pengajuan dibuat. Penarikan manual masih bisa dibatalkan selama berstatus Pending.
            </p>

            <Button type="submit" className="w-full" size="lg" disabled={!canWithdraw || mutation.isPending}>
              {mutation.isPending ? 'Mengirim...' : canWithdraw ? 'Kirim Pengajuan' : `Saldo minimal ${formatCurrency(MIN_WITHDRAWAL)}`}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
