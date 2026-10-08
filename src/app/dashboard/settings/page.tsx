import type { Metadata } from 'next';
import MerchantSettings from '@/features/merchant/settings/MerchantSettings';

export const metadata: Metadata = { title: 'Integrasi API' };

export default function SettingsPage() {
  return <MerchantSettings />;
}
