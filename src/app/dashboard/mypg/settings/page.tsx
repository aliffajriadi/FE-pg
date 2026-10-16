import type { Metadata } from 'next';
import MypgSettingsPage from '@/features/mypg/MypgSettings';

export const metadata: Metadata = { title: 'Pengaturan MyPG' };

export default function Page() {
  return <MypgSettingsPage />;
}
