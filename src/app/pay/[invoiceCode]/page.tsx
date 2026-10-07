import type { Metadata } from 'next';
import InvoicePayment from '@/features/payment/InvoicePayment';
import { Logo } from '@/components/shared/Logo';

export const metadata: Metadata = { title: 'Pembayaran Invoice' };

export default async function PayPage({ params }: { params: Promise<{ invoiceCode: string }> }) {
  const { invoiceCode } = await params;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <InvoicePayment invoiceCode={decodeURIComponent(invoiceCode)} />
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        Diproses dengan aman oleh <Logo className="scale-90" />
      </p>
    </div>
  );
}
