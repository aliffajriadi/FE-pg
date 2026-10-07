import type { Metadata } from 'next';
import AdminLogs from '@/features/admin/logs/AdminLogs';

export const metadata: Metadata = { title: 'Log Aktivitas' };

export default function AdminLogsPage() {
  return <AdminLogs />;
}
