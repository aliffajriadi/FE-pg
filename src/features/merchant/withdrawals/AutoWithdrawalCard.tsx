'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { merchantApi, type AutoWithdrawalInfo } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import type { BankAccount } from '@/types';

const DEFAULT_BANK = 'default';

/** Pilihan cepat interval, dipangkas sesuai batas admin */
const PRESETS = [
  { hours: 6, label: '6 jam' },
  { hours: 12, label: '12 jam' },
  { hours: 24, label: '1 hari' },
  { hours: 48, label: '2 hari' },
  { hours: 72, label: '3 hari' },
];

export function formatHours(hours: number) {
  if (hours % 24 === 0) return `${hours / 24} hari`;
  return `${hours} jam`;
}

function AutoWithdrawalForm({ info, bankAccounts }: { info: AutoWithdrawalInfo; bankAccounts: BankAccount[] }) {
  const [hours, setHours] = useState(String(info.hours));
  const [bankAccountId, setBankAccountId] = useState(info.bankAccountId ? String(info.bankAccountId) : DEFAULT_BANK);

  const parsedHours = Number(hours);
  const hoursError =
    !Number.isInteger(parsedHours) || parsedHours < info.minHours || parsedHours > info.maxHours
      ? `Isi antara ${info.minHours} - ${info.maxHours} jam`
      : undefined;
  const isDirty =
    parsedHours !== info.hours || bankAccountId !== (info.bankAccountId ? String(info.bankAccountId) : DEFAULT_BANK);

  const mutation = useApiMutation(
    () =>
      merchantApi.updateAutoWithdrawal({
        hours: parsedHours,
        bankAccountId: bankAccountId === DEFAULT_BANK ? null : Number(bankAccountId),
      }),
    { invalidate: [['merchant-auto-withdrawal'], ['merchant-dashboard']] }
  );

  const presets = PRESETS.filter((p) => p.hours <= info.maxHours);
  const bankOptions = [
    { value: DEFAULT_BANK, label: 'Otomatis (rekening disetujui pertama)' },
    ...bankAccounts.map((b) => ({ value: String(b.id), label: `${b.bankName} - ${b.accountNumber} (${b.accountHolder})` })),
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!hoursError) mutation.mutate();
      }}
      className="space-y-4"
    >
      <FormField label={`Tarik setiap (maks ${formatHours(info.maxHours)})`} htmlFor="auto-wd-hours" error={hoursError}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.hours}
                type="button"
                size="sm"
                variant="outline"
                className={cn(parsedHours === p.hours && 'border-primary bg-primary/10 text-primary')}
                onClick={() => setHours(String(p.hours))}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="auto-wd-hours"
              type="number"
              inputMode="numeric"
              min={info.minHours}
              max={info.maxHours}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">jam</span>
          </div>
        </div>
      </FormField>

      <FormField label="Rekening Tujuan" htmlFor="auto-wd-bank">
        <SimpleSelect id="auto-wd-bank" value={bankAccountId} onValueChange={setBankAccountId} options={bankOptions} />
      </FormField>

      <Button type="submit" variant="secondary" className="w-full" disabled={!isDirty || !!hoursError || mutation.isPending}>
        {mutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </Button>
    </form>
  );
}

export function AutoWithdrawalCard({ bankAccounts }: { bankAccounts: BankAccount[] }) {
  const { data: info, isLoading } = useQuery({
    queryKey: ['merchant-auto-withdrawal'],
    queryFn: merchantApi.getAutoWithdrawal,
    select: (r) => r.data,
  });

  if (isLoading) return <Skeleton className="h-72 rounded-xl" />;
  if (!info?.enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penarikan Otomatis</CardTitle>
        <CardDescription>
          Saldo yang bisa ditarik akan dikirim otomatis ke rekening Anda jika mengendap selama interval ini. Penarikan
          otomatis tidak dapat dibatalkan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AutoWithdrawalForm key={`${info.hours}-${info.bankAccountId}`} info={info} bankAccounts={bankAccounts} />
      </CardContent>
    </Card>
  );
}
