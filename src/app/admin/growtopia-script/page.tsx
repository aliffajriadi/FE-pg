import type { Metadata } from 'next';
import GrowtopiaScript from '@/features/admin/growtopia-script/GrowtopiaScript';

export const metadata: Metadata = { title: 'Script Growtopia' };

export default function AdminGrowtopiaScriptPage() {
  return <GrowtopiaScript />;
}
