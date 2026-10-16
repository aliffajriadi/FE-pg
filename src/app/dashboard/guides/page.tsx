import type { Metadata } from 'next';
import GuideList from '@/features/guides/GuideList';

export const metadata: Metadata = { title: 'Tata Cara' };

export default function Page() {
  return <GuideList audiences={['ALL']} basePath="/dashboard/guides" title="Tata Cara" />;
}
