import type { Metadata } from 'next';
import SubadminBalance from '@/features/subadmin/SubadminBalance';

export const metadata: Metadata = { title: 'Saldo' };

export default function SubadminBalancePage() {
  return <SubadminBalance />;
}
