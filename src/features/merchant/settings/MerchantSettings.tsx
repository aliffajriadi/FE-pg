import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { GlobalApiKeysCard, GlobalWebhooksCard, ProjectsCard } from './ApiIntegration';
import { ProfileCard } from './ProfileForms';

export default function MerchantSettings() {
  return (
    <>
      <PageHeader title="Pengaturan & API" description="Profil akun dan integrasi API untuk aplikasi Anda.">
        <Link href="/docs" target="_blank" className={buttonVariants({ variant: 'outline' })}>
          <BookOpen /> Dokumentasi API
        </Link>
      </PageHeader>
      <ProjectsCard />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ProfileCard />
        <div className="space-y-4">
          <GlobalWebhooksCard />
          <GlobalApiKeysCard />
        </div>
      </div>
    </>
  );
}
