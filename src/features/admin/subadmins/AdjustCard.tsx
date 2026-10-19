'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { AmountInput } from '@/components/shared/AmountInput';

export interface AdjustOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  /** true = mengurangi saldo (merah, tidak boleh melebihi saldo). */
  out: boolean;
}

/**
 * Kartu penyesuaian nominal: pilih jenis (opsional), isi nominal & catatan, lihat pratinjau saldo setelahnya, lalu konfirmasi.
 * Dipakai untuk saldo dipegang dan saldo pendapatan sub admin.
 */
export function AdjustCard<T extends string>({
  title,
  description,
  current,
  currentLabel,
  options,
  notePlaceholder,
  onSubmit,
}: {
  title: string;
  description: string;
  current: number | undefined;
  currentLabel: string;
  options: AdjustOption<T>[];
  notePlaceholder: string;
  /** Resolve bila sukses (form direset), reject bila gagal (toast oleh mutation). */
  onSubmit: (data: { type: T; amount: number; description?: string }) => Promise<unknown>;
}) {
  const [type, setType] = useState<T>(options[0].value);
  const [amount, setAmount] = useState<number | undefined>();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const option = options.find((o) => o.value === type)!;
  const after = current !== undefined && amount ? current + (option.out ? -amount : amount) : undefined;

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    const next = !amount ? 'Nominal wajib diisi' : after !== undefined && after < 0 ? `Melebihi ${currentLabel.toLowerCase()}` : undefined;
    setError(next);
    if (!next) setConfirming(true);
  };

  const confirm = async () => {
    setPending(true);
    try {
      await onSubmit({ type, amount: amount!, description: note.trim() || undefined });
      setAmount(undefined);
      setNote('');
      setConfirming(false);
    } catch {
      // pesan error sudah ditampilkan lewat toast
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={review} className="space-y-4">
          {options.length > 1 && (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Jenis penyesuaian">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={type === opt.value}
                  disabled={confirming}
                  onClick={() => {
                    setType(opt.value);
                    setError(undefined);
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60',
                    type !== opt.value
                      ? 'text-muted-foreground hover:bg-muted'
                      : opt.out
                        ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400'
                        : 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                  )}
                >
                  <opt.icon className="size-4" /> {opt.label}
                </button>
              ))}
            </div>
          )}

          <FormField label="Nominal" htmlFor={`${title}-amount`} error={error}>
            <AmountInput
              id={`${title}-amount`}
              value={amount}
              disabled={confirming}
              invalid={!!error}
              onChange={(v) => {
                setAmount(v);
                setError(undefined);
              }}
            />
          </FormField>
          <FormField label="Catatan" htmlFor={`${title}-note`}>
            <Textarea
              id={`${title}-note`}
              rows={2}
              disabled={confirming}
              placeholder={notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>

          {after !== undefined && (
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm',
                after < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted',
              )}
            >
              <span className={after < 0 ? 'flex items-center gap-1.5' : 'text-muted-foreground'}>
                {after < 0 && <AlertTriangle className="size-3.5" />}
                {currentLabel} setelahnya
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                {formatCurrency(current!)} <ArrowRight className="size-3.5" />
                <span className={cn('font-semibold', after >= 0 && (option.out ? 'text-red-600' : 'text-emerald-600'))}>
                  {formatCurrency(after)}
                </span>
              </span>
            </div>
          )}

          {confirming ? (
            <div className="space-y-3 rounded-lg border border-dashed p-3">
              <p className="text-sm">
                Yakin <strong>{option.label.toLowerCase()}</strong> sebesar{' '}
                <strong className={option.out ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(amount!)}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
                  Ubah
                </Button>
                <Button type="button" variant={option.out ? 'destructive' : 'default'} onClick={confirm} disabled={pending}>
                  {pending ? 'Menyimpan...' : 'Ya, Simpan'}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="submit" variant={option.out ? 'destructive' : 'default'} className="w-full">
              {option.label}
              {amount ? ` ${formatCurrency(amount)}` : ''}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
