import type { Metadata } from 'next';
import AdminExternalApps from '@/features/admin/external-apps/AdminExternalApps';

export const metadata: Metadata = { title: 'Aplikasi Eksternal' };

export default function Page() {
  return <AdminExternalApps />;
}
