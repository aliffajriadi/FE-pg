import type { Metadata } from 'next';
import GuideEditor from '@/features/admin/guides/GuideEditor';

export const metadata: Metadata = { title: 'Panduan Baru' };

export default function Page() {
  return <GuideEditor id={null} />;
}
