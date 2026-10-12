'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown, ExternalLink, FlaskConical, Loader2, RotateCw } from 'lucide-react';
import { merchantApi, type SandboxOutcome } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import type { SandboxOrder, WebhookDelivery } from '@/types';
import { CreateSandboxInvoiceDialog } from './CreateSandboxInvoiceDialog';
import { SandboxIntegrationSection } from '../settings/ApiIntegration';

const VIEW_TABS = [
  { value: 'setup', label: 'API Key & Webhook' },
  { value: 'invoices', label: 'Invoice' },
  { value: 'webhooks', label: 'Log Webhook' },
];

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
];

const ACTIVE = ['PENDING', 'WAITING_PAYMENT'];

const STEPS = [
  <>
    Buat <strong>API Key sandbox</strong> (<code className="font-mono">pk_test_...</code>) di tab API Key & Webhook, dan webhook
    sandbox jika perlu. Bebas dibuat, tanpa pengajuan.
  </>,
  <>
    Panggil endpoint yang sama (<code className="font-mono">/api/v1/invoices</code>) memakai key sandbox. Format request dan
    response sama dengan yang asli.
  </>,
  <>
    Simulasikan hasil pembayaran dari tab Invoice, atau lewat API{' '}
    <code className="font-mono">POST /api/v1/sandbox/invoices/:kode/simulate</code>. Webhook sandbox akan terkirim.
  </>,
];

function SimulateButtons({ order }: { order: SandboxOrder }) {
  const mutation = useApiMutation(
    (status: SandboxOutcome) => merchantApi.simulateSandboxInvoice(order.invoiceCode, status),
    { successMessage: 'Simulasi dijalankan', invalidate: [['sandbox-invoices'], ['sandbox-deliveries']] }
  );

  if (!ACTIVE.includes(order.paymentStatus)) return <span className="text-xs text-muted-foreground">Selesai</span>;

  const buttons: [SandboxOutcome, string][] = [
    ['paid', 'Berhasil'],
    ['failed', 'Gagal'],
    ['expired', 'Kedaluwarsa'],
  ];

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {buttons.map(([status, label]) => (
        <Button
          key={status}
          size="xs"
          variant={status === 'paid' ? 'default' : 'outline'}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(status)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function InvoicesPanel() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['sandbox-invoices', { page, status }],
    queryFn: () => merchantApi.getSandboxInvoices({ page, status }),
    placeholderData: keepPreviousData,
  });
  const orders = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusTabs
          tabs={STATUS_TABS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <div className="flex gap-2">
          <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
          <CreateSandboxInvoiceDialog />
        </div>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Simulasikan hasil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              colSpan={5}
              isLoading={isLoading}
              error={error}
              isEmpty={!orders.length}
              emptyText='Belum ada invoice uji coba. Klik "Buat Invoice Uji Coba" atau buat lewat API dengan key sandbox.'
            />
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-mono text-xs">{o.invoiceCode}</p>
                  <p className="text-xs text-muted-foreground">{o.productName}</p>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.paymentStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <SimulateButtons order={o} />
                    <Link
                      href={`/pay/sandbox/${o.invoiceCode}`}
                      target="_blank"
                      className={buttonVariants({ variant: 'ghost', size: 'icon-xs' })}
                      aria-label="Buka halaman bayar sandbox"
                      title="Buka halaman bayar"
                    >
                      <ExternalLink />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

function prettyJson(raw: string | null) {
  if (!raw) return '-';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function DeliveryItem({ delivery }: { delivery: WebhookDelivery }) {
  const resend = useApiMutation(() => merchantApi.resendSandboxDelivery(delivery.id), {
    successMessage: 'Webhook dikirim ulang',
    invalidate: [['sandbox-deliveries']],
  });
  const ok = delivery.status === 'SUCCESS';

  return (
    <details className="group px-4 py-3 sm:px-5">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
        <ToneBadge tone={ok ? 'success' : delivery.status === 'PENDING' ? 'warning' : 'danger'}>
          {ok ? 'Terkirim' : delivery.status === 'PENDING' ? 'Menunggu' : 'Gagal'}
          {delivery.responseStatus ? ` · ${delivery.responseStatus}` : ''}
        </ToneBadge>
        <code className="font-mono text-xs">{delivery.event}</code>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={delivery.url}>
          {delivery.url}
        </span>
        <span className="text-xs whitespace-nowrap text-muted-foreground">{formatDate(delivery.createdAt)}</span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Payload yang dikirim</p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">{prettyJson(delivery.payload)}</pre>
        </div>
        {(delivery.responseBody || delivery.lastError) && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {ok ? 'Respons dari server Anda' : 'Error'}
            </p>
            <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs">
              {delivery.lastError && !ok ? delivery.lastError : prettyJson(delivery.responseBody)}
            </pre>
          </div>
        )}
        <Button size="sm" variant="outline" onClick={() => resend.mutate()} disabled={resend.isPending}>
          {resend.isPending ? <Loader2 className="animate-spin" /> : <RotateCw />} Kirim ulang
        </Button>
      </div>
    </details>
  );
}

function WebhooksPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['sandbox-deliveries', { page }],
    queryFn: () => merchantApi.getSandboxDeliveries({ page }),
    placeholderData: keepPreviousData,
  });
  const deliveries = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Riwayat webhook yang dikirim ke webhook <strong>sandbox</strong> Anda. Webhook live tidak ikut menerima event ini.
        </p>
        <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
      </div>

      <Card className="gap-0 divide-y py-0">
        {isLoading ? (
          <p className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Memuat data...
          </p>
        ) : error ? (
          <p className="p-10 text-center text-sm text-destructive">Gagal memuat data: {error.message}</p>
        ) : !deliveries.length ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Belum ada webhook sandbox yang terkirim. Tambahkan webhook sandbox di tab API Key & Webhook, lalu simulasikan pembayaran.
          </p>
        ) : (
          deliveries.map((d) => <DeliveryItem key={d.id} delivery={d} />)
        )}
      </Card>

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

export default function SandboxPage() {
  const [view, setView] = useState('setup');

  return (
    <>
      <PageHeader title="Sandbox" description="Uji integrasi Anda dengan aman sebelum memakai API yang sebenarnya." />

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
        <FlaskConical className="mt-0.5 size-4 shrink-0" />
        <p>
          <strong>Data uji coba.</strong> Semua yang ada di halaman ini terpisah dari transaksi dan saldo asli. Tidak ada uang yang
          berpindah, tidak bisa ditarik, dan data dihapus otomatis setelah 7 hari.
        </p>
      </div>

      <Card size="sm">
        <details className="group px-4" open>
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium [&::-webkit-details-marker]:hidden">
            Cara memakai sandbox
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ol className="space-y-2 pt-3 pb-1 text-sm text-muted-foreground">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </details>
      </Card>

      <StatusTabs tabs={VIEW_TABS} value={view} onChange={setView} />

      <div className={cn(view !== 'setup' && 'hidden')}>
        <SandboxIntegrationSection />
      </div>
      <div className={cn(view !== 'invoices' && 'hidden')}>
        <InvoicesPanel />
      </div>
      <div className={cn(view !== 'webhooks' && 'hidden')}>
        <WebhooksPanel />
      </div>
    </>
  );
}
