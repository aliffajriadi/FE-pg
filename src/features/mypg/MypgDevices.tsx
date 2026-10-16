'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, Download, Eye, EyeOff, Plus, QrCode, RotateCw, Smartphone, Trash2 } from 'lucide-react';
import { API_URL } from '@/lib/api/client';
import { MYPG_PROVIDER_LABEL, mypgApi, type MypgDevice, type MypgNotificationStatus, type MypgProvider, type MypgQris } from '@/lib/api/mypg';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { CopyButton } from '@/components/shared/CopyButton';
import { CopyField } from '@/components/shared/CopyField';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { Skeleton } from '@/components/ui/skeleton';

const NOTIFY_URL = `${API_URL}/mypg/notify`;

const PROVIDER_OPTIONS = (Object.keys(MYPG_PROVIDER_LABEL) as MypgProvider[]).map((value) => ({ value, label: MYPG_PROVIDER_LABEL[value] }));

// ─── QRIS ────────────────────────────────────────────────────
const qrisSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  provider: z.enum(['DANA', 'SHOPEEPAY', 'GOPAY']),
  qrisString: z.string().trim().min(20, 'Tempel string QRIS lengkap'),
});
type QrisForm = z.infer<typeof qrisSchema>;

function AddQrisDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<QrisForm>({ resolver: zodResolver(qrisSchema), defaultValues: { name: '', provider: 'DANA', qrisString: '' } });
  const { errors } = form.formState;
  const mutation = useApiMutation(mypgApi.createQris, {
    invalidate: [['mypg-qris'], ['mypg-summary']],
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          form.reset({ name: '', provider: 'DANA', qrisString: '' });
          setOpen(true);
        }}
      >
        <Plus /> Tambah QRIS
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah QRIS</DialogTitle>
            <DialogDescription>
              Tempel string QRIS statis dari aplikasi penerima. Cara mendapatkannya: pindai QR toko Anda dengan aplikasi pembaca QR,
              lalu salin teksnya (diawali 000201).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nama" htmlFor="qris-name" error={errors.name?.message}>
                <Input id="qris-name" placeholder="Contoh: DANA Toko Utama" {...form.register('name')} />
              </FormField>
              <FormField label="Aplikasi Penerima" htmlFor="qris-provider">
                <Controller
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <SimpleSelect id="qris-provider" value={field.value} onValueChange={(v) => field.onChange(v || 'DANA')} options={PROVIDER_OPTIONS} />
                  )}
                />
              </FormField>
            </div>
            <FormField
              label="String QRIS"
              htmlFor="qris-string"
              error={errors.qrisString?.message}
              hint="Notifikasi uang masuk dari aplikasi ini harus muncul di HP yang terpasang APK."
            >
              <Textarea id="qris-string" rows={4} className="font-mono text-xs" placeholder="00020101021126..." {...form.register('qrisString')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan QRIS'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QrisItem({ qris }: { qris: MypgQris }) {
  const options = { invalidate: [['mypg-qris'], ['mypg-summary']] };
  const activate = useApiMutation(() => mypgApi.activateQris(qris.id), options);
  const remove = useApiMutation(() => mypgApi.deleteQris(qris.id), options);
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${qris.isActive ? 'border-primary/40 bg-primary/5' : 'bg-background'}`}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <QrCode className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
          <span className="truncate">{qris.name}</span>
          {qris.isActive && <ToneBadge tone="success">Dipakai</ToneBadge>}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {MYPG_PROVIDER_LABEL[qris.provider]} · <code className="font-mono">…{qris.qrisString.slice(-8)}</code>
          <CopyButton value={qris.qrisString} label="Salin string QRIS" />
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!qris.isActive && (
          <Button size="xs" variant="outline" onClick={() => activate.mutate()} disabled={activate.isPending}>
            Pakai
          </Button>
        )}
        <ConfirmAction
          destructive
          variant="ghost"
          size="xs"
          className="text-destructive"
          title={`Hapus QRIS "${qris.name}"?`}
          description="Tidak bisa dihapus selama masih ada invoice menunggu pembayaran dengan QRIS ini."
          confirmLabel="Hapus"
          onConfirm={() => remove.mutateAsync()}
        >
          <Trash2 />
        </ConfirmAction>
      </div>
    </div>
  );
}

function QrisSection() {
  const { data, isLoading } = useQuery({ queryKey: ['mypg-qris'], queryFn: mypgApi.getQris, select: (res) => res.data });
  return (
    <Card>
      <CardHeader>
        <CardTitle>QRIS Saya</CardTitle>
        <CardDescription>Invoice baru memakai QRIS bertanda &ldquo;Dipakai&rdquo;.</CardDescription>
        <CardAction>
          <AddQrisDialog />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : data?.length ? (
          data.map((q) => <QrisItem key={q.id} qris={q} />)
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Belum ada QRIS. Tambahkan QRIS DANA Bisnis, ShopeePay, atau GoPay milik Anda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Perangkat ───────────────────────────────────────────────
function AddDeviceDialog() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<MypgDevice | null>(null);
  const form = useForm<{ name: string }>({ resolver: zodResolver(z.object({ name: z.string().trim().min(1, 'Nama wajib diisi') })) });
  const mutation = useApiMutation(mypgApi.createDevice, {
    invalidate: [['mypg-devices'], ['mypg-summary']],
    onSuccess: (res) => setCreated(res.data),
  });

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          form.reset({ name: '' });
          setCreated(null);
          setOpen(true);
        }}
      >
        <Plus /> Tambah HP
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{created ? 'HP terdaftar' : 'Daftarkan HP Penerima'}</DialogTitle>
            <DialogDescription>
              {created
                ? 'Masukkan dua nilai ini ke pengaturan APK pelacak notifikasi di HP tersebut.'
                : 'HP yang menerima notifikasi uang masuk dari DANA Bisnis, ShopeePay, atau GoPay.'}
            </DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="space-y-4">
              <FormField label="URL Server">
                <CopyField value={NOTIFY_URL} />
              </FormField>
              <FormField label="API Key Perangkat" hint="Rahasiakan. Siapa pun yang punya key ini bisa mengirim notifikasi atas nama toko Anda.">
                <CopyField value={created.token} />
              </FormField>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Selesai</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField label="Nama HP" htmlFor="device-name" error={form.formState.errors.name?.message}>
                <Input id="device-name" placeholder="Contoh: HP Kasir" {...form.register('name')} />
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Menyimpan...' : 'Daftarkan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeviceItem({ device }: { device: MypgDevice }) {
  const [show, setShow] = useState(false);
  const options = { invalidate: [['mypg-devices'], ['mypg-summary']] };
  const toggle = useApiMutation(() => mypgApi.updateDevice(device.id, { isActive: !device.isActive }), options);
  const regen = useApiMutation(() => mypgApi.regenerateDeviceToken(device.id), { ...options, successMessage: 'Token baru dibuat, perbarui di APK' });
  const remove = useApiMutation(() => mypgApi.deleteDevice(device.id), options);

  return (
    <div className="min-w-0 space-y-2 rounded-lg border bg-background p-3">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
            <span className="truncate">{device.name}</span>
            {!device.isActive ? (
              <ToneBadge tone="danger">Nonaktif</ToneBadge>
            ) : device.isOnline ? (
              <ToneBadge tone="success">Online</ToneBadge>
            ) : (
              <ToneBadge tone="warning">Offline</ToneBadge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {device.lastSeenAt ? `Terakhir aktif ${formatDate(device.lastSeenAt)}` : 'Belum pernah terhubung'}
            {device.appVersionName && ` · App v${device.appVersionName}`}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-1 text-xs">
        <span className="shrink-0 text-muted-foreground">API Key:</span>
        <code className={`min-w-0 flex-1 truncate font-mono ${show ? '' : 'blur-sm select-none'}`}>{device.token}</code>
        <Button variant="ghost" size="icon-xs" onClick={() => setShow((v) => !v)} aria-label={show ? 'Sembunyikan' : 'Tampilkan'}>
          {show ? <EyeOff /> : <Eye />}
        </Button>
        <CopyButton value={device.token} label="Salin API Key perangkat" />
      </div>
      <div className="flex flex-wrap gap-1.5 border-t pt-2">
        <Button size="xs" variant="outline" onClick={() => toggle.mutate()} disabled={toggle.isPending}>
          {device.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
        <ConfirmAction
          size="xs"
          title="Buat token baru?"
          description="Token lama langsung tidak berlaku. Masukkan token baru ke APK di HP ini."
          confirmLabel="Buat Token Baru"
          onConfirm={() => regen.mutateAsync()}
        >
          <RotateCw /> Token Baru
        </ConfirmAction>
        <ConfirmAction
          destructive
          variant="ghost"
          size="xs"
          className="ml-auto text-destructive"
          title={`Hapus "${device.name}"?`}
          description="Notifikasi dari HP ini tidak akan diproses lagi."
          confirmLabel="Hapus"
          onConfirm={() => remove.mutateAsync()}
        >
          <Trash2 /> Hapus
        </ConfirmAction>
      </div>
    </div>
  );
}

function DevicesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['mypg-devices'],
    queryFn: mypgApi.getDevices,
    select: (res) => res.data,
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>HP Penerima</CardTitle>
        <CardDescription>Online bila mengirim data dalam 15 menit terakhir.</CardDescription>
        <CardAction>
          <AddDeviceDialog />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : data?.length ? (
          data.map((d) => <DeviceItem key={d.id} device={d} />)
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Belum ada HP terdaftar.</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Panduan singkat menghubungkan HP. Terbuka otomatis selama belum ada HP yang online. */
function ConnectGuide() {
  const { data } = useQuery({ queryKey: ['mypg-devices'], queryFn: mypgApi.getDevices, select: (res) => res.data });
  const { data: appInfo } = useQuery({ queryKey: ['mypg-app-info'], queryFn: mypgApi.getAppInfo, select: (res) => res.data, staleTime: 5 * 60_000 });
  // Link dari admin (Aplikasi MyPG), fallback ke env lama
  const apkUrl = appInfo?.downloadUrl || process.env.NEXT_PUBLIC_MYPG_APK_URL;
  const anyOnline = !!data?.some((d) => d.isActive && d.isOnline);
  const steps = [
    'Unduh dan pasang aplikasi Autoko MyPG di HP yang menerima notifikasi DANA Bisnis / ShopeePay / GoPay.',
    'Login memakai email dan password akun Autoko Anda. HP otomatis terdaftar di bawah, tanpa perlu menyalin API key.',
    'Izinkan akses notifikasi dan biarkan aplikasi berjalan. Pembayaran yang masuk menandai invoice lunas otomatis.',
  ];

  return (
    <Card size="sm">
      <details className="group px-4" open={data ? !anyOnline : undefined}>
        <summary className="flex cursor-pointer list-none items-center gap-2 py-1 font-medium [&::-webkit-details-marker]:hidden">
          <Smartphone className="size-4 text-primary" />
          <span className="flex-1">Cara menghubungkan HP</span>
          {anyOnline && <ToneBadge tone="success">Terhubung</ToneBadge>}
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-4 pt-3 pb-1 md:grid-cols-[1fr_minmax(0,22rem)]">
          <ol className="space-y-2 text-sm text-muted-foreground">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-3">
            {apkUrl ? (
              <a href={apkUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ className: 'w-full' })}>
                <Download /> Unduh Autoko MyPG{appInfo?.latestVersionName ? ` v${appInfo.latestVersionName}` : ''}
              </a>
            ) : (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Link APK belum tersedia, hubungi admin.</p>
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Pakai aplikasi pelacak lain (manual)</summary>
              <div className="mt-2 space-y-2">
                <p>Klik &ldquo;Tambah HP&rdquo;, lalu isi URL Server ini dan API Key perangkat di aplikasi Anda.</p>
                <CopyField value={NOTIFY_URL} />
              </div>
            </details>
          </div>
        </div>
      </details>
    </Card>
  );
}

// ─── Log notifikasi ──────────────────────────────────────────
const NOTIF_STATUS: Record<MypgNotificationStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'info' }> = {
  MATCHED: { label: 'Cocok', tone: 'success' },
  NO_MATCH: { label: 'Tidak ada invoice', tone: 'warning' },
  AMBIGUOUS: { label: 'Nominal ganda', tone: 'danger' },
  IGNORED: { label: 'Diabaikan', tone: 'info' },
};

export function NotificationsSection() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['mypg-notifications', page],
    queryFn: () => mypgApi.getNotifications({ page }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifikasi Masuk</CardTitle>
        <CardDescription>Notifikasi yang diteruskan HP Anda beserta hasil pencocokannya.</CardDescription>
        <CardAction>
          <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : !rows.length ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Belum ada notifikasi masuk.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((n) => (
              <li key={n.id} className="space-y-1 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <ToneBadge tone={NOTIF_STATUS[n.status].tone}>{NOTIF_STATUS[n.status].label}</ToneBadge>
                  {n.amount !== null && <span className="font-medium">{formatCurrency(n.amount)}</span>}
                  {n.provider && <span className="text-xs text-muted-foreground">{MYPG_PROVIDER_LABEL[n.provider]}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                </div>
                <p className="break-words text-muted-foreground">{n.text}</p>
                {n.message && <p className="text-xs">{n.message}</p>}
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}

export default function MypgDevices() {
  return (
    <>
      <PageHeader title="Perangkat & QRIS" description="Atur QRIS penerima dan HP yang meneruskan notifikasi pembayaran." />
      <ConnectGuide />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <QrisSection />
        <DevicesSection />
      </div>
      <NotificationsSection />
    </>
  );
}
