import type { Metadata } from 'next';
import ExternalAppEditor from '@/features/admin/external-apps/ExternalAppEditor';

export const metadata: Metadata = { title: 'Tambah Aplikasi Eksternal' };

export default function Page() {
  return <ExternalAppEditor />;
}
