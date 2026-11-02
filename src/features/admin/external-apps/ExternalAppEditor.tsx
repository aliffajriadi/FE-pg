'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { API_URL } from '@/lib/api/client';
import { adminApi, type ExternalApp, type ExternalAppStats } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { CopyField } from '@/components/shared/CopyField';
import { compareVersions, EMPTY_VALUES, EXTERNAL_APPS_KEY, schema, toFormValues, toPayload, type FormValues } from './shared';

const TONE_OPTIONS = [
  { value: 'info', label: 'Info (biru)' },
  { value: 'warning', label: 'Peringatan (kuning)' },
  { value: 'success', label: 'Kabar baik (hijau)' },
];

const TONE_STYLE = {
  info: { box: 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200', icon: Info },
  warning: { box: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200', icon: AlertTriangle },
  success: { box: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200', icon: CheckCircle2 },
} as const;

function BackLink() {
  return (
    <Link href="/admin/external-apps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Aplikasi Eksternal
    </Link>
  );
}

function VersionStats({ stats, latest, min }: { stats: ExternalAppStats | undefined; latest: string; min: string }) {
  const status = (v: string) => (min && compareVersions(v, min) < 0 ? 'required' : latest && compareVersions(v, latest) < 0 ? 'optional' : 'none');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Versi yang Mengecek</CardTitle>
        <CardDescription>{stats ? `${stats.total.toLocaleString('id-ID')} pengecekan dalam ${stats.days} hari terakhir.` : 'Memuat...'}</CardDescription>
      </CardHeader>
      {stats && (
        <CardContent>
          {stats.versions.length ? (
            <ul className="divide-y rounded-lg border">
              {stats.versions.map((v) => {
                const s = status(v.version);
                return (
                  <li key={v.version} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="flex-1 font-medium">Versi {v.version}</span>
                    <span className="text-xs text-muted-foreground">{v.checks.toLocaleString('id-ID')}x</span>
                    <ToneBadge tone={s === 'required' ? 'danger' : s === 'optional' ? 'warning' : 'success'}>
                      {s === 'required' ? 'Wajib update' : s === 'optional' ? 'Update tersedia' : 'Terbaru'}
                    </ToneBadge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada aplikasi yang mengecek. Statistik terisi saat aplikasi memanggil alamat API di atas.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function EditorForm({ app, stats }: { app: ExternalApp | null; stats?: ExternalAppStats }) {
  const router = useRouter();
  const editing = !!app;
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: app ? toFormValues(app) : EMPTY_VALUES });
  const { errors, isDirty } = form.formState;
  const [slug, latest, min, announcement, tone] = useWatch({
    control: form.control,
    name: ['slug', 'latestVersion', 'minVersion', 'announcement', 'announcementTone'],
  });

  const save = useApiMutation(
    (data: FormValues) => (app ? adminApi.updateExternalApp(app.id, toPayload(data)) : adminApi.createExternalApp(toPayload(data))),
    {
      invalidate: [EXTERNAL_APPS_KEY],
      onSuccess: (res) => {
        if (app) form.reset(toFormValues(res.data));
        else router.replace(`/admin/external-apps/${res.data.id}`);
      },
    }
  );
  const remove = useApiMutation(adminApi.deleteExternalApp, {
    invalidate: [EXTERNAL_APPS_KEY],
    onSuccess: () => router.replace('/admin/external-apps'),
  });

  const checkUrl = `${API_URL}/apps/${slug || '<slug>'}/check?version=<versi aplikasi, mis. 1.3.4>`;
  const ToneIcon = TONE_STYLE[tone].icon;

  return (
    <form onSubmit={form.handleSubmit((data) => save.mutate(data))} className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Aplikasi</CardTitle>
              <CardDescription>Identitas aplikasi. Slug dipakai di alamat API yang dipanggil aplikasi.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nama Aplikasi" htmlFor="app-name" error={errors.name?.message}>
                <Input id="app-name" placeholder="Kasir Toko" {...form.register('name')} />
              </FormField>
              <FormField
                label="Slug"
                htmlFor="app-slug"
                error={errors.slug?.message}
                hint={editing ? 'Tidak bisa diubah agar alamat API tetap sama.' : 'Huruf kecil, angka, tanda hubung. Mis. kasir-toko.'}
              >
                <Input id="app-slug" placeholder="kasir-toko" disabled={editing} {...form.register('slug')} />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Package Name (opsional)" htmlFor="app-package" error={errors.packageName?.message} hint="Hanya sebagai catatan, mis. com.contoh.kasir.">
                  <Input id="app-package" placeholder="com.contoh.kasir" {...form.register('packageName')} />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Versi & Update</CardTitle>
              <CardDescription>
                Tulis versi seperti 1.3.4. Aplikasi dengan versi di bawah &ldquo;minimum&rdquo; wajib update, di bawah &ldquo;terbaru&rdquo; mendapat
                tawaran update yang bisa dilewati. Kosongkan untuk mematikan.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Versi Terbaru" htmlFor="app-latest" error={errors.latestVersion?.message} hint="Update opsional">
                <Input id="app-latest" placeholder="1.3.4" {...form.register('latestVersion')} />
              </FormField>
              <FormField label="Versi Minimum" htmlFor="app-min" error={errors.minVersion?.message} hint="Update wajib">
                <Input id="app-min" placeholder="1.2.0" {...form.register('minVersion')} />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Link Unduh APK" htmlFor="app-url" error={errors.downloadUrl?.message} hint="Link https langsung ke file APK, mis. GitHub Release atau Google Drive.">
                  <Input id="app-url" type="url" placeholder="https://github.com/.../kasir-1.2.0.apk" {...form.register('downloadUrl')} />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label="Catatan Perubahan" htmlFor="app-changelog" error={errors.changelog?.message} hint="Ditampilkan di dialog update.">
                  <Textarea id="app-changelog" rows={4} placeholder={'- Perbaikan bug\n- Tampilan baru'} {...form.register('changelog')} />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengumuman</CardTitle>
              <CardDescription>Kosongkan isi untuk menyembunyikan. Tanpa masa tayang, pengumuman langsung tampil tanpa batas akhir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
                <FormField label="Isi Pengumuman" htmlFor="app-announcement" error={errors.announcement?.message}>
                  <Textarea id="app-announcement" rows={3} {...form.register('announcement')} />
                </FormField>
                <FormField label="Warna" htmlFor="app-tone">
                  <Controller
                    control={form.control}
                    name="announcementTone"
                    render={({ field }) => <SimpleSelect id="app-tone" value={field.value} onValueChange={(v) => field.onChange(v || 'info')} options={TONE_OPTIONS} />}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Mulai Tayang (opsional)" htmlFor="app-starts" error={errors.announcementStartsAt?.message}>
                  <Input id="app-starts" type="datetime-local" {...form.register('announcementStartsAt')} />
                </FormField>
                <FormField label="Selesai Tayang (opsional)" htmlFor="app-ends" error={errors.announcementEndsAt?.message}>
                  <Input id="app-ends" type="datetime-local" {...form.register('announcementEndsAt')} />
                </FormField>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Aplikasi aktif</p>
                <p className="text-xs text-muted-foreground">Nonaktif = API menjawab 404.</p>
              </div>
              <Controller control={form.control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Aktifkan aplikasi" />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alamat API</CardTitle>
              <CardDescription>Dipanggil aplikasi tanpa login untuk cek versi dan pengumuman.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CopyField value={checkUrl} />
              <p className="text-xs text-muted-foreground">Balasan: status update (none / optional / required), link unduh, catatan perubahan, dan pengumuman yang sedang tayang.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pratinjau Pengumuman</CardTitle>
            </CardHeader>
            <CardContent>
              {announcement.trim() ? (
                <div className={cn('flex gap-2 rounded-lg border px-3 py-2 text-sm', TONE_STYLE[tone].box)}>
                  <ToneIcon className="mt-0.5 size-4 shrink-0" />
                  <p className="break-words whitespace-pre-wrap">{announcement}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
              )}
            </CardContent>
          </Card>

          {editing && <VersionStats stats={stats} latest={latest} min={min} />}

          {editing && app && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Hapus Aplikasi</CardTitle>
                <CardDescription>Aplikasi dan statistiknya dihapus. Aplikasi yang masih memanggil API ini akan menerima 404.</CardDescription>
              </CardHeader>
              <CardContent>
                <ConfirmAction
                  destructive
                  title={`Hapus ${app.name}?`}
                  description="Tindakan ini tidak bisa dibatalkan."
                  confirmLabel="Hapus"
                  onConfirm={() => remove.mutateAsync(app.id)}
                >
                  <Trash2 /> Hapus Aplikasi
                </ConfirmAction>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <p className="mr-auto text-xs text-muted-foreground">{isDirty ? 'Ada perubahan yang belum disimpan.' : editing ? 'Semua perubahan tersimpan.' : 'Isi data lalu simpan.'}</p>
        <Link href="/admin/external-apps" className={buttonVariants({ variant: 'outline' })}>
          Kembali
        </Link>
        {editing && (
          <Button type="button" variant="outline" disabled={!isDirty || save.isPending} onClick={() => form.reset()}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={(editing && !isDirty) || save.isPending}>
          {save.isPending ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Aplikasi'}
        </Button>
      </div>
    </form>
  );
}

export default function ExternalAppEditor({ appId }: { appId?: number }) {
  const editing = appId !== undefined;
  const { data, isLoading, error } = useQuery({
    queryKey: [...EXTERNAL_APPS_KEY, appId],
    queryFn: () => adminApi.getExternalApp(appId!),
    select: (res) => res.data,
    enabled: editing,
  });

  return (
    <>
      <div className="space-y-3">
        <BackLink />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{editing ? (data?.app.name ?? 'Edit Aplikasi') : 'Tambah Aplikasi Eksternal'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {editing ? 'Atur versi, update wajib, dan pengumuman aplikasi ini.' : 'Daftarkan aplikasi Android baru, lalu atur versi dan pengumumannya.'}
          </p>
        </div>
      </div>

      {!editing ? (
        <EditorForm app={null} />
      ) : isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error || !data ? (
        <Card>
          <CardContent className="text-destructive">Gagal memuat aplikasi: {error?.message ?? 'tidak ditemukan'}</CardContent>
        </Card>
      ) : (
        // key = updatedAt agar form diinisialisasi ulang dari data server terbaru
        <EditorForm key={data.app.updatedAt} app={data.app} stats={data.stats} />
      )}
    </>
  );
}
