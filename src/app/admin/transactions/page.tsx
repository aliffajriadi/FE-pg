import type { Metadata } from 'next';
import TransactionsTable from '@/features/admin/transactions/TransactionsTable';

export const metadata: Metadata = { title: 'Riwayat Transaksi' };

export default function AdminTransactionsPage() {
  return <TransactionsTable />;
}
