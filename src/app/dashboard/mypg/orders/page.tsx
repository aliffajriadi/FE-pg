import type { Metadata } from 'next';
import MypgOrders from '@/features/mypg/MypgOrders';

export const metadata: Metadata = { title: 'Transaksi MyPG' };

export default function Page() {
  return <MypgOrders />;
}
