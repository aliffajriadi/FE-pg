import type { Metadata } from 'next';
import OrdersTable from '@/features/merchant/orders/OrdersTable';

export const metadata: Metadata = { title: 'Data Transaksi' };

export default function OrdersPage() {
  return <OrdersTable />;
}
