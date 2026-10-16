import type { Metadata } from 'next';
import AdminMypgLicenses from '@/features/admin/mypg/AdminMypgLicenses';

export const metadata: Metadata = { title: 'Lisensi MyPG' };

export default function AdminMypgLicensesPage() {
  return <AdminMypgLicenses />;
}
