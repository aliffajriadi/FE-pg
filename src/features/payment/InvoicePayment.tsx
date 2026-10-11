'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, QrCode, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { paymentApi } from '@/lib/api/support';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ToneBadge } from '@/components/shared/StatusBadge';

const INACTIVE = ['EXPIRED', 'CANCELLED', 'FAILED', 'REFUNDED'];

const STEPS = [
  'Buka aplikasi DANA, OVO, GoPay, ShopeePay, atau Mobile Banking',
  'Pilih menu Scan / Bayar dan arahkan kamera ke QRIS',
  'Pastikan nominal sesuai, lalu konfirmasi pembayaran',
];

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export default function InvoicePayment({ invoiceCode }: { invoiceCode: string }) {
  const { data: invoice, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['invoice', invoiceCode],
    queryFn: () => paymentApi.getInvoice(invoiceCode),
    select: (res) => res.data,
    // Cek status otomatis tiap 5 detik selama belum dibayar / belum kedaluwarsa
    refetchInterval: (query) => {
      const status = query.state.data?.data.paymentStatus;
      return status && (status === 'PAID' || INACTIVE.includes(status)) ? false : 5000;
    },
    retry: false,
  });

  const shell = 'w-full max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-xl shadow-primary/5';

  if (isLoading) {
    return (
      <div className={`${shell} flex items-center justify-center py-24`}>
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className={`${shell} space-y-2 px-6 py-16 text-center`}>
        <XCircle className="mx-auto size-12 text-destructive" />
        <p className="text-lg font-semibold">Invoice tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">{error?.message}</p>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === 'PAID';
  const isInactive = INACTIVE.includes(invoice.paymentStatus);
  const isPending = !isPaid && !isInactive;

  return (
    <div className={`${shell} grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]`}>
      {/* Kiri: QRIS / status */}
      <div className="relative flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 md:border-r">
        {isPending && invoice.paymentNumber ? (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <QrCode className="size-4" /> Scan untuk membayar
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=${encodeURIComponent(invoice.paymentNumber)}`}
                alt="Kode QRIS"
                className="size-56 sm:size-64"
              />
            </div>
            <p className="max-w-[16rem] text-center text-xs text-muted-foreground">
              Mendukung semua e-wallet &amp; mobile banking yang berlogo QRIS
            </p>
          </>
        ) : isPaid ? (
          <div className="space-y-3 py-10 text-center">
            <CheckCircle2 className="mx-auto size-24 text-emerald-500" />
            <p className="text-xl font-bold">Pembayaran Berhasil</p>
            <p className="text-sm text-muted-foreground">
              Diterima pada {invoice.paidAt ? formatDate(invoice.paidAt) : '-'}
            </p>
          </div>
        ) : isInactive ? (
          <div className="space-y-3 py-10 text-center">
            <XCircle className="mx-auto size-24 text-destructive" />
            <p className="text-xl font-bold">
              {invoice.paymentStatus === 'EXPIRED' ? 'Invoice Kedaluwarsa' : 'Invoice Dibatalkan'}
            </p>
            <p className="text-sm text-muted-foreground">Invoice ini sudah tidak aktif.</p>
          </div>
        ) : (
          <p className="py-10 text-sm text-muted-foreground">Metode pembayaran belum dikonfigurasi.</p>
        )}
      </div>

      {/* Kanan: keterangan */}
      <div className="flex flex-col gap-5 p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Dibayarkan ke</p>
            <p className="truncate text-lg font-bold">{invoice.storeName}</p>
          </div>
          {isPaid ? (
            <ToneBadge tone="success">Berhasil Dibayar</ToneBadge>
          ) : isInactive ? (
            <ToneBadge tone="danger">{invoice.paymentStatus === 'EXPIRED' ? 'Kedaluwarsa' : 'Dibatalkan'}</ToneBadge>
          ) : (
            <ToneBadge tone="warning">Menunggu Pembayaran</ToneBadge>
          )}
        </div>

        <div className="rounded-2xl bg-primary/10 p-5">
          <p className="text-xs text-muted-foreground">Total Pembayaran</p>
          <p className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            {formatCurrency(invoice.totalAmount)}
          </p>
        </div>

        <div className="divide-y rounded-2xl border px-4">
          <DetailRow label="Produk">{invoice.productName}</DetailRow>
          <DetailRow label="No. Invoice">
            <span className="font-mono text-xs">{invoice.invoiceCode}</span>
          </DetailRow>
          {isPending && invoice.expiredAt && (
            <DetailRow label="Berlaku hingga">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                {formatDate(invoice.expiredAt)}
              </span>
            </DetailRow>
          )}
        </div>

        {isPending && invoice.paymentNumber && (
          <>
            <ol className="space-y-2.5">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <strong>Penting:</strong> bayar tepat sesuai nominal hingga 3 digit terakhir agar pembayaran terdeteksi otomatis.
            </p>
          </>
        )}

        {isPending && (
          <Button className="mt-auto w-full" size="lg" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Memeriksa...' : 'Cek Status Pembayaran'}
          </Button>
        )}

        {isPaid && (
          <p className="text-sm text-muted-foreground">Terima kasih! Pembayaran Anda telah kami terima.</p>
        )}

        <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> Transaksi dilindungi &amp; diproses secara aman
        </p>
      </div>
    </div>
  );
}
