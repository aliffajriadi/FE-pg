import type { Metadata } from 'next';
import SubadminAccount from '@/features/subadmin/SubadminAccount';

export const metadata: Metadata = { title: 'Pengaturan Akun' };

export default function SubadminAccountPage() {
  return <SubadminAccount />;
}
