'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { merchantSupportApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useMe } from '@/features/auth/hooks';
import { cn, formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { TicketThread } from '@/features/support/TicketThread';
import { ReplyForm } from '@/features/support/ReplyForm';

export default function MerchantTicketDetail({ ticketId }: { ticketId: number }) {
  const { data: me } = useMe();
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['merchant-ticket', ticketId],
    queryFn: () => merchantSupportApi.getTicket(ticketId),
    select: (res) => res.data,
  });

  const invalidate = [['merchant-ticket', ticketId], ['merchant-tickets']];
  const close = useApiMutation(() => merchantSupportApi.close(ticketId), { invalidate });

  const backLink = (
    <Link href="/dashboard/support" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
      <ArrowLeft /> Kembali
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

  // Sama seperti frontend lama: tiket Selesai/Ditutup tidak bisa dibalas lagi
  const isFinished = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return (
    <>
      {backLink}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
            <span className="text-xs text-muted-foreground">Tiket #{ticket.id}</span>
          </div>
        </div>
        {!isFinished && (
          <ConfirmAction
            destructive
            title="Tutup tiket ini?"
            description="Anda tidak bisa membalas tiket setelah ditutup."
            confirmLabel="Tutup Tiket"
            onConfirm={() => close.mutateAsync()}
          >
            Tutup Tiket
          </ConfirmAction>
        )}
      </div>

      <Card size="sm">
        <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
          {[
            ['Toko', ticket.store?.name || '-'],
            ['Dibuat', formatDate(ticket.createdAt)],
            ['Terakhir Diperbarui', formatDate(ticket.updatedAt)],
            ['Pesan', `${ticket.messages?.length ?? 0} balasan`],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="truncate font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <TicketThread messages={ticket.messages ?? []} merchantName={me?.user.name ?? 'Anda'} />

      {isFinished ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <Lock className="size-4" /> Tiket ini sudah {ticket.status === 'RESOLVED' ? 'diselesaikan' : 'ditutup'} dan tidak dapat
          dibalas lagi.
        </p>
      ) : (
        <ReplyForm
          title="Tambah Balasan"
          placeholder="Tulis balasan atau informasi tambahan..."
          onReply={(body) => merchantSupportApi.reply(ticket.id, body)}
          invalidate={invalidate}
        />
      )}
    </>
  );
}
