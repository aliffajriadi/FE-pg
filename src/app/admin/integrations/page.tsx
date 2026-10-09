import type { Metadata } from 'next';
import IntegrationsTable from '@/features/admin/integrations/IntegrationsTable';

export const metadata: Metadata = { title: 'Integrasi Merchant' };

export default function AdminIntegrationsPage() {
  return <IntegrationsTable />;
}
