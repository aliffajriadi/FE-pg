'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInvoiceLimits } from '@/hooks/use-invoice-limits';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { AmountInput } from '@/components/shared/AmountInput';
import type { Order } from '@/types';
import { InvoiceCreated } from './InvoiceCreated';
import { InvoiceSummary } from './InvoiceSummary';

const QUICK_AMOUNTS = [10_000, 25_000, 50_000, 100_000, 250_000];

const makeOrderSchema = (min: number, max: number) =>
  z.object({
    productName: z.string().trim().min(1, 'Nama produk wajib diisi'),
    amount: z
      .number({ error: 'Nominal wajib diisi' })
      .min(min, `Minimal ${formatCurrency(min)}`)
      .max(max, `Maksimal ${formatCurrency(max)}`),
    customerName: z.string().trim().min(1, 'Nama pelanggan wajib diisi'),
    customerContact: z.string().optional(),
  });
type OrderForm = z.infer<ReturnType<typeof makeOrderSchema>>;

export function CreateOrderDialog({ variant = 'default' }: { variant?: 'default' | 'outline' }) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Order | null>(null);

  const limits = useInvoiceLimits();
  const schema = useMemo(() => makeOrderSchema(limits.min, limits.max), [limits.min, limits.max]);
  const form = useForm<OrderForm>({
    resolver: zodResolver(schema),
    defaultValues: { productName: '', customerName: '', customerContact: '' },
  });
  const { errors } = form.formState;

  const amount = useWatch({ control: form.control, name: 'amount' });
  const debouncedAmount = useDebouncedValue(amount);
  const amountValid = typeof amount === 'number' && amount >= limits.min && amount <= limits.max;
  const preview = useQuery({
    queryKey: ['invoice-preview', debouncedAmount],
    queryFn: () => merchantApi.previewInvoice(debouncedAmount as number),
    select: (res) => res.data,
    enabled: typeof debouncedAmount === 'number' && debouncedAmount >= limits.min && debouncedAmount <= limits.max,
    staleTime: 60_000,
  });

  const mutation = useApiMutation(merchantApi.createOrder, {
    successMessage: false,
    invalidate: [['merchant-orders'], ['merchant-dashboard']],
    onSuccess: (res) => setCreated(res.data),
  });

  const reset = () => {
    form.reset();
    mutation.reset();
    setCreated(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  // Ringkasan hanya ditampilkan jika data pratinjau cocok dengan nominal yang sedang diisi
  const shownPreview = amountValid && preview.data?.amount === amount ? preview.data : undefined;
  const previewLoading = amountValid && !shownPreview && !preview.isError;

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus /> Buat Invoice
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
          {created ? (
            <InvoiceCreated
              order={created}
              onAnother={reset}
              onDone={() => handleOpenChange(false)}
            />
          ) : (
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
              <DialogHeader className="border-b px-6 py-5">
                <DialogTitle className="text-lg">Buat Invoice Baru</DialogTitle>
                <DialogDescription>
                  Isi detail pesanan. Setelah dibuat, Anda bisa langsung membagikan link atau QR pembayaran ke pelanggan.
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="space-y-5 p-6">
                  <FormField
                    label="Nominal"
                    htmlFor="order-amount"
                    error={errors.amount?.message}
                    hint={`Minimal ${formatCurrency(limits.min)}, maksimal ${formatCurrency(limits.max)}`}
                  >
                    <Controller
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <AmountInput
                          id="order-amount"
                          autoFocus
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          invalid={!!errors.amount}
                          disabled={mutation.isPending}
                        />
                      )}
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {QUICK_AMOUNTS.filter((v) => v >= limits.min && v <= limits.max).map((value) => (
                        <button
                          key={value}
                          type="button"
                          disabled={mutation.isPending}
                          onClick={() => form.setValue('amount', value, { shouldValidate: true, shouldDirty: true })}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50',
                            amount === value && 'border-primary bg-primary/10 text-primary'
                          )}
                        >
                          {formatCurrency(value)}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Nama Produk / Keterangan" htmlFor="order-product" error={errors.productName?.message}>
                    <Input
                      id="order-product"
                      className="h-10"
                      placeholder="Contoh: Paket Premium 1 Bulan"
                      autoComplete="off"
                      disabled={mutation.isPending}
                      aria-invalid={!!errors.productName}
                      {...form.register('productName')}
                    />
                  </FormField>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Nama Pelanggan" htmlFor="order-customer" error={errors.customerName?.message}>
                      <Input
                        id="order-customer"
                        className="h-10"
                        placeholder="Nama lengkap"
                        autoComplete="off"
                        disabled={mutation.isPending}
                        aria-invalid={!!errors.customerName}
                        {...form.register('customerName')}
                      />
                    </FormField>
                    <FormField
                      label="Kontak (Opsional)"
                      htmlFor="order-contact"
                      hint="No. HP diawali 08 agar bisa langsung dikirim via WhatsApp."
                    >
                      <Input
                        id="order-contact"
                        className="h-10"
                        placeholder="08xx atau email"
                        autoComplete="off"
                        disabled={mutation.isPending}
                        {...form.register('customerContact')}
                      />
                    </FormField>
                  </div>
                </div>

                <aside className="border-t bg-muted/40 p-6 md:border-t-0 md:border-l">
                  <InvoiceSummary preview={shownPreview} loading={previewLoading} hasAmount={typeof amount === 'number'} />
                </aside>
              </div>

              {mutation.error && (
                <div className="mx-6 mb-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {mutation.error.message}
                </div>
              )}

              <DialogFooter className="sticky bottom-0 m-0 rounded-b-xl border-t bg-popover px-6 py-4">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
                  Batal
                </Button>
                <Button type="submit" className="min-w-36" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" /> Membuat...
                    </>
                  ) : (
                    'Buat Invoice'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
