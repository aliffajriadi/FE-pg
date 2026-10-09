'use client';

import { useState } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, MessageCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import type { Order } from '@/types';

/** Nomor HP Indonesia (08xx / 628xx / +628xx) menjadi format wa.me; null jika bukan nomor HP. */
function toWhatsAppNumber(contact?: string | null) {
  const digits = (contact ?? '').replace(/[\s-]/g, '');
  if (!/^(\+?62|0)8\d{7,12}$/.test(digits)) return null;
  const national = digits.replace(/^\+?62/, '').replace(/^0/, '');
  return `62${national}`;
}

export function InvoiceCreated({
  order,
  onAnother,
  onDone,
}: {
  order: Order;
  onAnother: () => void;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const payLink = `${window.location.origin}/pay/${encodeURIComponent(order.invoiceCode)}`;

  const message = `Halo${order.customerName ? ` ${order.customerName}` : ''}, berikut tagihan untuk ${order.productName} sebesar ${formatCurrency(order.totalAmount)}. Silakan bayar lewat link ini: ${payLink}`;
  const waNumber = toWhatsAppNumber(order.customerContact);
  const waLink = `https://wa.me/${waNumber ?? ''}?text=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payLink);
      setCopied(true);
      toast.success('Link pembayaran disalin');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin, salin manual dari kolom di atas');
    }
  };

  return (
    <div>
      <div className="space-y-6 p-6">
        <div className="space-y-2 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
          <h2 className="text-lg font-semibold">Invoice berhasil dibuat</h2>
          <p className="text-3xl font-bold text-primary tabular-nums">{formatCurrency(order.totalAmount)}</p>
          <p className="text-sm text-muted-foreground">
            {order.productName}
            {order.customerName ? ` · ${order.customerName}` : ''}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{order.invoiceCode}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          {order.paymentNumber && (
            <div className="mx-auto w-fit rounded-xl border bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(order.paymentNumber)}`}
                alt="Kode QRIS"
                width={176}
                height={176}
              />
            </div>
          )}

          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Link pembayaran untuk pelanggan</p>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1.5 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-xs" title={payLink}>
                  {payLink}
                </code>
                <Button type="button" size="sm" onClick={copy}>
                  {copied ? <Check /> : <Copy />} {copied ? 'Tersalin' : 'Salin'}
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: 'outline', className: 'h-10' })}
              >
                <MessageCircle /> {waNumber ? 'Kirim via WhatsApp' : 'Bagikan via WhatsApp'}
              </a>
              <a
                href={payLink}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: 'outline', className: 'h-10' })}
              >
                <ExternalLink /> Buka halaman bayar
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Status pembayaran bisa dipantau di tabel transaksi dan diperbarui otomatis saat pelanggan membayar.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter className="m-0 rounded-b-xl border-t bg-muted/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onAnother}>
          <Plus /> Buat invoice lagi
        </Button>
        <Button type="button" onClick={onDone}>
          Selesai
        </Button>
      </DialogFooter>
    </div>
  );
}
