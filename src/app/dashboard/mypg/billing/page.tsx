import type { Metadata } from 'next';
import MypgBilling from '@/features/mypg/MypgBilling';

export const metadata: Metadata = { title: 'Billing MyPG' };

export default function Page() {
  return <MypgBilling />;
}
