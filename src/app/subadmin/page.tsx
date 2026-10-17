import type { Metadata } from 'next';
import SubadminDashboard from '@/features/subadmin/SubadminDashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default function SubadminPage() {
  return <SubadminDashboard />;
}
