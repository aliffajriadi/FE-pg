import type { Metadata } from 'next';
import GuideList from '@/features/guides/GuideList';

export const metadata: Metadata = { title: 'Tata Cara MyPG' };

export default function Page() {
  return <GuideList audiences={['MYPG', 'ALL']} basePath="/dashboard/mypg/guides" title="Tata Cara MyPG" />;
}
