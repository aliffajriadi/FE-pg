'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { paymentApi } from '@/lib/api/support';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToneBadge } from '@/components/shared/StatusBadge';

const INACTIVE = ['EXPIRED', 'CANCELLED', 'FAILED', 'REFUNDED'];

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

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="space-y-5 text-center">
        {isLoading ? (
          <Loader2 className="mx-auto my-10 size-8 animate-spin text-primary" />
        ) : error || !invoice ? (
          <div className="space-y-2 py-6">
            <XCircle className="mx-auto size-10 text-destructive" />
            <p className="font-semibold">Invoice tidak ditemukan</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
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
                <ToneBadge tone="success">Berhasil Dibayar</ToneBadge>
                <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Terima kasih! Pembayaran diterima pada {invoice.paidAt ? formatDate(invoice.paidAt) : '-'}.
                </p>
              </div>
            ) : INACTIVE.includes(invoice.paymentStatus) ? (
              <div className="space-y-2">
                <ToneBadge tone="danger">{invoice.paymentStatus === 'EXPIRED' ? 'Kedaluwarsa' : 'Dibatalkan'}</ToneBadge>
                <p className="text-sm text-muted-foreground">Pembayaran tidak dapat dilakukan karena invoice sudah tidak aktif.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ToneBadge tone="warning">Menunggu Pembayaran</ToneBadge>
                {invoice.paymentNumber ? (
                  <>
                    <div className="mx-auto w-fit rounded-xl border-2 bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(invoice.paymentNumber)}`}
                        alt="Kode QRIS"
                        width={240}
                        height={240}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pindai QRIS di atas dengan DANA, OVO, GoPay, ShopeePay, atau Mobile Banking.
                      <br />
                      <strong className="text-foreground">Penting:</strong> bayar tepat sesuai nominal hingga 3 digit terakhir.
                    </p>
                    {invoice.expiredAt && (
                      <p className="text-xs text-muted-foreground">Berlaku hingga {formatDate(invoice.expiredAt)}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Metode pembayaran belum dikonfigurasi.</p>
                )}
                <Button className="w-full" size="lg" onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? 'Memeriksa...' : 'Cek Status Pembayaran'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
