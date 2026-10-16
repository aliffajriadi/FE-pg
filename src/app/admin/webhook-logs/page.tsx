import type { Metadata } from 'next';
import WebhookLogs from '@/features/admin/webhook-logs/WebhookLogs';

export const metadata: Metadata = { title: 'Log Webhook Merchant' };

export default function AdminWebhookLogsPage() {
  return <WebhookLogs />;
}
