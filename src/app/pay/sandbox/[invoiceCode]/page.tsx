import type { Metadata } from 'next';
import SandboxPayment from '@/features/payment/SandboxPayment';
import { Logo } from '@/components/shared/Logo';

export const metadata: Metadata = { title: 'Pembayaran Uji Coba (Sandbox)' };

export default async function SandboxPayPage({ params }: { params: Promise<{ invoiceCode: string }> }) {
  const { invoiceCode } = await params;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <SandboxPayment invoiceCode={decodeURIComponent(invoiceCode)} />
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        Sandbox <Logo className="scale-90" />
      </p>
    </div>
  );
}
