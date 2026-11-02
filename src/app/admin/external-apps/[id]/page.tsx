import type { Metadata } from 'next';
import ExternalAppEditor from '@/features/admin/external-apps/ExternalAppEditor';

export const metadata: Metadata = { title: 'Edit Aplikasi Eksternal' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExternalAppEditor appId={Number(id)} />;
}
