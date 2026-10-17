import type { Metadata } from 'next';
import SubadminTransactions from '@/features/subadmin/SubadminTransactions';

export const metadata: Metadata = { title: 'Riwayat Transaksi' };

export default function SubadminTransactionsPage() {
  return <SubadminTransactions />;
}
