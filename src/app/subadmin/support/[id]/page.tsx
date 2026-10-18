import type { Metadata } from 'next';
import TicketDetail from '@/features/admin/support/TicketDetail';

export const metadata: Metadata = { title: 'Detail Tiket' };

export default async function SubadminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetail ticketId={Number(id)} basePath="/subadmin/support" />;
}
