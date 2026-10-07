import type { Metadata } from 'next';
import UsersTable from '@/features/admin/users/UsersTable';

export const metadata: Metadata = { title: 'Manajemen Pengguna' };

export default function AdminUsersPage() {
  return <UsersTable />;
}
