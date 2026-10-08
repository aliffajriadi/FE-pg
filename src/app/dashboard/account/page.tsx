import type { Metadata } from 'next';
import MerchantAccount from '@/features/merchant/account/MerchantAccount';

export const metadata: Metadata = { title: 'Akun Saya' };

export default function AccountPage() {
  return <MerchantAccount />;
}
