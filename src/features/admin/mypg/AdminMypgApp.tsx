'use client';

import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi, type MypgAppConfig } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { ToneBadge } from '@/components/shared/StatusBadge';

const code = (label: string) => z.number({ error: 'Wajib diisi' }).int('Bilangan bulat').min(0, `${label} minimal 0`).max(1_000_000);

const schema = z
  .object({
    latestVersionCode: code('Kode versi'),
    latestVersionName: z.string().trim().max(30, 'Maksimal 30 karakter'),
    minVersionCode: code('Kode versi minimum'),
    downloadUrl: z.union([z.literal(''), z.url('URL tidak valid').refine((v) => v.startsWith('https://'), 'Harus diawali https://')]),
    changelog: z.string().max(2000, 'Maksimal 2000 karakter'),
    announcement: z.string().max(1000, 'Maksimal 1000 karakter'),
    announcementTone: z.enum(['info', 'warning', 'success']),
  })
  .superRefine((v, ctx) => {
    if (v.minVersionCode > v.latestVersionCode) {
      ctx.addIssue({ code: 'custom', path: ['minVersionCode'], message: 'Tidak boleh lebih besar dari kode versi terbaru' });
    }
    if ((v.latestVersionCode > 0 || v.minVersionCode > 0) && !v.downloadUrl) {
      ctx.addIssue({ code: 'custom', path: ['downloadUrl'], message: 'Isi link unduh agar merchant bisa memperbarui' });
    }
  });
type FormValues = z.infer<typeof schema>;

const TONE_OPTIONS = [
  { value: 'info', label: 'Info (biru)' },
  { value: 'warning', label: 'Peringatan (kuning)' },
  { value: 'success', label: 'Kabar baik (hijau)' },
];

function ConfigForm({ config, versions }: { config: MypgAppConfig; versions: { code: number; name: string | null; devices: number }[] }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: config });
  const { errors, isDirty } = form.formState;
  const [latest, min] = useWatch({ control: form.control, name: ['latestVersionCode', 'minVersionCode'] });
  const mutation = useApiMutation((data: FormValues) => adminApi.updateMypgAppConfig(data), {
    invalidate: [['admin-mypg-app-config']],
    onSuccess: (res) => form.reset(res.data),
  });

  // Perkiraan dampak pengaturan terhadap HP yang terpasang
  const impact = (c: number) => (min > 0 && c < min ? 'required' : latest > 0 && c < latest ? 'optional' : 'none');
  const totalDevices = versions.reduce((s, v) => s + v.devices, 0);

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Versi & Update</CardTitle>
          <CardDescription>
            Kode versi adalah angka build Android (versionCode), mis. 2.0.0 = 20. App dengan kode di bawah &ldquo;versi minimum&rdquo; wajib
            update dan tampilannya terkunci; di bawah &ldquo;versi terbaru&rdquo; mendapat tawaran update yang bisa dilewati. Isi 0 untuk mematikan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Kode Versi Terbaru" htmlFor="latest-code" error={errors.latestVersionCode?.message} hint="Update opsional">
            <Input id="latest-code" type="number" min={0} {...form.register('latestVersionCode', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Nama Versi Terbaru" htmlFor="latest-name" error={errors.latestVersionName?.message} hint="Ditampilkan ke merchant, mis. 2.0.1">
            <Input id="latest-name" placeholder="2.0.1" {...form.register('latestVersionName')} />
          </FormField>
          <FormField label="Kode Versi Minimum" htmlFor="min-code" error={errors.minVersionCode?.message} hint="Update wajib">
            <Input id="min-code" type="number" min={0} {...form.register('minVersionCode', { valueAsNumber: true })} />
          </FormField>
          <div className="md:col-span-3">
            <FormField
              label="Link Unduh APK"
              htmlFor="download-url"
              error={errors.downloadUrl?.message}
              hint="Link https langsung ke file APK, mis. GitHub Release atau Google Drive. Dipakai juga oleh tombol Unduh di Panel MyPG."
            >
              <Input id="download-url" type="url" placeholder="https://github.com/.../autoko-mypg-2.0.1.apk" {...form.register('downloadUrl')} />
            </FormField>
          </div>
          <div className="md:col-span-3">
            <FormField label="Catatan Perubahan" htmlFor="changelog" error={errors.changelog?.message} hint="Ditampilkan di dialog update.">
              <Textarea id="changelog" rows={4} placeholder={'- Perbaikan koneksi\n- Tampilan baru'} {...form.register('changelog')} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengumuman di Aplikasi</CardTitle>
          <CardDescription>Tampil di beranda aplikasi semua merchant MyPG. Kosongkan untuk menyembunyikan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_14rem]">
          <FormField label="Isi Pengumuman" htmlFor="announcement" error={errors.announcement?.message}>
            <Textarea id="announcement" rows={3} {...form.register('announcement')} />
          </FormField>
          <FormField label="Warna" htmlFor="announcement-tone">
            <Controller
              control={form.control}
              name="announcementTone"
              render={({ field }) => (
                <SimpleSelect id="announcement-tone" value={field.value} onValueChange={(v) => field.onChange(v || 'info')} options={TONE_OPTIONS} />
              )}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versi Terpasang di HP Merchant</CardTitle>
          <CardDescription>{totalDevices ? `${totalDevices} HP aktif melaporkan versinya.` : 'Belum ada HP yang memakai aplikasi Autoko MyPG.'}</CardDescription>
        </CardHeader>
        {versions.length > 0 && (
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {versions.map((v) => {
                const status = impact(v.code);
                return (
                  <li key={`${v.code}-${v.name}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="flex-1 font-medium">
                      v{v.name ?? '?'} <span className="text-xs text-muted-foreground">(kode {v.code})</span>
                    </span>
                    <span className="text-muted-foreground">{v.devices} HP</span>
                    <ToneBadge tone={status === 'required' ? 'danger' : status === 'optional' ? 'warning' : 'success'}>
                      {status === 'required' ? 'Wajib update' : status === 'optional' ? 'Update tersedia' : 'Terbaru'}
                    </ToneBadge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        )}
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <p className="mr-auto text-xs text-muted-foreground">{isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}</p>
        <Button type="button" variant="outline" disabled={!isDirty || mutation.isPending} onClick={() => form.reset()}>
          Batal
        </Button>
        <Button type="submit" disabled={!isDirty || mutation.isPending}>
          {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminMypgApp() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-mypg-app-config'], queryFn: adminApi.getMypgAppConfig, select: (res) => res.data });
  return (
    <>
      <PageHeader title="Aplikasi MyPG" description="Atur versi, pemberitahuan update, dan pengumuman di aplikasi Android Autoko MyPG." />
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-destructive">Gagal memuat: {error?.message}</p>
      ) : (
        <ConfigForm config={data.config} versions={data.versions} />
      )}
    </>
  );
}
