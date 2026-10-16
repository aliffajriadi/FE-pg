'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Send,
  Trash2,
  Webhook as WebhookIcon,
} from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { CopyButton } from '@/components/shared/CopyButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { ApiKey, IntegrationMode, Webhook } from '@/types';
import {
  CreateApiKeyDialog,
  CreateProjectDialog,
  RequestProjectDialog,
  CreateWebhookDialog,
  RegenerateSecretDialog,
} from './IntegrationDialogs';
import { integrationKeysOf, useIntegrationClient } from './integration-client';

const isKeyIn = (mode: IntegrationMode) => (k: ApiKey) => (k.isSandbox === true) === (mode === 'SANDBOX');
const isWebhookIn = (mode: IntegrationMode) => (w: Webhook) => (w.mode === 'SANDBOX') === (mode === 'SANDBOX');

function ActiveBadge({ active }: { active: boolean }) {
  return <ToneBadge tone={active ? 'success' : 'danger'}>{active ? 'Aktif' : 'Nonaktif'}</ToneBadge>;
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">{children}</p>;
}

function ApiKeyItem({ apiKey }: { apiKey: ApiKey }) {
  const client = useIntegrationClient();
  const remove = useApiMutation(() => client.api.deleteApiKey(apiKey.id), { invalidate: integrationKeysOf(client) });
  return (
    <div className="space-y-1 rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="truncate">{apiKey.name}</span> <ActiveBadge active={apiKey.isActive} />
        {(apiKey.isSandbox || client.canDeleteLiveKeys) && (
          <ConfirmAction
            destructive
            variant="ghost"
            size="xs"
            className="ml-auto text-destructive"
            title={`Hapus API Key "${apiKey.name}"?`}
            description={
              apiKey.isSandbox
                ? 'Aplikasi yang masih memakai key ini tidak akan bisa mengakses sandbox lagi.'
                : 'Aplikasi yang masih memakai key ini tidak akan bisa membuat invoice lagi.'
            }
            confirmLabel="Hapus"
            onConfirm={() => remove.mutateAsync()}
          >
            <Trash2 /> Hapus
          </ConfirmAction>
        )}
      </div>
      <div className="flex items-center gap-1">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{apiKey.key}</code>
        <CopyButton value={apiKey.key} label="Salin API Key" />
      </div>
    </div>
  );
}

