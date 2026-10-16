import type { Metadata } from 'next';
import GuideDetail from '@/features/guides/GuideDetail';

export const metadata: Metadata = { title: 'Tata Cara' };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GuideDetail slug={decodeURIComponent(slug)} backHref="/dashboard/guides" />;
}
