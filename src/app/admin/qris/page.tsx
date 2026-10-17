import type { Metadata } from 'next';
import QrisList from '@/features/admin/qris/QrisList';

export const metadata: Metadata = { title: 'QRIS' };

export default function AdminQrisPage() {
  return <QrisList />;
}
