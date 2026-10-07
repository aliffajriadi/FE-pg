import type { Metadata } from 'next';
import MerchantTickets from '@/features/merchant/support/MerchantTickets';

export const metadata: Metadata = { title: 'Bantuan & Support' };

export default function SupportPage() {
  return <MerchantTickets />;
}
