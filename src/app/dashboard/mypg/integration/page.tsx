import type { Metadata } from 'next';
import MypgIntegration from '@/features/mypg/MypgIntegration';

export const metadata: Metadata = { title: 'Integrasi API MyPG' };

export default function Page() {
  return <MypgIntegration />;
}
