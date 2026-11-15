import type { Metadata } from 'next';
import MypgPanduan from '@/features/mypg/MypgPanduan';

export const metadata: Metadata = { title: 'Panduan MyPG' };

export default function Page() {
  return <MypgPanduan />;
}
