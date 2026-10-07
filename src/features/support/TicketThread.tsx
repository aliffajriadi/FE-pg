import { Link2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { SupportMessage } from '@/types';

/** Daftar pesan tiket. Pesan dari admin ditampilkan di sisi kanan. */
export function TicketThread({ messages, merchantName }: { messages: SupportMessage[]; merchantName: string }) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isAdmin = msg.senderRole === 'ADMIN';
        return (
          <div
            key={msg.id}
            className={cn('max-w-3xl rounded-xl border p-4', isAdmin ? 'ml-auto border-primary/30 bg-primary/5' : 'bg-card')}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{isAdmin ? 'Admin Support' : merchantName}</span>
                <span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Merchant'}</span>
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            {msg.attachmentUrl && (
              <a
                href={msg.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1 text-xs break-all text-primary underline"
              >
                <Link2 className="size-3 shrink-0" /> {msg.attachmentUrl}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
