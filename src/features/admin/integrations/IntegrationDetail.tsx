'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Box, Eye, EyeOff, Globe, KeyRound, Loader2, Webhook as WebhookIcon } from 'lucide-react';
import {
  adminApi,
  type AdminIntegrationDelivery,
  type AdminIntegrationKey,
  type AdminIntegrationWebhook,
  type DeliveryStats,
} from '@/lib/api/admin';
import { cn, formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { CopyButton } from '@/components/shared/CopyButton';

const ModeBadge = ({ sandbox }: { sandbox: boolean }) => (
  <ToneBadge tone={sandbox ? 'warning' : 'info'}>{sandbox ? 'Sandbox' : 'Live'}</ToneBadge>
);
const ActiveBadge = ({ active }: { active: boolean }) => (
  <ToneBadge tone={active ? 'success' : 'danger'}>{active ? 'Aktif' : 'Nonaktif'}</ToneBadge>
);
const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">{children}</p>
);

/** Nilai kredensial dengan tombol salin. */
function ValueLine({ label, value, mono = true }: { label?: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      {label && <span className="shrink-0 text-muted-foreground">{label}</span>}
      <code className={cn('min-w-0 flex-1 truncate', mono && 'font-mono')} title={value}>
        {value}
      </code>
      <CopyButton value={value} label={label ? `Salin ${label}` : 'Salin'} />
    </div>
  );
}

/** Secret: tersembunyi (blur) sampai tombol mata ditekan, seperti di halaman merchant. */
function SecretLine({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="shrink-0 text-muted-foreground">Secret:</span>
      <code className={cn('min-w-0 flex-1 truncate font-mono', !show && 'blur-sm select-none')}>{value}</code>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Sembunyikan secret' : 'Tampilkan secret'}
      >
        {show ? <EyeOff /> : <Eye />}
      </Button>
      <CopyButton value={value} label="Salin secret" />
    </div>
  );
}

function KeyItem({ apiKey }: { apiKey: AdminIntegrationKey }) {
  return (
    <div className="space-y-1 rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
        <span className="truncate">{apiKey.name}</span>
        <ModeBadge sandbox={apiKey.isSandbox} />
        <ActiveBadge active={apiKey.isActive} />
      </div>
      <ValueLine value={apiKey.key} />
      <p className="text-xs text-muted-foreground">
        {apiKey.lastUsedAt ? `Terakhir dipakai ${formatDate(apiKey.lastUsedAt)}` : 'Belum pernah dipakai'} · dibuat{' '}
        {formatDate(apiKey.createdAt, false)}
      </p>
    </div>
  );
}

function WebhookItem({ webhook }: { webhook: AdminIntegrationWebhook }) {
  return (
    <div className="space-y-1 rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
        <span className="truncate">{webhook.name}</span>
        <ModeBadge sandbox={webhook.mode === 'SANDBOX'} />
        <ActiveBadge active={webhook.isActive} />
      </div>
      <ValueLine value={webhook.url} />
      <SecretLine value={webhook.secret} />
      <p className="text-xs text-muted-foreground">Dibuat {formatDate(webhook.createdAt, false)}</p>
    </div>
  );
}

