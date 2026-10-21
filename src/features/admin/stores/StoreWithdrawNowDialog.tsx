'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Zap } from 'lucide-react';
import { adminApi, type AdminStore } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/utils';
import { estimateWithdrawalFee } from '@/features/merchant/withdrawals/fee';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { AmountInput } from '@/components/shared/AmountInput';

/** Validasi sama dengan backend (createStoreWithdrawalNow); pesan final tetap dari backend. */
function amountError(
  amount: number | undefined,
  fee: number,
  preview: { availableBalance: number; minAmount: number },
  max: number | null,
) {
  if (!amount) return 'Nominal wajib diisi';
  if (amount < preview.minAmount) return `Minimum penarikan ${formatCurrency(preview.minAmount)}`;
  if (amount > preview.availableBalance) return `Melebihi saldo tersedia ${formatCurrency(preview.availableBalance)}`;
  if (max && amount > max) return `Maksimal per transaksi ${formatCurrency(max)}`;
  if (amount <= fee) return 'Nominal harus lebih besar dari biaya admin';
}

/** Admin menjalankan penarikan otomatis satu toko sekarang juga, tanpa menunggu jadwal auto penarikan. */
export function WithdrawNowDialog({ store }: { store: AdminStore }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | undefined>();

  const previewKey = ['admin-store-withdraw-now', store.id];
  const { data: preview, isLoading } = useQuery({
    queryKey: previewKey,
    queryFn: () => adminApi.getStoreWithdrawNowPreview(store.id),
    select: (res) => res.data,
    enabled: open,
    // Saldo bisa berubah kapan saja, jadi selalu ambil ulang tiap dialog dibuka
    gcTime: 0,
  });

  const mutation = useApiMutation(() => adminApi.runStoreWithdrawNow(store.id, amount), {
    invalidate: [['admin-stores'], ['admin-store-balance', store.id], ['admin-withdrawals']],
    onSuccess: () => setOpen(false),
  });

  const openDialog = () => {
    setAmount(undefined);
    setOpen(true);
  };

  const bank = preview?.bankAccount;
  // Nominal kosong = default seluruh saldo yang bisa ditarik
  const value = amount ?? preview?.maxAmount;
  const fee = bank && value ? estimateWithdrawalFee(value, store, bank.bankName) : 0;
  const error = preview && bank ? amountError(value, fee, preview, store.wdMaxAmount) : undefined;

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <Zap /> Tarik Sekarang
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarik Sekarang</DialogTitle>
            <DialogDescription>
              Buat penarikan otomatis untuk <span className="font-medium text-foreground">{store.name}</span> sekarang, tanpa menunggu
              jadwal.
            </DialogDescription>
          </DialogHeader>

          {isLoading || !preview ? (
            <Skeleton className="h-40" />
          ) : !bank ? (
            <p className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" /> Merchant belum memiliki rekening bank yang disetujui.
            </p>
          ) : (
            <form
              id="withdraw-now"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!error) mutation.mutate();
              }}
            >
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo tersedia</p>
                  <p className="font-semibold">{formatCurrency(preview.availableBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rekening tujuan</p>
                  <p className="font-semibold">
                    {bank.bankName} {bank.accountNumber}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">a.n. {bank.accountHolder}</p>
                </div>
              </div>

              <FormField
                label="Nominal penarikan"
                htmlFor="withdraw-now-amount"
                error={error}
                hint={`Kosongkan untuk menarik ${formatCurrency(preview.maxAmount)}${
                  store.wdMaxAmount && preview.maxAmount < preview.availableBalance ? ' (maks. per transaksi)' : ' (seluruh saldo tersedia)'
                }.`}
              >
                <AmountInput id="withdraw-now-amount" value={amount} invalid={!!error} onChange={setAmount} />
              </FormField>

              {value && !error ? (
                <div className="space-y-1 rounded-lg border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nominal ditarik</span>
                    <span>{formatCurrency(value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya admin (estimasi)</span>
                    <span>- {formatCurrency(fee)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Banknote className="size-4" /> Diterima merchant
                    </span>
                    <span className="text-emerald-600">{formatCurrency(value - fee)}</span>
                  </div>
                </div>
              ) : null}
            </form>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="withdraw-now" disabled={!bank || !!error || mutation.isPending}>
              {mutation.isPending ? 'Memproses...' : 'Konfirmasi Tarik'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
