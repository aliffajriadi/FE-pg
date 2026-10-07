'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { adminSupportApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn, formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TicketThread } from '@/features/support/TicketThread';
import { ReplyForm } from '@/features/support/ReplyForm';
import type { SupportTicket, TicketStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Dalam Proses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Ditutup' },
];

const invalidateKeys = (id: number) => [['admin-ticket', id], ['admin-tickets'], ['admin-support-open-count']];

function StatusControl({ ticket }: { ticket: SupportTicket }) {
  const [status, setStatus] = useState<string>(ticket.status);
  const mutation = useApiMutation((s: TicketStatus) => adminSupportApi.updateStatus(ticket.id, s), {
    successMessage: 'Status tiket diperbarui',
    invalidate: invalidateKeys(ticket.id),
  });

  return (
    <div className="flex gap-2">
      <SimpleSelect value={status} onValueChange={setStatus} options={STATUS_OPTIONS} className="w-40" />
      <Button
        onClick={() => mutation.mutate(status as TicketStatus)}
        disabled={mutation.isPending || status === ticket.status}
      >
        Ubah Status
      </Button>
    </div>
  );
}

export default function TicketDetail({ ticketId }: { ticketId: number }) {
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['admin-ticket', ticketId],
    queryFn: () => adminSupportApi.getTicket(ticketId),
    select: (res) => res.data,
  });

  const backLink = (
    <Link href="/admin/support" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
      <ArrowLeft /> Kembali ke Daftar
    </Link>
  );

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat tiket...
      </p>
    );
  }

  if (error || !ticket) {
    return (
      <>
        {backLink}
        <p className="text-destructive">Gagal memuat tiket: {error?.message}</p>
      </>
    );
  }

  const merchantName = ticket.store?.user?.name || 'Merchant';

  return (
    <>
      {backLink}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
            <span className="text-xs text-muted-foreground">Tiket #{ticket.id}</span>
          </div>
        </div>
        {/* key: reset pilihan saat status tiket berubah dari server */}
        <StatusControl key={ticket.status} ticket={ticket} />
      </div>

      <Card size="sm">
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
          {[
            ['Toko', ticket.store?.name || '-'],
            ['Merchant', merchantName],
            ['Email', ticket.store?.user?.email || '-'],
            ['Dibuat', formatDate(ticket.createdAt)],
            ['Terakhir Diperbarui', formatDate(ticket.updatedAt)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="truncate font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <TicketThread messages={ticket.messages ?? []} merchantName={merchantName} />

      {ticket.status === 'CLOSED' ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <Lock className="size-4" /> Tiket ini sudah ditutup.
        </p>
      ) : (
        <ReplyForm
          title="Balas sebagai Admin"
          placeholder="Tulis balasan untuk merchant..."
          onReply={(body) => adminSupportApi.reply(ticket.id, body)}
          invalidate={invalidateKeys(ticket.id)}
        />
      )}
    </>
  );
}
