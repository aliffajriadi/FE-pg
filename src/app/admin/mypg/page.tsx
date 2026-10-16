import type { Metadata } from 'next';
import AdminMypg from '@/features/admin/mypg/AdminMypg';

export const metadata: Metadata = { title: 'MyPG Merchant' };

export default function AdminMypgPage() {
  return <AdminMypg />;
}
