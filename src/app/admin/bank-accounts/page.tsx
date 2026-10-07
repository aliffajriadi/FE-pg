import type { Metadata } from 'next';
import BankAccountsTable from '@/features/admin/bank-accounts/BankAccountsTable';

export const metadata: Metadata = { title: 'Rekening Bank' };

export default function AdminBankAccountsPage() {
  return <BankAccountsTable />;
}
