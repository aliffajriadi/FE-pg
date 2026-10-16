import type { Metadata } from 'next';
import TransactionTracking from '@/features/admin/tracking/TransactionTracking';

export const metadata: Metadata = { title: 'Tracking Transaksi' };

export default function AdminTrackingPage() {
  return <TransactionTracking />;
}
