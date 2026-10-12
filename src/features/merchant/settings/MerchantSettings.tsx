'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, FlaskConical } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { cn } from '@/lib/utils';
import type { IntegrationMode } from '@/types';
import { GlobalIntegrationSection, ProjectRequestsSection, ProjectsSection } from './ApiIntegration';

const MODE_TABS = [
  { value: 'LIVE', label: 'Live' },
  { value: 'SANDBOX', label: 'Sandbox (uji coba)' },
];

export default function MerchantSettings() {
  const [mode, setMode] = useState<IntegrationMode>('LIVE');
  const sandbox = mode === 'SANDBOX';

  return (
    <>
      <PageHeader title="Integrasi API" description="Kelola proyek, API Key, dan Webhook untuk aplikasi Anda.">
        <Link href="/docs" target="_blank" className={buttonVariants({ variant: 'outline' })}>
          <BookOpen /> Dokumentasi API
        </Link>
      </PageHeader>

      <StatusTabs tabs={MODE_TABS} value={mode} onChange={(value) => setMode(value as IntegrationMode)} />

      {sandbox && (
        <div
          className={cn(
            'flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between'
          )}
        >
          <p className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <FlaskConical className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Mode Sandbox.</strong> Key <code className="font-mono">pk_test_...</code> dan webhook di sini hanya untuk uji
              coba. Tidak ada uang yang berpindah, dan tidak masuk ke transaksi maupun saldo asli.
            </span>
          </p>
          <Link href="/dashboard/sandbox" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}>
            Buka halaman Sandbox
          </Link>
        </div>
      )}

      <ProjectsSection mode={mode} />
      <ProjectRequestsSection />
      <GlobalIntegrationSection mode={mode} />
    </>
  );
}
