import type { Metadata } from 'next';
import TicketsTable from '@/features/admin/support/TicketsTable';

export const metadata: Metadata = { title: 'Tiket Support' };

export default function SubadminSupportPage() {
  return <TicketsTable basePath="/subadmin/support" />;
}
