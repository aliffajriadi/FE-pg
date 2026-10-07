import type { Metadata } from 'next';
import MerchantBankAccounts from '@/features/merchant/bank-accounts/MerchantBankAccounts';

export const metadata: Metadata = { title: 'Rekening Saya' };

export default function BankAccountsPage() {
  return <MerchantBankAccounts />;
}
