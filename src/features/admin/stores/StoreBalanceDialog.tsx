'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowDownLeft, ArrowRight, ArrowUpRight, Clock, Minus, Plus, Wallet } from 'lucide-react';
import { adminApi, type AdminStore } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { AmountInput } from '@/components/shared/AmountInput';
import { Pagination } from '@/components/shared/Pagination';

type AdjustType = 'CREDIT' | 'DEBIT';

const LOG_LIMIT = 8;
const TYPE_OPTIONS: { value: AdjustType; label: string; icon: typeof Plus; active: string }[] = [
  {
    value: 'CREDIT',
    label: 'Tambah Saldo',
    icon: Plus,
    active: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  { value: 'DEBIT', label: 'Kurangi Saldo', icon: Minus, active: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400' },
];

/** Kelola saldo merchant: ringkasan saldo, penyesuaian manual (tambah/kurangi) dengan pratinjau, dan riwayat mutasi. */
export function BalanceDialog({ store }: { store: AdminStore }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AdjustType>('CREDIT');
  const [amount, setAmount] = useState<number | undefined>();
  const [description, setDescription] = useState('');
  const [amountError, setAmountError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const [page, setPage] = useState(1);

  const balanceKey = ['admin-store-balance', store.id];
  const { data, isLoading } = useQuery({
    queryKey: [...balanceKey, page],
    queryFn: () => adminApi.getStoreBalance(store.id, { page, limit: LOG_LIMIT }),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const balance = data?.data;
  const logs = balance?.recentLogs ?? [];

  const resetForm = () => {
    setAmount(undefined);
    setDescription('');
    setAmountError(undefined);
    setConfirming(false);
  };

  const mutation = useApiMutation(
    () => adminApi.adjustStoreBalance(store.id, { type, amount: amount!, description: description.trim() || undefined }),
    {
      invalidate: [['admin-stores'], balanceKey],
      // Dialog tetap terbuka supaya admin langsung melihat saldo & riwayat terbaru
      onSuccess: () => {
        resetForm();
        setPage(1);
      },
    },
  );

  const openDialog = () => {
    resetForm();
    setType('CREDIT');
    setPage(1);
    setOpen(true);
  };

  const isDebit = type === 'DEBIT';
  const available = balance?.availableBalance;
  const after = available !== undefined && amount ? available + (isDebit ? -amount : amount) : undefined;
  const goesNegative = after !== undefined && after < 0;

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return setAmountError('Nominal wajib diisi');
    setConfirming(true);
  };

  return (
    <>
      <Button size="sm" onClick={openDialog}>
        <Wallet /> Saldo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Kelola Saldo</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{store.name}</span>
              {store.user && ` · ${store.user.name} (${store.user.email})`}
            </DialogDescription>
          </DialogHeader>

          {/* Ringkasan saldo */}
          <div className="overflow-hidden rounded-xl border">
            <div className="bg-emerald-500/10 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Wallet className="size-3.5" /> Saldo Tersedia
              </p>
              {available === undefined ? (
                <Skeleton className="mt-1 h-8 w-40" />
              ) : (
                <p className={cn('mt-0.5 text-2xl font-bold tracking-tight', available < 0 && 'text-destructive')}>
                  {formatCurrency(available)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Bisa ditarik merchant saat ini</p>
            </div>
            <div className="grid grid-cols-2 divide-x border-t text-sm">
              <div className="p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> Ditahan ({store.balanceHoldHours} jam)
                </p>
                <p className="font-semibold text-amber-600">{balance ? formatCurrency(balance.pendingBalance) : '…'}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Total Saldo</p>
                <p className="font-semibold">{formatCurrency(balance?.totalBalance ?? store.balance)}</p>
              </div>
            </div>
          </div>

          {/* Penyesuaian manual */}
          <form onSubmit={review} className="space-y-4 rounded-xl border p-4">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Jenis penyesuaian">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={type === opt.value}
                  disabled={confirming}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60',
                    type === opt.value ? opt.active : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <opt.icon className="size-4" /> {opt.label}
                </button>
              ))}
            </div>

            <FormField label="Nominal" htmlFor="adj-amount" error={amountError}>
              <AmountInput
                id="adj-amount"
                value={amount}
                disabled={confirming}
                invalid={!!amountError}
                onChange={(v) => {
                  setAmount(v);
                  setAmountError(undefined);
                }}
              />
            </FormField>

            <FormField label="Keterangan" htmlFor="adj-desc">
              <Textarea
                id="adj-desc"
                rows={2}
                disabled={confirming}
                placeholder={isDebit ? 'Mis. koreksi transaksi ganda' : 'Mis. kompensasi gangguan sistem'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>

            {after !== undefined && (
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm',
                  goesNegative ? 'bg-destructive/10 text-destructive' : 'bg-muted',
                )}
              >
                <span className={goesNegative ? undefined : 'text-muted-foreground'}>Saldo tersedia setelahnya</span>
                <span className="flex items-center gap-1.5 font-medium">
                  {formatCurrency(available!)} <ArrowRight className="size-3.5" />
                  <span className={cn('font-semibold', !goesNegative && (isDebit ? 'text-red-600' : 'text-emerald-600'))}>
                    {formatCurrency(after)}
                  </span>
                </span>
              </div>
            )}
            {goesNegative && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="size-3.5" /> Saldo tersedia merchant akan menjadi minus.
              </p>
            )}

            {confirming ? (
              <div className="space-y-3 rounded-lg border border-dashed p-3">
                <p className="text-sm">
                  Yakin <strong>{isDebit ? 'mengurangi' : 'menambah'}</strong> saldo {store.name} sebesar{' '}
                  <strong className={isDebit ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(amount!)}</strong>?
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={mutation.isPending}>
                    Ubah
                  </Button>
                  <Button
                    type="button"
                    variant={isDebit ? 'destructive' : 'default'}
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? 'Menyimpan...' : isDebit ? 'Ya, Kurangi' : 'Ya, Tambah'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="submit" variant={isDebit ? 'destructive' : 'default'} className="w-full">
                {isDebit ? 'Kurangi Saldo' : 'Tambah Saldo'}
                {amount ? ` ${formatCurrency(amount)}` : ''}
              </Button>
            )}
          </form>

          {/* Riwayat mutasi */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Riwayat Mutasi</p>
              {!!data?.pagination.total && (
                <p className="text-xs text-muted-foreground">{data.pagination.total.toLocaleString('id-ID')} mutasi</p>
              )}
            </div>
            <div className="divide-y rounded-xl border">
              {isLoading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="p-3">
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))
              ) : !logs.length ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Belum ada mutasi saldo</p>
              ) : (
                logs.map((log) => {
                  const credit = log.type === 'CREDIT';
                  const Icon = credit ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-3">
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full',
                          credit ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600',
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm" title={log.description ?? ''}>
                          {log.description || (credit ? 'Saldo masuk' : 'Saldo keluar')}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                      </div>
                      <span
                        className={cn('shrink-0 text-sm font-semibold whitespace-nowrap', credit ? 'text-emerald-600' : 'text-red-600')}
                      >
                        {credit ? '+' : '−'}
                        {formatCurrency(log.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
