import type { Metadata } from 'next';
import SystemSettings from '@/features/admin/settings/SystemSettings';

export const metadata: Metadata = { title: 'Pengaturan Sistem' };

export default function AdminSettingsPage() {
  return <SystemSettings />;
}
