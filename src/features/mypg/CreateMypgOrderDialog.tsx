'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, Plus } from 'lucide-react';
import { mypgApi, type MypgOrder } from '@/lib/api/mypg';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useInvoiceLimits } from '@/hooks/use-invoice-limits';
import { formatCurrency } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { AmountInput } from '@/components/shared/AmountInput';
import { CopyField } from '@/components/shared/CopyField';

const makeSchema = (min: number, max: number) =>
  z.object({
    productName: z.string().trim().min(1, 'Nama produk wajib diisi'),
    amount: z.number({ error: 'Nominal wajib diisi' }).min(min, `Minimal ${formatCurrency(min)}`).max(max, `Maksimal ${formatCurrency(max)}`),
    customerName: z.string().optional(),
  });
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export function CreateMypgOrderDialog() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<MypgOrder | null>(null);
  const limits = useInvoiceLimits();
  const schema = useMemo(() => makeSchema(limits.min, limits.max), [limits.min, limits.max]);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { productName: '', customerName: '' } });
  const { errors } = form.formState;

  const mutation = useApiMutation(
    (data: FormValues) => mypgApi.createOrder({ ...data, customerName: data.customerName || undefined }),
    { successMessage: 'Invoice dibuat', invalidate: [['mypg-orders'], ['mypg-summary']], onSuccess: (res) => setCreated(res.data) }
  );

  const openDialog = () => {
    form.reset({ productName: '', customerName: '' });
    setCreated(null);
    setOpen(true);
  };
  const payUrl = created ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/mypg/${created.invoiceCode}` : '';

  return (
    <>
      <Button onClick={openDialog}>
        <Plus /> Buat Invoice
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{created ? 'Invoice MyPG dibuat' : 'Buat Invoice MyPG'}</DialogTitle>
            <DialogDescription>
              {created
                ? 'Bagikan link pembayaran ke pelanggan. Status berubah otomatis saat notifikasi masuk di HP Anda.'
                : 'Pelanggan membayar ke QRIS aktif Anda. Total bisa bertambah beberapa rupiah (kode unik) agar pembayaran dikenali.'}
            </DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/10 p-4">
                <p className="text-xs text-muted-foreground">Total yang harus dibayar</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(created.totalAmount)}</p>
                {created.uniqueCode > 0 && (
                  <p className="text-xs text-muted-foreground">Termasuk kode unik {formatCurrency(created.uniqueCode)}</p>
                )}
              </div>
              <FormField label="Link Pembayaran">
                <CopyField value={payUrl} />
              </FormField>
              <DialogFooter>
                <Link href={`/pay/mypg/${created.invoiceCode}`} target="_blank" className={buttonVariants({ variant: 'outline' })}>
                  <ExternalLink /> Buka Halaman Bayar
                </Link>
                <Button onClick={() => setOpen(false)}>Selesai</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4" noValidate>
              <FormField label="Nama Produk" htmlFor="mypg-product" error={errors.productName?.message}>
                <Input id="mypg-product" placeholder="Contoh: Top up 100 diamond" {...form.register('productName')} />
              </FormField>
              <FormField label="Nominal" htmlFor="mypg-amount" error={errors.amount?.message}>
                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <AmountInput id="mypg-amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.amount} />
                  )}
                />
              </FormField>
              <FormField label="Nama Pelanggan (opsional)" htmlFor="mypg-customer">
                <Input id="mypg-customer" {...form.register('customerName')} />
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Membuat...' : 'Buat Invoice'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
