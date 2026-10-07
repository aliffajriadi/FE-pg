import type { Metadata } from 'next';
import ApiDocs from '@/features/docs/ApiDocs';

export const metadata: Metadata = { title: 'Dokumentasi API' };

export default function DocsPage() {
  return <ApiDocs />;
}
