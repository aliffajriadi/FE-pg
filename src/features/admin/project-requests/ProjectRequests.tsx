'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type AdminProjectRequest } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { FormField } from '@/components/shared/FormField';

const KEY = ['admin-project-requests'];
const TABS = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
];

function RejectDialog({ request }: { request: AdminProjectRequest }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const mutation = useApiMutation((n: string) => adminApi.rejectProjectRequest(request.id, n), {
    successMessage: 'Pengajuan ditolak',
    invalidate: [KEY],
    onSuccess: () => {
      setOpen(false);
      setNote('');
    },
  });

  return (
    <>
      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
        Tolak
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak pengajuan &ldquo;{request.name}&rdquo;?</DialogTitle>
            <DialogDescription>Alasan penolakan akan terlihat oleh merchant.</DialogDescription>
          </DialogHeader>
          <FormField label="Alasan" htmlFor="reject-note">
            <Textarea id="reject-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={!note.trim() || mutation.isPending} onClick={() => mutation.mutate(note.trim())}>
              {mutation.isPending ? 'Memproses...' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ProjectRequests() {
  const [status, setStatus] = useState('PENDING');
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [...KEY, status],
    queryFn: () => adminApi.getProjectRequests(status),
    select: (res) => res.data,
  });
  const approve = useApiMutation((id: number) => adminApi.approveProjectRequest(id), {
    successMessage: 'Pengajuan disetujui, proyek dibuat',
    invalidate: [KEY, ['admin-integrations']],
  });

  return (
    <>
      <PageHeader title="Pengajuan Proyek" description="Merchant wajib mengajukan proyek baru beserta tujuannya.">
        <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
      </PageHeader>

      <StatusTabs tabs={TABS} value={status} onChange={setStatus} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">Tidak ada pengajuan.</p>
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r.id} className="space-y-2 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.name}</span>
                <StatusBadge status={r.status} />
                <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {r.store.name} · {r.store.user.name} ({r.store.user.email})
              </p>
              <p className="whitespace-pre-wrap">{r.purpose}</p>
              {r.adminNote && <p className="text-xs text-muted-foreground">Catatan: {r.adminNote}</p>}
              {r.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <ConfirmAction
                    title="Setujui pengajuan?"
                    description={`Proyek "${r.name}" akan dibuat untuk ${r.store.name}.`}
                    confirmLabel="Setujui"
                    onConfirm={() => approve.mutateAsync(r.id)}
                  >
                    Setujui
                  </ConfirmAction>
                  <RejectDialog request={r} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
