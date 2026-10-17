import { AppShell } from '@/components/layout/AppShell';

export default function SubadminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="SUBADMIN">{children}</AppShell>;
}
