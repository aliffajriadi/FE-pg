import type { Metadata } from 'next';
import AdminOverview from '@/features/admin/overview/AdminOverview';

export const metadata: Metadata = { title: 'Ikhtisar Admin' };

export default function AdminPage() {
  return <AdminOverview />;
}
