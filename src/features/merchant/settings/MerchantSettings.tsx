import Link from 'next/link';
import { BookOpen, FlaskConical } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { GlobalIntegrationSection, ProjectRequestsSection, ProjectsSection } from './ApiIntegration';

export default function MerchantSettings() {
  return (
    <>
      <PageHeader title="Integrasi API" description="Kelola proyek, API Key, dan Webhook untuk aplikasi Anda.">
        <Link href="/docs" target="_blank" className={buttonVariants({ variant: 'outline' })}>
          <BookOpen /> Dokumentasi API
        </Link>
      </PageHeader>

      <p className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <FlaskConical className="size-4 shrink-0" />
        Ingin uji coba? API Key dan Webhook sandbox bebas dibuat tanpa pengajuan di halaman{' '}
        <Link href="/dashboard/sandbox" className="font-medium text-primary underline">
          Sandbox
        </Link>
        .
      </p>

      <ProjectsSection mode="LIVE" />
      <ProjectRequestsSection />
      <GlobalIntegrationSection mode="LIVE" />
    </>
  );
}
