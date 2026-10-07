import type { Metadata } from 'next';
import MerchantOverview from '@/features/merchant/overview/MerchantOverview';

export const metadata: Metadata = { title: 'Beranda Merchant' };

export default function DashboardPage() {
  return <MerchantOverview />;
}
