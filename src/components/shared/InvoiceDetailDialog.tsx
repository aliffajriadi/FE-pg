'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Order } from '@/types';

type DetailOrder = Order & { store?: { name: string } | null };

const WAITING = ['PENDING', 'WAITING_PAYMENT'];

function Row({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className={strong ? 'font-medium' : 'text-muted-foreground'}>{label}</dt>
      <dd className={strong ? 'text-right text-base font-semibold tabular-nums' : 'text-right tabular-nums'}>{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <dl className="divide-y rounded-lg border px-3">{children}</dl>
    </section>
  );
}

const Muted = ({ children }: { children: React.ReactNode }) => <span className="text-muted-foreground">{children}</span>;

/** Tombol "Detail" + dialog rincian satu invoice: biaya, total, kapan dibuat, dan kapan dibayar. */
export function InvoiceDetailDialog({ order, viewer }: { order: DetailOrder; viewer: 'admin' | 'merchant' }) {
  const [open, setOpen] = useState(false);
  const isAdmin = viewer === 'admin';
  const uniqueCode = order.uniqueCode ?? 0;
  const platformRevenue = order.totalAmount - order.netAmount;
  const waiting = WAITING.includes(order.paymentStatus);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label={`Detail invoice ${order.invoiceCode}`}>
        <Eye /> Detail
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Invoice</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-xs break-all">{order.invoiceCode}</code>
              <StatusBadge status={order.paymentStatus} />
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <Section title="Rincian pembayaran">
              <Row label="Nominal pesanan">{formatCurrency(order.amount)}</Row>
              <Row label="Biaya admin">+ {formatCurrency(order.platformFee)}</Row>
              {uniqueCode > 0 && <Row label="Kode unik">+ {formatCurrency(uniqueCode)}</Row>}
              <Row label="Total dibayar pelanggan" strong>
                {formatCurrency(order.totalAmount)}
              </Row>
              <Row label={isAdmin ? 'Diterima merchant' : 'Anda terima'}>
                <span className="font-semibold text-emerald-600">{formatCurrency(order.netAmount)}</span>
              </Row>
              {isAdmin && (
                <Row label="Pendapatan admin">
                  {formatCurrency(platformRevenue)} <Muted>(biaya admin{uniqueCode > 0 ? ' + kode unik' : ''})</Muted>
                </Row>
              )}
            </Section>

            <Section title="Waktu">
              <Row label="Dibuat">{formatDate(order.createdAt)}</Row>
              <Row label="Dibayar">{order.paidAt ? formatDate(order.paidAt) : <Muted>Belum dibayar</Muted>}</Row>
              {order.expiredAt && !order.paidAt && <Row label="Batas pembayaran">{formatDate(order.expiredAt)}</Row>}
            </Section>

            <Section title="Pesanan">
              {isAdmin && <Row label="Merchant">{order.store?.name ?? '-'}</Row>}
              <Row label="Produk">{order.productName}</Row>
              <Row label="Pelanggan">{order.customerName || <Muted>-</Muted>}</Row>
              {order.customerContact && <Row label="Kontak">{order.customerContact}</Row>}
              <Row label="Metode">{order.paymentMethod || <Muted>-</Muted>}</Row>
              {order.externalId && <Row label="ID eksternal">{order.externalId}</Row>}
            </Section>
          </div>

          <DialogFooter>
            {waiting && (
              <a
                href={`/pay/${encodeURIComponent(order.invoiceCode)}`}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                Buka halaman bayar
              </a>
            )}
            <Button onClick={() => setOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
