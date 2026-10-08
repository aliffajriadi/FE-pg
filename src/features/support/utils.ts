import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import type { SupportTicket, UserRole } from '@/types';

export type Viewer = Extract<UserRole, 'ADMIN' | 'MERCHANT'>;

export const TICKET_STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Dalam Proses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Ditutup' },
];

export function isTicketFinished(ticket: Pick<SupportTicket, 'status'>) {
  return ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
}

/** Tiket aktif yang pesan terakhirnya dari pihak lain, artinya giliran viewer membalas. */
export function awaitsReplyFrom(ticket: SupportTicket, viewer: Viewer) {
  // Daftar hanya memuat pesan terakhir; detail memuat semua pesan urut naik. Keduanya: elemen terakhir.
  const last = ticket.messages?.at(-1);
  return !!last && !isTicketFinished(ticket) && last.senderRole !== viewer;
}

export function relativeTime(date: string) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true, locale: id });
}

export function dayLabel(date: string) {
  const d = new Date(date);
  if (isToday(d)) return 'Hari ini';
  if (isYesterday(d)) return 'Kemarin';
  return format(d, 'EEEE, d MMMM yyyy', { locale: id });
}

export function timeLabel(date: string) {
  return format(new Date(date), 'HH:mm', { locale: id });
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?'
  );
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
