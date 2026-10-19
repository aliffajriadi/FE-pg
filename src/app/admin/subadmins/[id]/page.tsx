import type { Metadata } from 'next';
import SubadminDetail from '@/features/admin/subadmins/SubadminDetail';

export const metadata: Metadata = { title: 'Kelola Saldo Sub Admin' };

export default async function AdminSubadminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubadminDetail id={Number(id)} />;
}
