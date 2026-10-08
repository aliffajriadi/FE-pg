import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { GlobalIntegrationSection, ProjectsSection } from './ApiIntegration';

export default function MerchantSettings() {
  return (
    <>
      <PageHeader title="Integrasi API" description="Kelola proyek, API Key, dan Webhook untuk aplikasi Anda.">
        <Link href="/docs" target="_blank" className={buttonVariants({ variant: 'outline' })}>
          <BookOpen /> Dokumentasi API
        </Link>
      </PageHeader>
      <ProjectsSection />
      <GlobalIntegrationSection />
    </>
  );
}
