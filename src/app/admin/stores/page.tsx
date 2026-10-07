import type { Metadata } from 'next';
import StoresTable from '@/features/admin/stores/StoresTable';

export const metadata: Metadata = { title: 'Manajemen Toko' };

export default function AdminStoresPage() {
  return <StoresTable />;
}
