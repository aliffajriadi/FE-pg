import Link from 'next/link';
import { ChevronRight, Inbox, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import type { SupportTicket } from '@/types';
import { awaitsReplyFrom, isTicketFinished, relativeTime, sideOf, type Viewer } from './utils';

const STATUS_DOT: Record<string, string> = {
  OPEN: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-muted-foreground/40',
};

function TicketRow({ ticket, href, viewer }: { ticket: SupportTicket; href: string; viewer: Viewer }) {
  const last = ticket.messages?.at(-1);
  const needsReply = awaitsReplyFrom(ticket, viewer);
  const showPriority = ticket.priority === 'HIGH' || ticket.priority === 'URGENT';

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:px-5',
        isTicketFinished(ticket) && 'opacity-70',
      )}
    >
      <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', STATUS_DOT[ticket.status] ?? 'bg-muted-foreground/40')} aria-hidden />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <p className={cn('truncate', needsReply ? 'font-semibold' : 'font-medium')}>{ticket.subject}</p>
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground" title={ticket.updatedAt}>
            {relativeTime(ticket.updatedAt)}
          </span>
        </div>

        <p className="truncate text-sm text-muted-foreground">
          <span className="text-muted-foreground/70">#{ticket.id}</span>
          {viewer === 'ADMIN' && ticket.store && (
            <>
              {' · '}
              <span className="text-foreground/80">{ticket.store.name}</span>
            </>
          )}
          {last && (
            <>
              {' · '}
              {sideOf(last.senderRole) === viewer ? (viewer === 'ADMIN' ? 'Support: ' : 'Anda: ') : ''}
              {last.message}
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <StatusBadge status={ticket.status} />
          {showPriority && <StatusBadge status={ticket.priority} />}
          {needsReply && <ToneBadge tone="info">{viewer === 'ADMIN' ? 'Perlu dibalas' : 'Balasan baru'}</ToneBadge>}
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" /> {ticket._count?.messages ?? 0}
          </span>
        </div>
      </div>

      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Daftar tiket bergaya inbox: satu baris per tiket, seluruh baris bisa diklik. */
export function TicketList({
  tickets,
  viewer,
  hrefFor,
  isLoading,
  error,
  empty,
}: {
  tickets: SupportTicket[];
  viewer: Viewer;
  hrefFor: (ticket: SupportTicket) => string;
  isLoading: boolean;
  error?: Error | null;
  empty: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <Card className="gap-0 divide-y py-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3 px-5 py-4">
            <Skeleton className="mt-1 size-2.5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </Card>
    );
  }

  if (error) {
    return <Card className="items-center py-10 text-sm text-destructive">Gagal memuat tiket: {error.message}</Card>;
  }

  if (!tickets.length) {
    return (
      <Card className="items-center gap-3 py-12 text-center text-sm text-muted-foreground">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-5" />
        </span>
        {empty}
      </Card>
    );
  }

  return (
    <Card className="gap-0 divide-y py-0">
      {tickets.map((t) => (
        <TicketRow key={t.id} ticket={t} href={hrefFor(t)} viewer={viewer} />
      ))}
    </Card>
  );
}
