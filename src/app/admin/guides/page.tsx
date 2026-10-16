import type { Metadata } from 'next';
import AdminGuides from '@/features/admin/guides/AdminGuides';

export const metadata: Metadata = { title: 'Tata Cara' };

export default function Page() {
  return <AdminGuides />;
}
