import { z } from 'zod';
import type { ExternalApp, ExternalAppInput } from '@/lib/api/admin';

export const EXTERNAL_APPS_KEY = ['admin-external-apps'];

const version = z.string().trim().regex(/^(v?\d{1,5}(\.\d{1,5}){0,3})?$/i, 'Format angka bertitik, mis. 1.3.4');

/** Bandingkan versi titik per segmen secara numerik (sama dengan server). Negatif: a < b. */
export const compareVersions = (a: string, b: string) => {
  const x = (a || '0').split('.').map(Number);
  const y = (b || '0').split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
};

export const schema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').max(80, 'Maksimal 80 karakter'),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, '3 - 40 karakter: huruf kecil, angka, tanda hubung'),
    packageName: z.string().trim().max(150).regex(/^([A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+)?$/, 'Contoh: com.contoh.aplikasi'),
    isActive: z.boolean(),
    latestVersion: version,
    minVersion: version,
    downloadUrl: z.union([z.literal(''), z.url('URL tidak valid').refine((v) => v.startsWith('https://'), 'Harus diawali https://')]),
    changelog: z.string().max(2000, 'Maksimal 2000 karakter'),
    announcement: z.string().max(1000, 'Maksimal 1000 karakter'),
    announcementTone: z.enum(['info', 'warning', 'success']),
    announcementStartsAt: z.string(),
    announcementEndsAt: z.string(),
  })
  .superRefine((v, ctx) => {
    if (compareVersions(v.minVersion.replace(/^v/i, ''), v.latestVersion.replace(/^v/i, '')) > 0) {
      ctx.addIssue({ code: 'custom', path: ['minVersion'], message: 'Tidak boleh lebih besar dari versi terbaru' });
    }
    if ((v.latestVersion || v.minVersion) && !v.downloadUrl) {
      ctx.addIssue({ code: 'custom', path: ['downloadUrl'], message: 'Isi link unduh agar pengguna bisa memperbarui' });
    }
    if (v.announcementStartsAt && v.announcementEndsAt && v.announcementEndsAt <= v.announcementStartsAt) {
      ctx.addIssue({ code: 'custom', path: ['announcementEndsAt'], message: 'Harus setelah mulai tayang' });
    }
  });
export type FormValues = z.infer<typeof schema>;

// <input type="datetime-local"> memakai waktu lokal tanpa zona; server menyimpan ISO (UTC)
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export const EMPTY_VALUES: FormValues = {
  name: '',
  slug: '',
  packageName: '',
  isActive: true,
  latestVersion: '',
  minVersion: '',
  downloadUrl: '',
  changelog: '',
  announcement: '',
  announcementTone: 'info',
  announcementStartsAt: '',
  announcementEndsAt: '',
};

export const toFormValues = (app: ExternalApp): FormValues => ({
  name: app.name,
  slug: app.slug,
  packageName: app.packageName ?? '',
  isActive: app.isActive,
  latestVersion: app.latestVersion,
  minVersion: app.minVersion,
  downloadUrl: app.downloadUrl,
  changelog: app.changelog,
  announcement: app.announcement,
  announcementTone: app.announcementTone,
  announcementStartsAt: toLocalInput(app.announcementStartsAt),
  announcementEndsAt: toLocalInput(app.announcementEndsAt),
});

export const toPayload = (v: FormValues): ExternalAppInput => ({
  ...v,
  packageName: v.packageName || null,
  announcementStartsAt: fromLocalInput(v.announcementStartsAt),
  announcementEndsAt: fromLocalInput(v.announcementEndsAt),
});
