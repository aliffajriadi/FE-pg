import type { Metadata } from 'next';
import WithdrawalsTable from '@/features/admin/withdrawals/WithdrawalsTable';

export const metadata: Metadata = { title: 'Daftar Penarikan' };

export default function AdminWithdrawalsPage() {
  return <WithdrawalsTable />;
}