function Column({ icon: Icon, title, children }: { icon: typeof KeyRound; title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}

function IntegrationGroup({
  icon: Icon,
  title,
  badge,
  apiKeys,
  webhooks,
}: {
  icon: typeof Box;
  title: string;
  badge?: React.ReactNode;
  apiKeys: AdminIntegrationKey[];
  webhooks: AdminIntegrationWebhook[];
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h2 className="font-semibold">{title}</h2>
          {badge}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Column icon={KeyRound} title={`API Key (${apiKeys.length})`}>
            {apiKeys.length ? apiKeys.map((k) => <KeyItem key={k.id} apiKey={k} />) : <Empty>Belum ada API Key</Empty>}
          </Column>
          <Column icon={WebhookIcon} title={`Webhook (${webhooks.length})`}>
            {webhooks.length ? webhooks.map((w) => <WebhookItem key={w.id} webhook={w} />) : <Empty>Belum ada Webhook</Empty>}
          </Column>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ label, tone, stats }: { label: string; tone: 'info' | 'warning'; stats: DeliveryStats }) {
  const total = stats.success + stats.failed + stats.pending;
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <div className="flex items-center gap-2">
          <ToneBadge tone={tone}>{label}</ToneBadge>
          <span className="text-xs text-muted-foreground">pengiriman webhook, 7 hari terakhir</span>
        </div>
        {total ? (
          <p className="text-sm">
            <strong className="text-emerald-600">{stats.success}</strong> berhasil ·{' '}
            <strong className={cn(stats.failed ? 'text-red-600' : 'text-muted-foreground')}>{stats.failed}</strong> gagal
            {stats.pending > 0 && <> · {stats.pending} menunggu</>}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada pengiriman</p>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryRow({ d }: { d: AdminIntegrationDelivery }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
      <TableCell>
        <code className="font-mono text-xs">{d.event}</code>
      </TableCell>
      <TableCell>
        <ModeBadge sandbox={d.isSandbox} />
      </TableCell>
      <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={d.url}>
        {d.url}
      </TableCell>
      <TableCell>
        <ToneBadge tone={d.status === 'SUCCESS' ? 'success' : d.status === 'PENDING' ? 'warning' : 'danger'}>
          {d.status === 'SUCCESS' ? 'Terkirim' : d.status === 'PENDING' ? 'Menunggu' : 'Gagal'}
          {d.responseStatus ? ` · ${d.responseStatus}` : ''}
        </ToneBadge>
        {d.status === 'FAILED' && d.lastError && (
          <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground" title={d.lastError}>
            {d.lastError}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function IntegrationDetail({ storeId }: { storeId: number }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-integration', storeId],
    queryFn: () => adminApi.getIntegration(storeId),
    select: (res) => res.data,
  });

  const backLink = (
    <Link href="/admin/integrations" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 w-fit text-muted-foreground')}>
      <ArrowLeft /> Semua merchant
    </Link>
  );

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat data integrasi...
      </p>
    );
  }

  if (error || !data) {
    return (
      <>
        {backLink}
        <p className="text-destructive">Gagal memuat data integrasi{error ? `: ${error.message}` : ''}</p>
      </>
    );
  }

  const { store } = data;
  const isEmpty =
    !data.projects.length && !data.global.apiKeys.length && !data.global.webhooks.length && !data.legacyWebhookUrl;

  return (
    <>
      {backLink}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{store.name}</h1>
            <StatusBadge status={store.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {store.user.name} · {store.user.email}
          </p>
        </div>
        <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        Halaman ini menampilkan kredensial merchant (API Key dan secret webhook). Perlakukan sebagai rahasia dan jangan dibagikan.
        Hanya untuk dilihat; secret API (sk_...) tidak tersimpan dan tidak bisa ditampilkan.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatsCard label="Live" tone="info" stats={data.deliveryStats.live} />
        <StatsCard label="Sandbox" tone="warning" stats={data.deliveryStats.sandbox} />
      </div>

      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Merchant ini belum membuat proyek, API Key, atau Webhook.
          </CardContent>
        </Card>
      )}

      {data.projects.map((project) => (
        <IntegrationGroup
          key={project.id}
          icon={Box}
          title={`Proyek: ${project.name}`}
          badge={<ActiveBadge active={project.isActive} />}
          apiKeys={project.apiKeys}
          webhooks={project.webhooks}
        />
      ))}

      {(data.global.apiKeys.length > 0 || data.global.webhooks.length > 0 || !data.projects.length) && !isEmpty && (
        <IntegrationGroup
          icon={Globe}
          title="Global (tanpa proyek)"
          apiKeys={data.global.apiKeys}
          webhooks={data.global.webhooks}
        />
      )}

      {data.legacyWebhookUrl && (
        <Card size="sm">
          <CardContent className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <WebhookIcon className="size-4" /> Webhook lama (pengaturan toko) <ToneBadge tone="neutral">Fallback</ToneBadge>
            </p>
            <ValueLine value={data.legacyWebhookUrl} />
            {data.legacyWebhookSecret && <SecretLine value={data.legacyWebhookSecret} />}
            <p className="text-xs text-muted-foreground">
              Dipakai hanya bila invoice live tidak punya webhook terdaftar. Tidak berlaku untuk sandbox.
            </p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Riwayat Pengiriman Webhook Terbaru</h2>
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>URL Tujuan</TableHead>
                <TableHead>Hasil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentDeliveries.length ? (
                data.recentDeliveries.map((d) => <DeliveryRow key={d.id} d={d} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Belum ada pengiriman webhook
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
        <p className="text-xs text-muted-foreground">Menampilkan 20 pengiriman terakhir.</p>
      </section>
    </>
  );
}
