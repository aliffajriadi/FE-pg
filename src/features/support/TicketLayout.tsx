import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { SupportTicket } from '@/types';
import { TicketThread } from './TicketThread';
import type { Viewer } from './utils';

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 w-fit text-muted-foreground')}>
      <ArrowLeft /> Semua tiket
    </Link>
  );
}

/** Kondisi loading / gagal untuk halaman detail tiket. Return null jika tiket siap. */
export function TicketDetailState({
  backHref,
  isLoading,
  error,
}: {
  backHref: string;
  isLoading: boolean;
  error?: Error | null;
}) {
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat tiket...
      </p>
    );
  }
  return (
    <>
      <BackLink href={backHref} />
      <p className="text-destructive">Gagal memuat tiket{error ? `: ${error.message}` : ''}</p>
    </>
  );
}

/** Kartu info di sidebar: daftar label-nilai. */
export function TicketInfoCard({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Detail Tiket</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{label}</dt>
              <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function baseInfoRows(ticket: SupportTicket): [string, React.ReactNode][] {
  return [
    ['Status', <StatusBadge key="s" status={ticket.status} />],
    ['Prioritas', <StatusBadge key="p" status={ticket.priority} />],
    ['Dibuat', formatDate(ticket.createdAt)],
    ['Diperbarui', formatDate(ticket.updatedAt)],
  ];
}

/**
 * Tata letak detail tiket: percakapan (dengan kotak balasan di bawahnya) di kiri,
 * sidebar info & aksi di kanan. Di layar sempit sidebar turun ke bawah.
 */
export function TicketLayout({
  ticket,
  backHref,
  viewer,
  merchantName,
  composer,
  sidebar,
}: {
  ticket: SupportTicket;
  backHref: string;
  viewer: Viewer;
  merchantName: string;
  composer: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <>
      <BackLink href={backHref} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="gap-0 py-0">
          <div className="space-y-2 border-b px-4 py-4 sm:px-5">
            <h1 className="text-lg leading-snug font-semibold break-words sm:text-xl">{ticket.subject}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <StatusBadge status={ticket.priority} />
              <span className="text-xs text-muted-foreground">
                Tiket #{ticket.id} · {ticket.messages?.length ?? 0} pesan
              </span>
            </div>
          </div>

          <TicketThread
            messages={ticket.messages ?? []}
            viewer={viewer}
            merchantName={merchantName}
            className="max-h-[60vh] min-h-48 px-4 pb-4 sm:px-5"
          />

          <div className="border-t bg-muted/30 px-4 py-3 sm:px-5">{composer}</div>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-6">{sidebar}</aside>
      </div>
    </>
  );
}
