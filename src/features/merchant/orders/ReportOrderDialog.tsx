'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Link2, Loader2, Send } from 'lucide-react';
import { merchantSupportApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CopyButton } from '@/components/shared/CopyButton';
import type { Order, TicketPriority } from '@/types';

const NOTE_MAX = 1000;

interface Reason {
  value: string;
  label: string;
  placeholder: string;
  priority: TicketPriority;
}

const OTHER_REASON: Reason = {
  value: 'OTHER',
  label: 'Lainnya',
  placeholder: 'Ceritakan kendala yang Anda alami...',
  priority: 'NORMAL',
};

/** Pilihan alasan cepat, disesuaikan dengan status transaksi agar merchant tinggal klik. */
function reasonsFor(order: Order): Reason[] {
  if (order.paymentStatus === 'CANCELLED') {
    return [
      {
        value: 'PAID_BUT_CANCELLED',
        label: 'Pelanggan sudah bayar, tapi dibatalkan',
        placeholder: 'Sebutkan waktu pembayaran, nominal yang dibayar, dan bukti jika ada...',
        priority: 'HIGH',
      },
      {
        value: 'CANCELLED_WRONGLY',
        label: 'Saya tidak membatalkan invoice ini',
        placeholder: 'Jelaskan kenapa invoice ini seharusnya tidak dibatalkan...',
        priority: 'NORMAL',
      },
      OTHER_REASON,
    ];
  }
  return [
    {
      value: 'PAID_NOT_RECEIVED',
      label: 'Sudah bayar, tapi belum masuk',
      placeholder: 'Sebutkan waktu pembayaran, nominal yang dibayar, dan bukti jika ada...',
      priority: 'HIGH',
    },
    {
      value: 'PAYMENT_ISSUE',
      label: 'QR / link pembayaran bermasalah',
      placeholder: 'Jelaskan masalahnya: QR tidak terbaca, link error, dan sebagainya...',
      priority: 'NORMAL',
    },
    {
      value: 'STUCK_PENDING',
      label: 'Status tidak berubah',
      placeholder: 'Sudah berapa lama status menunggu dan sudah coba cek status?',
      priority: 'NORMAL',
    },
    OTHER_REASON,
  ];
}

const reportSchema = z.object({
  reason: z.string().min(1, 'Pilih jenis kendala'),
  note: z.string().trim().min(1, 'Keterangan wajib diisi').max(NOTE_MAX, `Maksimal ${NOTE_MAX} karakter`),
  attachmentUrl: z.union([z.literal(''), z.url('Link tidak valid, awali dengan https://')]),
});
type ReportForm = z.infer<typeof reportSchema>;

/** Rangkuman transaksi yang ikut terkirim di pesan tiket, agar admin tidak perlu bertanya ulang. */
function buildMessage(order: Order, reason: Reason, note: string) {
  // Keterangan merchant ditaruh di depan: notifikasi admin hanya memuat cuplikan awal pesan.
  const lines = [
    `Kendala: ${reason.label}`,
    note,
    '',
    '--- Data transaksi ---',
    `Kode Invoice: ${order.invoiceCode}`,
    `Produk: ${order.productName}`,
    `Pelanggan: ${order.customerName || '-'}${order.customerContact ? ` (${order.customerContact})` : ''}`,
    `Nominal: ${formatCurrency(order.amount)}`,
    `Total: ${formatCurrency(order.totalAmount)}`,
    `Status: ${order.paymentStatus}`,
    order.paymentMethod ? `Metode: ${order.paymentMethod}` : null,
    order.pgReference ? `Referensi: ${order.pgReference}` : null,
    `Dibuat: ${formatDate(order.createdAt)}`,
    order.paidAt ? `Dibayar: ${formatDate(order.paidAt)}` : null,
  ];
  return lines.filter((line) => line !== null).join('\n');
}

export function ReportOrderDialog({ order }: { order: Order }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const reasons = reasonsFor(order);

  const form = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: '', note: '', attachmentUrl: '' },
  });
  const { errors } = form.formState;
  const reasonValue = useWatch({ control: form.control, name: 'reason' });
  const noteValue = useWatch({ control: form.control, name: 'note' }) ?? '';
  const selected = reasons.find((r) => r.value === reasonValue);

  const mutation = useApiMutation(
    (data: ReportForm) => {
      const reason = reasons.find((r) => r.value === data.reason) ?? OTHER_REASON;
      return merchantSupportApi.createTicket({
        subject: `Laporan Transaksi ${order.invoiceCode} — ${reason.label}`,
        priority: reason.priority,
        message: buildMessage(order, reason, data.note),
        attachmentUrl: data.attachmentUrl || undefined,
      });
    },
    {
      successMessage: 'Laporan terkirim. Admin akan segera membalas di tiket ini.',
      invalidate: [['merchant-tickets']],
      onSuccess: (res) => {
        setOpen(false);
        form.reset();
        router.push(`/dashboard/support/${res.data.id}`);
      },
    }
  );

  const submit = form.handleSubmit((data) => mutation.mutate(data));

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    setOpen(next);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        title="Laporkan kendala transaksi"
        aria-label="Laporkan kendala transaksi"
        onClick={() => setOpen(true)}
      >
        <AlertCircle />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" /> Laporkan Kendala Transaksi
            </DialogTitle>
            <DialogDescription>
              Data transaksi ikut terlampir otomatis. Anda cukup pilih kendala dan ceritakan singkat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-5 p-4">
            {/* Ringkasan transaksi */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1">
                  <code className="truncate font-mono text-xs">{order.invoiceCode}</code>
                  <CopyButton value={order.invoiceCode} label="Salin kode invoice" />
                </div>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Produk</dt>
                <dd className="truncate text-right" title={order.productName}>{order.productName}</dd>
                <dt className="text-muted-foreground">Pelanggan</dt>
                <dd className="truncate text-right">{order.customerName || '-'}</dd>
                <dt className="text-muted-foreground">Dibuat</dt>
                <dd className="text-right">{formatDate(order.createdAt)}</dd>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-right text-sm font-semibold">{formatCurrency(order.totalAmount)}</dd>
              </dl>
            </div>

            {/* Jenis kendala */}
            <FormField label="Apa kendalanya? *" error={errors.reason?.message}>
              <Controller
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Jenis kendala">
                    {reasons.map((r) => {
                      const active = field.value === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => field.onChange(r.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted'
                          )}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </FormField>

            {/* Keterangan */}
            <FormField label="Keterangan *" htmlFor="report-note" error={errors.note?.message}>
              <Textarea
                id="report-note"
                rows={4}
                maxLength={NOTE_MAX}
                placeholder={selected?.placeholder ?? 'Pilih jenis kendala di atas, lalu ceritakan detailnya...'}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit();
                }}
                {...form.register('note')}
              />
              <p className="text-right text-xs text-muted-foreground">
                {noteValue.length}/{NOTE_MAX}
              </p>
            </FormField>

            {/* Lampiran */}
            <FormField
              label="Link Bukti (Opsional)"
              htmlFor="report-url"
              error={errors.attachmentUrl?.message}
              hint="Bukti transfer atau screenshot dari Google Drive, Imgur, dan sejenisnya."
            >
              <div className="relative">
                <Link2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="report-url" type="url" placeholder="https://..." className="pl-8" {...form.register('attachmentUrl')} />
              </div>
            </FormField>

            <DialogFooter className="-mx-4 -mb-4 mt-0 rounded-b-xl border-t bg-muted/30 p-4">
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
                {mutation.isPending ? 'Mengirim...' : 'Kirim Laporan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
