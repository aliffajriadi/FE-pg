'use client';

import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { merchantSupportApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useMe } from '@/features/auth/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { ReplyForm } from '@/features/support/ReplyForm';
import { TicketDetailState, TicketInfoCard, TicketLayout, baseInfoRows } from '@/features/support/TicketLayout';
import { isTicketFinished } from '@/features/support/utils';

export default function MerchantTicketDetail({ ticketId }: { ticketId: number }) {
  const { data: me } = useMe();
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['merchant-ticket', ticketId],
    queryFn: () => merchantSupportApi.getTicket(ticketId),
    select: (res) => res.data,
  });

  const invalidate = [['merchant-ticket', ticketId], ['merchant-tickets']];
  const close = useApiMutation(() => merchantSupportApi.close(ticketId), { invalidate });

  if (isLoading || error || !ticket) {
    return <TicketDetailState backHref="/dashboard/support" isLoading={isLoading} error={error} />;
  }

  // Tiket Selesai/Ditutup tidak bisa dibalas lagi oleh merchant
  const finished = isTicketFinished(ticket);

  return (
    <TicketLayout
      ticket={ticket}
      backHref="/dashboard/support"
      viewer="MERCHANT"
      merchantName={me?.user.name ?? 'Anda'}
      composer={
        finished ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" /> Tiket ini sudah {ticket.status === 'RESOLVED' ? 'diselesaikan' : 'ditutup'}. Buat tiket
            baru jika masih ada kendala.
          </p>
        ) : (
          <ReplyForm
            placeholder="Tulis balasan atau informasi tambahan..."
            onReply={(body) => merchantSupportApi.reply(ticket.id, body)}
            invalidate={invalidate}
          />
        )
      }
      sidebar={
        <>
          <TicketInfoCard rows={[['Toko', ticket.store?.name || '-'], ...baseInfoRows(ticket)]} />
          {!finished && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Masalah sudah beres?</CardTitle>
                <CardDescription>Tutup tiket agar tim kami tahu. Tiket yang ditutup tidak bisa dibalas lagi.</CardDescription>
              </CardHeader>
              <CardContent>
                <ConfirmAction
                  destructive
                  title="Tutup tiket ini?"
                  description="Anda tidak bisa membalas tiket setelah ditutup."
                  confirmLabel="Tutup Tiket"
                  onConfirm={() => close.mutateAsync()}
                  className="w-full"
                >
                  Tutup Tiket
                </ConfirmAction>
              </CardContent>
            </Card>
          )}
        </>
      }
    />
  );
}
