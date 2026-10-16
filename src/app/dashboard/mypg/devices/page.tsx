import type { Metadata } from 'next';
import MypgDevices from '@/features/mypg/MypgDevices';

export const metadata: Metadata = { title: 'Perangkat & QRIS' };

export default function Page() {
  return <MypgDevices />;
}
