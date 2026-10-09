import type { Metadata } from 'next';
import IntegrationDetail from '@/features/admin/integrations/IntegrationDetail';

export const metadata: Metadata = { title: 'Detail Integrasi Merchant' };

export default async function AdminIntegrationDetailPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <IntegrationDetail storeId={Number(storeId)} />;
}
