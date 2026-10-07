'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Eye, EyeOff, KeyRound, Layers, Loader2, Send, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import type { ApiKey, Webhook } from '@/types';
import {
  CreateApiKeyDialog,
  CreateProjectDialog,
  CreateWebhookDialog,
  INTEGRATION_KEYS,
  RegenerateSecretDialog,
} from './IntegrationDialogs';

function ActiveBadge({ active }: { active: boolean }) {
  return <ToneBadge tone={active ? 'success' : 'danger'}>{active ? 'Aktif' : 'Nonaktif'}</ToneBadge>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">{children}</p>;
}

function ApiKeyItem({ apiKey }: { apiKey: ApiKey }) {
  return (
    <div className="space-y-1 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {apiKey.name} <ActiveBadge active={apiKey.isActive} />
      </div>
      <code className="block font-mono text-xs break-all text-muted-foreground">{apiKey.key}</code>
    </div>
  );
}

function WebhookItem({ webhook }: { webhook: Webhook }) {
  const [showSecret, setShowSecret] = useState(false);
  const options = { invalidate: INTEGRATION_KEYS };
  const test = useApiMutation(() => merchantApi.testWebhook(webhook.id));
  const toggle = useApiMutation(() => merchantApi.updateWebhook(webhook.id, { isActive: !webhook.isActive }), {
    ...options,
    successMessage: webhook.isActive ? 'Webhook dijeda' : 'Webhook diaktifkan',
  });
  const remove = useApiMutation(() => merchantApi.deleteWebhook(webhook.id), options);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {webhook.name} <ActiveBadge active={webhook.isActive} />
      </div>
      <code className="block font-mono text-xs break-all text-muted-foreground">{webhook.url}</code>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Secret:</span>
        <code className={`min-w-0 truncate font-mono ${showSecret ? '' : 'blur-sm select-none'}`}>{webhook.secret}</code>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setShowSecret((v) => !v)}
          aria-label={showSecret ? 'Sembunyikan secret' : 'Tampilkan secret'}
        >
          {showSecret ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => test.mutate()} disabled={test.isPending}>
          {test.isPending ? <Loader2 className="animate-spin" /> : <Send />} Tes
        </Button>
        <Button variant="outline" size="sm" onClick={() => toggle.mutate()} disabled={toggle.isPending}>
          {webhook.isActive ? 'Jeda' : 'Aktifkan'}
        </Button>
        <RegenerateSecretDialog webhookId={webhook.id} />
        <ConfirmAction
          destructive
          title={`Hapus webhook "${webhook.name}"?`}
          description="Webhook ini tidak akan menerima notifikasi lagi."
          confirmLabel="Hapus"
          onConfirm={() => remove.mutateAsync()}
        >
          <Trash2 /> Hapus
        </ConfirmAction>
      </div>
    </div>
  );
}

export function ProjectsCard() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['merchant-projects'],
    queryFn: merchantApi.getProjects,
    select: (res) => res.data,
  });
  const remove = useApiMutation(merchantApi.deleteProject, { invalidate: INTEGRATION_KEYS });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4" /> Proyek
          </CardTitle>
          <CardDescription>
            Tiap proyek punya API Key dan Webhook sendiri. Notifikasi hanya dikirim ke webhook proyek yang membuat invoice.
          </CardDescription>
        </div>
        <CreateProjectDialog />
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat proyek...</p>
        ) : error ? (
          <p className="text-sm text-destructive">Gagal memuat proyek: {error.message}</p>
        ) : !projects?.length ? (
          <Empty>Belum ada proyek. Klik &quot;Proyek Baru&quot; untuk mulai.</Empty>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="overflow-hidden rounded-xl border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Box className="size-4 text-primary" /> {project.name} <ActiveBadge active={project.isActive} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <CreateApiKeyDialog label="API Key" variant="outline" projectId={project.id} projectName={project.name} />
                  <CreateWebhookDialog label="Webhook" variant="outline" projectId={project.id} projectName={project.name} />
                  <ConfirmAction
                    destructive
                    title={`Hapus proyek "${project.name}"?`}
                    description="API Key dan Webhook proyek ini tidak terhapus, hanya dilepas dari proyek dan menjadi global."
                    confirmLabel="Hapus Proyek"
                    onConfirm={() => remove.mutateAsync(project.id)}
                  >
                    Hapus
                  </ConfirmAction>
                </div>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <KeyRound className="size-3" /> API KEY
                  </p>
                  {project.apiKeys.length ? (
                    project.apiKeys.map((k) => <ApiKeyItem key={k.id} apiKey={k} />)
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Belum ada API Key</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <WebhookIcon className="size-3" /> WEBHOOK
                  </p>
                  {project.webhooks.length ? (
                    project.webhooks.map((w) => <WebhookItem key={w.id} webhook={w} />)
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Belum ada Webhook</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function GlobalWebhooksCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-webhooks'],
    queryFn: merchantApi.getWebhooks,
    select: (res) => res.data.filter((w) => !w.projectId),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <WebhookIcon className="size-4" /> Webhook Global
          </CardTitle>
          <CardDescription>Dikirim untuk invoice yang dibuat tanpa proyek (misal dari Dashboard).</CardDescription>
        </div>
        <CreateWebhookDialog label="Tambah" />
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : data?.length ? (
          data.map((w) => <WebhookItem key={w.id} webhook={w} />)
        ) : (
          <Empty>Belum ada webhook global.</Empty>
        )}
      </CardContent>
    </Card>
  );
}

export function GlobalApiKeysCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-api-keys'],
    queryFn: merchantApi.getApiKeys,
    select: (res) => res.data.filter((k) => !k.projectId),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" /> API Key Global
          </CardTitle>
          <CardDescription>Tidak terikat proyek tertentu.</CardDescription>
        </div>
        <CreateApiKeyDialog label="Buat Baru" />
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : data?.length ? (
          data.map((k) => <ApiKeyItem key={k.id} apiKey={k} />)
        ) : (
          <Empty>Belum ada API Key global.</Empty>
        )}
      </CardContent>
    </Card>
  );
}

