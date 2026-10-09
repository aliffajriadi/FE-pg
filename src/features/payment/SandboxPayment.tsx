'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, FlaskConical, Loader2, XCircle } from 'lucide-react';
import { paymentApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToneBadge } from '@/components/shared/StatusBadge';

const FINAL = ['PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

/** Halaman bayar palsu untuk invoice sandbox: tidak ada uang yang berpindah. */
export default function SandboxPayment({ invoiceCode }: { invoiceCode: string }) {
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['sandbox-invoice', invoiceCode],
    queryFn: () => paymentApi.getSandboxInvoice(invoiceCode),
    select: (res) => res.data,
    refetchInterval: (query) => {
      const status = query.state.data?.data.paymentStatus;
      return status && FINAL.includes(status) ? false : 5000;
    },
    retry: false,
  });

  const simulate = useApiMutation(
    (status: 'paid' | 'failed' | 'expired') => paymentApi.simulateSandboxInvoice(invoiceCode, status),
    { successMessage: 'Simulasi dijalankan, webhook sandbox dikirim', invalidate: [['sandbox-invoice', invoiceCode]] }
  );

  return (
    <Card className="w-full max-w-sm border-amber-500/40">
      <div className="mx-4 -mt-1 flex items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
        <FlaskConical className="size-4 shrink-0" />
        Mode uji coba. Tidak ada uang yang berpindah.
      </div>
      <CardContent className="space-y-5 text-center">
        {isLoading ? (
          <Loader2 className="mx-auto my-10 size-8 animate-spin text-primary" />
        ) : error || !invoice ? (
          <div className="space-y-2 py-6">
            <XCircle className="mx-auto size-10 text-destructive" />
            <p className="font-semibold">Invoice sandbox tidak ditemukan</p>
            <p className="text-sm text-muted-foreground">Invoice uji coba dihapus otomatis setelah 7 hari.</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-lg font-bold">{invoice.storeName}</p>
              <p className="font-mono text-xs text-muted-foreground">{invoice.invoiceCode}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{formatCurrency(invoice.totalAmount)}</p>
              <p className="text-sm text-muted-foreground">{invoice.productName}</p>
            </div>

            {invoice.paymentStatus === 'PAID' ? (
              <div className="space-y-2">
                <ToneBadge tone="success">Berhasil Dibayar (simulasi)</ToneBadge>
                <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Pembayaran disimulasikan pada {invoice.paidAt ? formatDate(invoice.paidAt) : '-'}.
                </p>
              </div>
            ) : FINAL.includes(invoice.paymentStatus) ? (
              <div className="space-y-2">
                <ToneBadge tone="danger">
                  {invoice.paymentStatus === 'EXPIRED' ? 'Kedaluwarsa' : invoice.paymentStatus === 'FAILED' ? 'Gagal' : 'Dibatalkan'}
                </ToneBadge>
                <p className="text-sm text-muted-foreground">Invoice sandbox ini sudah selesai dan tidak bisa disimulasikan lagi.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ToneBadge tone="warning">Menunggu Pembayaran</ToneBadge>
                {invoice.paymentNumber && (
                  <div className="mx-auto w-fit rounded-xl border-2 border-dashed bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(invoice.paymentNumber)}`}
                      alt="QR palsu sandbox"
                      width={200}
                      height={200}
                      className="opacity-60"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  QR ini <strong className="text-foreground">tidak bisa dibayar</strong>. Pilih hasil pembayaran yang ingin
                  disimulasikan:
                </p>
                <div className="grid gap-2">
                  <Button size="lg" onClick={() => simulate.mutate('paid')} disabled={simulate.isPending}>
                    Simulasikan Berhasil
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => simulate.mutate('failed')} disabled={simulate.isPending}>
                      Gagal
                    </Button>
                    <Button variant="outline" onClick={() => simulate.mutate('expired')} disabled={simulate.isPending}>
                      Kedaluwarsa
                    </Button>
                  </div>
                </div>
                {invoice.expiredAt && (
                  <p className="text-xs text-muted-foreground">Kedaluwarsa otomatis {formatDate(invoice.expiredAt)}</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
