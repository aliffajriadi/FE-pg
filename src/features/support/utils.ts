import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import type { SupportTicket, UserRole } from '@/types';

/** Sisi percakapan: ADMIN = tim support (super admin & sub admin), MERCHANT = merchant. */
export type Viewer = Extract<UserRole, 'ADMIN' | 'MERCHANT'>;

export const sideOf = (role: UserRole): Viewer => (role === 'MERCHANT' ? 'MERCHANT' : 'ADMIN');

export const TICKET_STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Dalam Proses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Ditutup' },
];

// Lampiran gambar tiket: satu per pesan, maks 1MB, maks 3 gambar per tiket untuk tiap pihak (merchant / tim support)
export const MAX_TICKET_IMAGES = 3;
export const MAX_TICKET_IMAGE_MB = 1;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const isTicketImage = (url: string | null | undefined) => !!url?.startsWith('/uploads/support/');

/** Pesan error bila gambar tidak boleh dikirim, null bila valid. */
export function validateTicketImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Hanya gambar JPG, PNG, WEBP, atau GIF';
  if (file.size > MAX_TICKET_IMAGE_MB * 1024 * 1024) return `Ukuran gambar maksimal ${MAX_TICKET_IMAGE_MB}MB`;
  return null;
}

/** Sisa jatah gambar viewer di tiket ini. */
export function imagesLeft(ticket: Pick<SupportTicket, 'messages'>, viewer: Viewer) {
  const used = (ticket.messages ?? []).filter((m) => sideOf(m.senderRole) === viewer && isTicketImage(m.attachmentUrl)).length;
  return Math.max(0, MAX_TICKET_IMAGES - used);
}

export function isTicketFinished(ticket: Pick<SupportTicket, 'status'>) {
  return ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
}

/** Tiket aktif yang pesan terakhirnya dari pihak lain, artinya giliran viewer membalas. */
export function awaitsReplyFrom(ticket: SupportTicket, viewer: Viewer) {
  // Daftar hanya memuat pesan terakhir; detail memuat semua pesan urut naik. Keduanya: elemen terakhir.
  const last = ticket.messages?.at(-1);
  return !!last && !isTicketFinished(ticket) && sideOf(last.senderRole) !== viewer;
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
