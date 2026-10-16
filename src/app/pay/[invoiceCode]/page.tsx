import type { Metadata } from 'next';
import InvoicePayment from '@/features/payment/InvoicePayment';

export const metadata: Metadata = { title: 'Pembayaran Invoice' };

export default async function PayPage({ params }: { params: Promise<{ invoiceCode: string }> }) {
  const { invoiceCode } = await params;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <InvoicePayment invoiceCode={decodeURIComponent(invoiceCode)} />
    </div>
  );
}
