'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useIntegrationClient } from '../settings/integration-client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useInvoiceLimits } from '@/hooks/use-invoice-limits';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { AmountInput } from '@/components/shared/AmountInput';

const makeSchema = (min: number, max: number) =>
  z.object({
    productName: z.string().trim().min(1, 'Nama produk wajib diisi'),
    amount: z
      .number({ error: 'Nominal wajib diisi' })
      .min(min, `Minimal ${formatCurrency(min)}`)
      .max(max, `Maksimal ${formatCurrency(max)}`),
    customerName: z.string().optional(),
  });
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export function CreateSandboxInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const client = useIntegrationClient();
  const limits = useInvoiceLimits();
  const schema = useMemo(() => makeSchema(limits.min, limits.max), [limits.min, limits.max]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productName: 'Produk Uji Coba', amount: 10000, customerName: '' },
  });
  const { errors } = form.formState;

  const mutation = useApiMutation(
    (data: FormValues) => client.api.createSandboxInvoice({ ...data, customerName: data.customerName || undefined }),
    {
      successMessage: 'Invoice sandbox dibuat',
      invalidate: [[client.keys.sandboxInvoices]],
      onSuccess: () => setOpen(false),
    }
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Buat Invoice Uji Coba
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Invoice Uji Coba</DialogTitle>
            <DialogDescription>
              Invoice ini hanya ada di sandbox. Tidak ada uang yang berpindah dan tidak masuk ke transaksi asli.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              label="Nominal"
              htmlFor="sbx-amount"
              error={errors.amount?.message}
              hint={`Minimal ${formatCurrency(limits.min)}`}
            >
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <AmountInput
                    id="sbx-amount"
                    autoFocus
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={!!errors.amount}
                  />
                )}
              />
            </FormField>
            <FormField label="Nama Produk" htmlFor="sbx-product" error={errors.productName?.message}>
              <Input id="sbx-product" className="h-10" {...form.register('productName')} />
            </FormField>
            <FormField label="Nama Pelanggan (Opsional)" htmlFor="sbx-customer">
              <Input id="sbx-customer" className="h-10" {...form.register('customerName')} />
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
