import type { Metadata } from 'next';
import TicketsTable from '@/features/admin/support/TicketsTable';

export const metadata: Metadata = { title: 'Support Tiket' };

export default function AdminSupportPage() {
  return <TicketsTable />;
}
