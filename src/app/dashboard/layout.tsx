import { AppShell } from '@/components/layout/AppShell';
import { MerchantBanner } from '@/features/merchant/overview/MerchantBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="MERCHANT">
      <MerchantBanner />
      {children}
    </AppShell>
  );
}
