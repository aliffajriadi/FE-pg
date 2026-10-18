'use client';

import { Fragment, useEffect, useRef } from 'react';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupportMessage } from '@/types';
import { dayLabel, hostOf, initials, sideOf, timeLabel, type Viewer } from './utils';

function Avatar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        isAdmin ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
      )}
      aria-hidden
    >
      {isAdmin ? 'AS' : initials(name)}
    </span>
  );
}

/**
 * Percakapan tiket bergaya chat. Pesan milik viewer di kanan, lawan bicara di kiri.
 * Pesan berurutan dari pengirim yang sama di hari yang sama digabung tanpa mengulang nama/avatar.
 */
export function TicketThread({
  messages,
  viewer,
  merchantName,
  currentUserId,
  className,
}: {
  messages: SupportMessage[];
  viewer: Viewer;
  merchantName: string;
  /** Tim support: hanya pesan akun ini yang berlabel "Anda", balasan rekan tampil dengan namanya. */
  currentUserId?: number;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mulai dari pesan terbaru, dan ikut turun saat ada balasan baru
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={scrollRef} className={cn('space-y-1 overflow-y-auto', className)}>
      {messages.map((msg, i) => {
        const prev = messages[i - 1];
        const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(msg.createdAt);
        const grouped = !newDay && prev?.senderRole === msg.senderRole && prev?.senderId === msg.senderId;
        const isAdmin = sideOf(msg.senderRole) === 'ADMIN';
        const isOwn = sideOf(msg.senderRole) === viewer;
        const name = !isAdmin
          ? merchantName
          : viewer === 'ADMIN' && msg.senderName
            ? `${msg.senderName}${msg.senderRole === 'SUBADMIN' ? ' (Sub Admin)' : ''}`
            : 'Admin Support';
        const label = isOwn && (viewer === 'MERCHANT' || currentUserId === undefined || msg.senderId === currentUserId) ? 'Anda' : name;

        return (
          <Fragment key={msg.id}>
            {newDay && (
              <div className="flex items-center gap-3 py-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {dayLabel(msg.createdAt)}
                <span className="h-px flex-1 bg-border" />
              </div>
            )}

            <div className={cn('flex gap-2.5', isOwn && 'flex-row-reverse', !grouped && 'pt-2')}>
              {grouped ? <span className="w-8 shrink-0" /> : <Avatar name={name} isAdmin={isAdmin} />}

              <div className={cn('flex max-w-[85%] min-w-0 flex-col gap-1 sm:max-w-[75%]', isOwn && 'items-end')}>
                {!grouped && <span className="px-1 text-xs font-medium text-muted-foreground">{label}</span>}
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2.5 text-sm',
                    isOwn ? 'rounded-tr-md bg-primary text-primary-foreground' : 'rounded-tl-md bg-muted',
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={msg.attachmentUrl}
                      className={cn(
                        'mt-2 flex max-w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                        isOwn ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25' : 'bg-background hover:bg-background/70',
                      )}
                    >
                      <Link2 className="size-3.5 shrink-0" />
                      <span className="truncate">{hostOf(msg.attachmentUrl)}</span>
                    </a>
                  )}
                </div>
                <span className="px-1 text-[11px] text-muted-foreground">{timeLabel(msg.createdAt)}</span>
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
