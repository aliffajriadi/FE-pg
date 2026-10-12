import type { Metadata } from 'next';
import ProjectRequests from '@/features/admin/project-requests/ProjectRequests';

export const metadata: Metadata = { title: 'Pengajuan Proyek' };

export default function AdminProjectRequestsPage() {
  return <ProjectRequests />;
}
