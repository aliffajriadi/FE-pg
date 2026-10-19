import type { Metadata } from 'next';
import SubadminWithdrawals from '@/features/subadmin/SubadminWithdrawals';

export const metadata: Metadata = { title: 'Penarikan Merchant' };

export default function SubadminWithdrawalsPage() {
  return <SubadminWithdrawals />;
}
