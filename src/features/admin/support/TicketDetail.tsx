'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CircleDot, Clock, Lock } from 'lucide-react';
import { adminSupportApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReplyForm } from '@/features/support/ReplyForm';
import { TicketDetailState, TicketInfoCard, TicketLayout, baseInfoRows } from '@/features/support/TicketLayout';
import type { SupportTicket, TicketStatus } from '@/types';

const STATUS_ACTIONS: { value: TicketStatus; label: string; icon: React.ElementType }[] = [
  { value: 'OPEN', label: 'Terbuka', icon: CircleDot },
  { value: 'IN_PROGRESS', label: 'Dalam Proses', icon: Clock },
  { value: 'RESOLVED', label: 'Selesai', icon: CheckCircle2 },
  { value: 'CLOSED', label: 'Ditutup', icon: Lock },
];

const invalidateKeys = (id: number) => [['admin-ticket', id], ['admin-tickets'], ['admin-support-open-count']];

/** Status langsung diterapkan saat dipilih, tanpa tombol simpan terpisah. */
function StatusCard({ ticket }: { ticket: SupportTicket }) {
  const mutation = useApiMutation((s: TicketStatus) => adminSupportApi.updateStatus(ticket.id, s), {
    successMessage: 'Status tiket diperbarui',
    invalidate: invalidateKeys(ticket.id),
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Ubah Status</CardTitle>
        <CardDescription>Membalas tiket Terbuka otomatis mengubahnya ke Dalam Proses.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {STATUS_ACTIONS.map(({ value, label, icon: Icon }) => {
          const active = ticket.status === value;
          return (
            <Button
              key={value}
              type="button"
              variant={active ? 'default' : 'outline'}
              size="sm"
              aria-pressed={active}
              disabled={mutation.isPending}
              onClick={() => !active && mutation.mutate(value)}
              className={cn('justify-start', active && 'pointer-events-none')}
            >
              <Icon /> {label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function TicketDetail({ ticketId }: { ticketId: number }) {
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['admin-ticket', ticketId],
    queryFn: () => adminSupportApi.getTicket(ticketId),
    select: (res) => res.data,
  });

  if (isLoading || error || !ticket) {
    return <TicketDetailState backHref="/admin/support" isLoading={isLoading} error={error} />;
  }

  const merchantName = ticket.store?.user?.name || 'Merchant';
  const email = ticket.store?.user?.email;

  return (
    <TicketLayout
      ticket={ticket}
      backHref="/admin/support"
      viewer="ADMIN"
      merchantName={merchantName}
      composer={
        ticket.status === 'CLOSED' ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" /> Tiket ditutup. Buka kembali lewat Ubah Status untuk membalas.
          </p>
        ) : (
          <ReplyForm
            placeholder={`Balas ke ${merchantName}...`}
            onReply={(body) => adminSupportApi.reply(ticket.id, body)}
            invalidate={invalidateKeys(ticket.id)}
          />
        )
      }
      sidebar={
        <>
          <StatusCard ticket={ticket} />
          <TicketInfoCard
            rows={[
              ['Toko', ticket.store?.name || '-'],
              ['Merchant', merchantName],
              [
                'Email',
                email ? (
                  <a href={`mailto:${email}`} className="text-primary hover:underline" title={email}>
                    {email}
                  </a>
                ) : (
                  '-'
                ),
              ],
              ...baseInfoRows(ticket),
            ]}
          />
        </>
      }
    />
  );
}
