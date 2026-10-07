import type { Metadata } from 'next';
import MerchantTicketDetail from '@/features/merchant/support/MerchantTicketDetail';

export const metadata: Metadata = { title: 'Detail Tiket' };

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MerchantTicketDetail ticketId={Number(id)} />;
}
