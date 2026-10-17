import type { Metadata } from 'next';
import Subadmins from '@/features/admin/subadmins/Subadmins';

export const metadata: Metadata = { title: 'Sub Admin' };

export default function AdminSubadminsPage() {
  return <Subadmins />;
}
