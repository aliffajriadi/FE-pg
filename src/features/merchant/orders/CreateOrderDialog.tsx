'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';

const orderSchema = z.object({
  productName: z.string().trim().min(1, 'Nama produk wajib diisi'),
  amount: z
    .number({ error: 'Nominal wajib diisi' })
    .min(500, 'Minimal Rp500')
    .max(20_000_000, 'Maksimal Rp20.000.000'),
  customerName: z.string().trim().min(1, 'Nama pelanggan wajib diisi'),
  customerContact: z.string().optional(),
});
type OrderForm = z.infer<typeof orderSchema>;

export function CreateOrderDialog({ variant = 'default' }: { variant?: 'default' | 'outline' }) {
  const [open, setOpen] = useState(false);
  const form = useForm<OrderForm>({ resolver: zodResolver(orderSchema) });
  const { errors } = form.formState;

  const mutation = useApiMutation(merchantApi.createOrder, {
    successMessage: 'Invoice berhasil dibuat',
    invalidate: [['merchant-orders'], ['merchant-dashboard']],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus /> Buat Invoice
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Invoice Baru</DialogTitle>
            <DialogDescription>Link pembayaran QRIS tersedia di tabel transaksi setelah invoice dibuat.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Nama Produk" htmlFor="order-product" error={errors.productName?.message}>
              <Input id="order-product" {...form.register('productName')} />
            </FormField>
            <FormField label="Nominal (Rp)" htmlFor="order-amount" error={errors.amount?.message}>
              <Input id="order-amount" type="number" min={500} {...form.register('amount', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Nama Pelanggan" htmlFor="order-customer" error={errors.customerName?.message}>
              <Input id="order-customer" {...form.register('customerName')} />
            </FormField>
            <FormField label="Kontak Pelanggan (Opsional)" htmlFor="order-contact">
              <Input id="order-contact" placeholder="No. HP atau email" {...form.register('customerContact')} />
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
        </DialogContent>
      </Dialog>
    </>
  );
}
