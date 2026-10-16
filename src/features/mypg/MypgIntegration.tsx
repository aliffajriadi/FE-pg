import Link from 'next/link';
import { BookOpen, FlaskConical } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProjectsSection } from '@/features/merchant/settings/ApiIntegration';

export default function MypgIntegration() {
  return (
    <>
      <PageHeader title="Integrasi API MyPG" description="Kelola proyek, API Key, dan Webhook MyPG. Terpisah dari integrasi dashboard live.">
        <Link href="/docs/mypg" target="_blank" className={buttonVariants({ variant: 'outline' })}>
          <BookOpen /> Dokumentasi MyPG
        </Link>
      </PageHeader>

      <p className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <FlaskConical className="size-4 shrink-0" />
        Ingin uji coba? API Key dan Webhook sandbox MyPG ada di halaman{' '}
        <Link href="/dashboard/mypg/sandbox" className="font-medium text-primary underline">
          Sandbox MyPG
        </Link>
        .
      </p>

      <ProjectsSection mode="LIVE" />
    </>
  );
}
