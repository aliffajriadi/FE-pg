import type { Metadata } from 'next';
import SandboxPage from '@/features/merchant/sandbox/SandboxPage';

export const metadata: Metadata = { title: 'Sandbox MyPG' };

export default function Page() {
  return <SandboxPage />;
}
