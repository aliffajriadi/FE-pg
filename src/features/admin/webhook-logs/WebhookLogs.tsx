'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type WebhookChangeLog, type WebhookLogAction } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { SimpleSelect } from '@/components/shared/SimpleSelect';

const ALL = 'ALL';

const ACTION_LABEL: Record<WebhookLogAction, string> = {
  CREATE: 'Dibuat',
  UPDATE: 'Diubah',
  DELETE: 'Dihapus',
  REGENERATE_SECRET: 'Secret diganti',
};
const ACTION_TONE: Record<WebhookLogAction, 'success' | 'warning' | 'danger' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  REGENERATE_SECRET: 'warning',
};
const FIELD_LABEL: Record<string, string> = { name: 'Nama', url: 'URL', isActive: 'Status' };

const ACTION_OPTIONS = [
  { value: ALL, label: 'Semua aksi' },
  ...(Object.keys(ACTION_LABEL) as WebhookLogAction[]).map((value) => ({ value, label: ACTION_LABEL[value] })),
];

function formatValue(field: string, value: string | boolean | null) {
  if (field === 'isActive') return value ? 'Aktif' : 'Dijeda';
  return value === null || value === '' ? '-' : String(value);
}

function Changes({ log }: { log: WebhookChangeLog }) {
  if (!log.changes) {
    return <span className="text-muted-foreground">{log.action === 'REGENERATE_SECRET' ? 'Secret baru dibuat' : '-'}</span>;
  }
  return (
    <ul className="space-y-1 text-xs">
      {Object.entries(log.changes).map(([field, { from, to }]) => (
        <li key={field} className="break-all">
          <span className="font-medium">{FIELD_LABEL[field] ?? field}:</span>{' '}
          {from !== null && <span className="text-muted-foreground line-through">{formatValue(field, from)}</span>}
          {from !== null && to !== null && ' → '}
          {to !== null && <span>{formatValue(field, to)}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function WebhookLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<string>(ALL);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-webhook-logs', { page, search, action }],
    queryFn: () =>
      adminApi.getWebhookLogs({ page, search, action: action === ALL ? undefined : (action as WebhookLogAction) }),
    placeholderData: keepPreviousData,
  });

  const logs = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Log Webhook Merchant"
        description="Riwayat perubahan webhook live oleh merchant: dibuat, diubah, dijeda, dihapus, atau secret diganti."
      >
        <SimpleSelect
          id="webhook-log-action"
          value={action}
          onValueChange={(v) => {
            setAction(v || ALL);
            setPage(1);
          }}
          options={ACTION_OPTIONS}
        />
        <SearchForm
          placeholder="Cari toko, webhook, atau pelaku..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </PageHeader>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Toko / Merchant</TableHead>
              <TableHead>Webhook</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Perubahan</TableHead>
              <TableHead>Pelaku</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!logs.length} emptyText="Belum ada perubahan webhook" />
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-sm">{formatDate(log.createdAt)}</TableCell>
                <TableCell>
                  <p className="font-medium">{log.store.name}</p>
                  <p className="text-xs text-muted-foreground">{log.store.user?.email}</p>
                </TableCell>
                <TableCell>{log.webhookName}</TableCell>
                <TableCell>
                  <ToneBadge tone={ACTION_TONE[log.action]}>{ACTION_LABEL[log.action]}</ToneBadge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <Changes log={log} />
                </TableCell>
                <TableCell>
                  <p className="text-sm">{log.actorName ?? '-'}</p>
                  {log.ipAddress && <p className="text-xs text-muted-foreground">{log.ipAddress}</p>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}
