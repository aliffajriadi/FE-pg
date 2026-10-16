import type { Metadata } from 'next';
import MypgOverview from '@/features/mypg/MypgOverview';

export const metadata: Metadata = { title: 'Beranda MyPG' };

export default function Page() {
  return <MypgOverview />;
}
