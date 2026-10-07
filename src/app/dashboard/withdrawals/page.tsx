import type { Metadata } from 'next';
import MerchantWithdrawals from '@/features/merchant/withdrawals/MerchantWithdrawals';

export const metadata: Metadata = { title: 'Tarik Saldo' };

export default function WithdrawalsPage() {
  return <MerchantWithdrawals />;
}