function WebhookItem({ webhook }: { webhook: Webhook }) {
  const [showSecret, setShowSecret] = useState(false);
  const client = useIntegrationClient();
  const options = { invalidate: integrationKeysOf(client) };
  const test = useApiMutation(() => client.api.testWebhook(webhook.id));
  const toggle = useApiMutation(() => client.api.updateWebhook(webhook.id, { isActive: !webhook.isActive }), {
    ...options,
    successMessage: webhook.isActive ? 'Webhook dijeda' : 'Webhook diaktifkan',
  });
  const remove = useApiMutation(() => client.api.deleteWebhook(webhook.id), options);

  return (
    <div className="space-y-2 rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="truncate">{webhook.name}</span> <ActiveBadge active={webhook.isActive} />
      </div>
      <code className="block truncate font-mono text-xs text-muted-foreground" title={webhook.url}>
        {webhook.url}
      </code>
      <div className="flex items-center gap-1 text-xs">
        <span className="shrink-0 text-muted-foreground">Secret:</span>
        <code className={`min-w-0 flex-1 truncate font-mono ${showSecret ? '' : 'blur-sm select-none'}`}>{webhook.secret}</code>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setShowSecret((v) => !v)}
          aria-label={showSecret ? 'Sembunyikan secret' : 'Tampilkan secret'}
        >
          {showSecret ? <EyeOff /> : <Eye />}
        </Button>
        <CopyButton value={webhook.secret} label="Salin secret" />
      </div>
      <div className="flex flex-wrap gap-1.5 border-t pt-2">
        <Button variant="outline" size="xs" onClick={() => test.mutate()} disabled={test.isPending}>
          {test.isPending ? <Loader2 className="animate-spin" /> : <Send />} Tes
        </Button>
        <Button variant="outline" size="xs" onClick={() => toggle.mutate()} disabled={toggle.isPending}>
          {webhook.isActive ? 'Jeda' : 'Aktifkan'}
        </Button>
        <RegenerateSecretDialog webhookId={webhook.id} />
        <ConfirmAction
          destructive
          variant="ghost"
          size="xs"
          className="ml-auto text-destructive"
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

/** Kolom daftar API Key / Webhook dengan tombol tambah di judulnya. */
function ItemColumn({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof KeyRound;
  title: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Icon className="size-3.5" /> {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

function CountChip({ icon: Icon, count, label }: { icon: typeof KeyRound; count: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Icon className="size-3" /> {count} {label}
    </span>
  );
}

const ONBOARDING_STEPS = [
  'Ajukan proyek dan jelaskan kegunaannya, lalu tunggu persetujuan admin.',
  'Setelah disetujui, buat 1 API Key untuk proyek tersebut.',
  'Tambahkan 1 Webhook agar aplikasi menerima notifikasi pesanan.',
];

const MYPG_ONBOARDING_STEPS = [
  'Buat proyek untuk aplikasi atau bot Anda. Langsung aktif, tanpa pengajuan.',
  'Buat API Key MyPG (mp_live_...) untuk proyek tersebut.',
  'Tambahkan Webhook agar aplikasi menerima notifikasi pembayaran.',
];

export function ProjectsSection({ mode }: { mode: IntegrationMode }) {
  const sandbox = mode === 'SANDBOX';
  const client = useIntegrationClient();
  const direct = client.directProjects;
  const { data: rawProjects, isLoading, error } = useQuery({
    queryKey: client.keys.projects,
    queryFn: client.api.getProjects,
    select: (res) => res.data,
  });
  // Tiap proyek hanya menampilkan key & webhook sesuai mode yang dipilih
  const projects = rawProjects?.map((p) => ({
    ...p,
    apiKeys: p.apiKeys.filter(isKeyIn(mode)),
    webhooks: p.webhooks.filter(isWebhookIn(mode)),
  }));
  const remove = useApiMutation(client.api.deleteProject, { invalidate: integrationKeysOf(client) });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            Proyek {projects?.length ? <span className="text-muted-foreground">({projects.length})</span> : null}
          </h2>
          <p className="text-sm text-muted-foreground">
            {sandbox
              ? 'Proyek yang sama dipakai untuk uji coba. Key dan webhook sandbox terpisah dari yang live.'
              : direct
                ? 'Tiap proyek punya API Key dan Webhook MyPG sendiri. Proyek bisa langsung dibuat tanpa pengajuan.'
                : 'Tiap proyek mendapat 1 API Key dan 1 Webhook live. Proyek baru harus diajukan dan disetujui admin.'}
          </p>
        </div>
        {direct ? <CreateProjectDialog /> : <RequestProjectDialog />}
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : error ? (
        <p className="text-sm text-destructive">Gagal memuat proyek: {error.message}</p>
      ) : !projects?.length ? (
        <Card className="border-dashed">
          <CardContent className="space-y-4 py-4">
            <p className="font-medium">{direct ? 'Mulai integrasi dengan membuat proyek' : 'Mulai integrasi dengan mengajukan proyek'}</p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {(direct ? MYPG_ONBOARDING_STEPS : ONBOARDING_STEPS).map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <details key={project.id} className="group overflow-hidden rounded-xl border bg-card" open={index === 0}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                <Box className="size-4 shrink-0 text-primary" />
                <span className="font-semibold">{project.name}</span>
                <ActiveBadge active={project.isActive} />
                <span className="flex gap-1.5">
                  <CountChip icon={KeyRound} count={project.apiKeys.length} label="API Key" />
                  <CountChip icon={WebhookIcon} count={project.webhooks.length} label="Webhook" />
                </span>
                <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t bg-muted/20 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <ItemColumn
                    icon={KeyRound}
                    title="API Key"
                    action={<CreateApiKeyDialog label="Tambah" variant="outline" mode={mode} projectId={project.id} projectName={project.name} />}
                  >
                    {project.apiKeys.length ? (
                      project.apiKeys.map((k) => <ApiKeyItem key={k.id} apiKey={k} />)
                    ) : (
                      <EmptyLine>{sandbox ? 'Belum ada API Key sandbox' : 'Belum ada API Key'}</EmptyLine>
                    )}
                  </ItemColumn>
                  <ItemColumn
                    icon={WebhookIcon}
                    title="Webhook"
                    action={<CreateWebhookDialog label="Tambah" variant="outline" mode={mode} projectId={project.id} projectName={project.name} />}
                  >
                    {project.webhooks.length ? (
                      project.webhooks.map((w) => <WebhookItem key={w.id} webhook={w} />)
                    ) : (
                      <EmptyLine>{sandbox ? 'Belum ada Webhook sandbox' : 'Belum ada Webhook'}</EmptyLine>
                    )}
                  </ItemColumn>
                </div>
                <div className="flex justify-end border-t pt-3">
                  <ConfirmAction
                    destructive
                    variant="ghost"
                    className="text-destructive"
                    title={`Hapus proyek "${project.name}"?`}
                    description={
                      direct
                        ? 'API Key dan Webhook MyPG di proyek ini ikut dihapus dan tidak bisa dipakai lagi.'
                        : 'API Key dan Webhook proyek ini tidak terhapus, hanya dilepas dari proyek dan menjadi global.'
                    }
                    confirmLabel="Hapus Proyek"
                    onConfirm={() => remove.mutateAsync(project.id)}
                  >
                    <Trash2 /> Hapus Proyek
                  </ConfirmAction>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

/** Riwayat pengajuan proyek beserta status dan catatan admin. */
export function ProjectRequestsSection() {
  const { data } = useQuery({
    queryKey: ['merchant-project-requests'],
    queryFn: merchantApi.getProjectRequests,
    select: (res) => res.data,
  });
  if (!data?.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Pengajuan Proyek</h2>
      <div className="divide-y rounded-xl border bg-card">
        {data.map((r) => (
          <div key={r.id} className="space-y-1 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{r.name}</span>
              <StatusBadge status={r.status} />
              <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
            </div>
            <p className="text-muted-foreground">{r.purpose}</p>
            {r.adminNote && <p className="text-xs">Catatan admin: {r.adminNote}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

/** API Key & Webhook tanpa proyek, disembunyikan di bagian yang bisa dibuka. */
export function GlobalIntegrationSection({ mode }: { mode: IntegrationMode }) {
  const sandbox = mode === 'SANDBOX';
  const client = useIntegrationClient();
  const apiKeys = useQuery({
    queryKey: client.keys.apiKeys,
    queryFn: client.api.getApiKeys,
    select: (res) => res.data.filter((k) => !k.projectId && isKeyIn(mode)(k)),
  });
  const webhooks = useQuery({
    queryKey: client.keys.webhooks,
    queryFn: client.api.getWebhooks,
    select: (res) => res.data.filter((w) => !w.projectId && isWebhookIn(mode)(w)),
  });

  const keyCount = apiKeys.data?.length ?? 0;
  const webhookCount = webhooks.data?.length ?? 0;

  // Integrasi global tidak ditawarkan lagi: hanya tampil bagi merchant yang sudah memakainya
  if (apiKeys.isLoading || webhooks.isLoading || (!keyCount && !webhookCount)) return null;

  return (
    <details className="group overflow-hidden rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        <Globe className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0">
          <span className="block font-medium">Integrasi Global (tanpa proyek)</span>
          <span className="block text-xs text-muted-foreground">
            Untuk invoice yang dibuat tanpa proyek. Fitur lama, proyek baru perlu diajukan.
          </span>
        </span>
        <span className="flex gap-1.5">
          <CountChip icon={KeyRound} count={keyCount} label="API Key" />
          <CountChip icon={WebhookIcon} count={webhookCount} label="Webhook" />
        </span>
        <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-4 border-t bg-muted/20 p-4 md:grid-cols-2">
        <ItemColumn icon={KeyRound} title={sandbox ? 'API Key Sandbox Global' : 'API Key Global'} action={<CreateApiKeyDialog label="Tambah" variant="outline" mode={mode} />}>
          {apiKeys.isLoading ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : keyCount ? (
            apiKeys.data!.map((k) => <ApiKeyItem key={k.id} apiKey={k} />)
          ) : (
            <EmptyLine>{sandbox ? 'Belum ada API Key sandbox global' : 'Belum ada API Key global'}</EmptyLine>
          )}
        </ItemColumn>
        <ItemColumn icon={WebhookIcon} title={sandbox ? 'Webhook Sandbox Global' : 'Webhook Global'} action={<CreateWebhookDialog label="Tambah" variant="outline" mode={mode} />}>
          {webhooks.isLoading ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : webhookCount ? (
            webhooks.data!.map((w) => <WebhookItem key={w.id} webhook={w} />)
          ) : (
            <EmptyLine>{sandbox ? 'Belum ada webhook sandbox global' : 'Belum ada webhook global'}</EmptyLine>
          )}
        </ItemColumn>
      </div>
    </details>
  );
}

/** API Key & Webhook sandbox untuk halaman Sandbox: bebas dibuat, tanpa proyek maupun pengajuan. */
export function SandboxIntegrationSection() {
  const client = useIntegrationClient();
  const apiKeys = useQuery({
    queryKey: client.keys.apiKeys,
    queryFn: client.api.getApiKeys,
    select: (res) => res.data.filter(isKeyIn('SANDBOX')),
  });
  const webhooks = useQuery({
    queryKey: client.keys.webhooks,
    queryFn: client.api.getWebhooks,
    select: (res) => res.data.filter(isWebhookIn('SANDBOX')),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card size="sm">
        <CardContent className="space-y-3">
          <ItemColumn icon={KeyRound} title="API Key Sandbox" action={<CreateApiKeyDialog label="Buat Key" variant="outline" mode="SANDBOX" />}>
            {apiKeys.isLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : apiKeys.data?.length ? (
              apiKeys.data.map((k) => <ApiKeyItem key={k.id} apiKey={k} />)
            ) : (
              <EmptyLine>Belum ada API Key sandbox. Klik &ldquo;Buat Key&rdquo; untuk mulai.</EmptyLine>
            )}
          </ItemColumn>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardContent className="space-y-3">
          <ItemColumn icon={WebhookIcon} title="Webhook Sandbox" action={<CreateWebhookDialog label="Tambah Webhook" variant="outline" mode="SANDBOX" />}>
            {webhooks.isLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : webhooks.data?.length ? (
              webhooks.data.map((w) => <WebhookItem key={w.id} webhook={w} />)
            ) : (
              <EmptyLine>Belum ada webhook sandbox. Opsional, untuk menerima notifikasi uji coba.</EmptyLine>
            )}
          </ItemColumn>
        </CardContent>
      </Card>
    </div>
  );
}
