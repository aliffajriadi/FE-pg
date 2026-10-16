import type { Metadata } from 'next';
import GuideEditor from '@/features/admin/guides/GuideEditor';

export const metadata: Metadata = { title: 'Edit Panduan' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuideEditor id={Number(id) || 0} />;
}
