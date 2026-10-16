import type { Metadata } from 'next';
import AdminMypgApp from '@/features/admin/mypg/AdminMypgApp';

export const metadata: Metadata = { title: 'Aplikasi MyPG' };

export default function Page() {
  return <AdminMypgApp />;
}
