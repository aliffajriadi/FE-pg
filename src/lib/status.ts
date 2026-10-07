type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS: Record<string, { label: string; tone: Tone }> = {
  // Pembayaran
  PAID: { label: 'Dibayar', tone: 'success' },
  PENDING: { label: 'Pending', tone: 'warning' },
  WAITING_PAYMENT: { label: 'Menunggu', tone: 'warning' },
  EXPIRED: { label: 'Kedaluwarsa', tone: 'danger' },
  FAILED: { label: 'Gagal', tone: 'danger' },
  CANCELLED: { label: 'Dibatalkan', tone: 'danger' },
  REFUNDED: { label: 'Dikembalikan', tone: 'info' },
  // Toko / rekening / penarikan
  APPROVED: { label: 'Disetujui', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'danger' },
  // Tiket
  OPEN: { label: 'Terbuka', tone: 'info' },
  IN_PROGRESS: { label: 'Dalam Proses', tone: 'warning' },
  RESOLVED: { label: 'Selesai', tone: 'success' },
  CLOSED: { label: 'Ditutup', tone: 'neutral' },
  // Prioritas tiket
  LOW: { label: 'Rendah', tone: 'neutral' },
  NORMAL: { label: 'Normal', tone: 'info' },
  HIGH: { label: 'Tinggi', tone: 'warning' },
  URGENT: { label: 'Mendesak', tone: 'danger' },
};

export const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-700 dark:text-red-400',
  info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  neutral: 'bg-muted text-muted-foreground',
};

export function getStatus(status: string) {
  return STATUS[status] ?? { label: status, tone: 'neutral' as Tone };
}

export function statusLabel(status: string) {
  return getStatus(status).label;
}
