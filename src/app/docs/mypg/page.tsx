import type { Metadata } from 'next';
import ApiDocs from '@/features/docs/ApiDocs';

export const metadata: Metadata = { title: 'Dokumentasi API MyPG' };

export default function MypgDocsPage() {
  return <ApiDocs variant="mypg" />;
}
