'use client';

import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import { mypgApi, type MypgSettings, type MypgSettingsUpdate } from '@/lib/api/mypg';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';

const EXPIRY_PRESETS = [
  { minutes: 15, label: '15 menit' },
  { minutes: 30, label: '30 menit' },
  { minutes: 60, label: '1 jam' },
  { minutes: 360, label: '6 jam' },
  { minutes: 1440, label: '24 jam' },
  { minutes: 4320, label: '3 hari' },
];

const schema = z
  .object({
  expiryMinutes: z.number({ error: 'Wajib diisi' }).int('Bilangan bulat').min(5, 'Minimal 5 menit').max(10080, 'Maksimal 7 hari (10080 menit)'),
  maxUniqueCode: z.number({ error: 'Wajib diisi' }).int('Bilangan bulat').min(0, 'Minimal 0').max(999, 'Maksimal 999'),
  manualPaidWebhook: z.boolean(),
  expiredWebhook: z.boolean(),
  displayName: z.string().trim().max(60, 'Maksimal 60 karakter'),
  returnUrl: z.union([z.literal(''), z.url('URL tidak valid')]),
  telegramEnabled: z.boolean(),
  telegramChatId: z
    .string()
    .trim()
    .refine((v) => !v || /^-?\d{5,20}$/.test(v) || /^@[A-Za-z0-9_]{5,32}$/.test(v), 'Contoh: 123456789, -1001234567890, atau @channel_anda'),
  botMode: z.enum(['system', 'own']),
  telegramBotToken: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{5,15}:[A-Za-z0-9_-]{30,}$/.test(v), 'Format token dari @BotFather, mis. 123456:ABC...'),
  hasTelegramBotToken: z.boolean(),
  tgNotifyPaid: z.boolean(),
  tgNotifyUnmatched: z.boolean(),
  tgNotifyExpired: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.telegramEnabled && !v.telegramChatId) ctx.addIssue({ code: 'custom', path: ['telegramChatId'], message: 'Chat ID wajib diisi' });
    if (v.telegramEnabled && v.botMode === 'own' && !v.telegramBotToken && !v.hasTelegramBotToken) {
      ctx.addIssue({ code: 'custom', path: ['telegramBotToken'], message: 'Isi token bot Anda' });
    }
  });
type FormValues = z.infer<typeof schema>;

const toForm = (s: MypgSettings): FormValues => ({
  ...s,
  displayName: s.displayName ?? '',
  returnUrl: s.returnUrl ?? '',
  telegramChatId: s.telegramChatId ?? '',
  botMode: s.hasTelegramBotToken ? 'own' : 'system',
  telegramBotToken: '',
});

function toPayload(v: FormValues): MypgSettingsUpdate {
  const { botMode, telegramBotToken, hasTelegramBotToken, ...rest } = v;
  return {
    ...rest,
    displayName: v.displayName || null,
    returnUrl: v.returnUrl || null,
    telegramChatId: v.telegramChatId || null,
    // Token kosong pada mode "bot sendiri" = token lama dipertahankan; mode sistem = token dihapus
    ...(botMode === 'system' ? (hasTelegramBotToken ? { telegramBotToken: '' } : {}) : telegramBotToken ? { telegramBotToken } : {}),
  };
}

function formatMinutes(m: number) {
  if (!Number.isFinite(m) || m <= 0) return '';
  if (m % 1440 === 0) return `${m / 1440} hari`;
  if (m % 60 === 0) return `${m / 60} jam`;
  return m > 60 ? `${Math.floor(m / 60)} jam ${m % 60} menit` : `${m} menit`;
}

function ToggleRow({ id, label, desc, checked, onChange }: { id: string; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SettingsForm({ settings }: { settings: MypgSettings }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toForm(settings) });
  const { errors, isDirty } = form.formState;
  const [expiry, maxUnique, tgEnabled, botMode] = useWatch({
    control: form.control,
    name: ['expiryMinutes', 'maxUniqueCode', 'telegramEnabled', 'botMode'],
  });
  const { data: systemBot } = useQuery({
    queryKey: ['mypg-telegram-bot'],
    queryFn: mypgApi.getTelegramBot,
    select: (res) => res.data.username,
    staleTime: Infinity,
  });
  const testTelegram = useApiMutation(mypgApi.testTelegram);

  const mutation = useApiMutation((data: FormValues) => mypgApi.updateSettings(toPayload(data)), {
    invalidate: [['mypg-settings']],
    onSuccess: (res) => form.reset(toForm(res.data)),
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6 pb-2">
      <Card>
        <CardHeader>
          <CardTitle>Invoice</CardTitle>
          <CardDescription>Berlaku untuk invoice baru (API, panel, dan sandbox). Invoice yang sudah dibuat tidak berubah.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormField
            label="Batas Waktu Pembayaran (menit)"
            htmlFor="expiry"
            error={errors.expiryMinutes?.message}
            hint={`Invoice kedaluwarsa ${formatMinutes(expiry)} setelah dibuat. Minimal 5 menit, maksimal 7 hari.`}
          >
            <div className="flex flex-wrap gap-2 pb-1">
              {EXPIRY_PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => form.setValue('expiryMinutes', p.minutes, { shouldValidate: true, shouldDirty: true })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted',
                    expiry === p.minutes && 'border-primary bg-primary/10 text-primary'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Input id="expiry" type="number" min={5} max={10080} className="max-w-48" {...form.register('expiryMinutes', { valueAsNumber: true })} />
          </FormField>

          <FormField
            label="Kode Unik Maksimal (Rp)"
            htmlFor="max-unique"
            error={errors.maxUniqueCode?.message}
            hint={
              maxUnique === 0
                ? 'Kode unik mati: total selalu sama dengan nominal, tapi hanya boleh ada satu invoice menunggu untuk tiap nominal.'
                : `Bila ada invoice lain menunggu dengan nominal sama, total ditambah 1 - ${maxUnique} rupiah agar pembayaran bisa dibedakan.`
            }
          >
            <Input id="max-unique" type="number" min={0} max={999} className="max-w-48" {...form.register('maxUniqueCode', { valueAsNumber: true })} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook</CardTitle>
          <CardDescription>Event tambahan yang dikirim ke webhook MyPG proyek Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Controller
            control={form.control}
            name="manualPaidWebhook"
            render={({ field }) => (
              <ToggleRow
                id="manual-paid-webhook"
                label="Kirim webhook saat ditandai lunas manual"
                desc="Event payment.paid dikirim ketika Anda menekan Tandai Dibayar di halaman Transaksi."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="expiredWebhook"
            render={({ field }) => (
              <ToggleRow
                id="expired-webhook"
                label="Kirim webhook saat invoice kedaluwarsa"
                desc="Event payment.expired dikirim ketika batas waktu pembayaran habis."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Halaman Pembayaran</CardTitle>
          <CardDescription>Tampilan halaman bayar yang dibuka pelanggan dari paymentUrl.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormField label="Nama Tampilan" htmlFor="display-name" error={errors.displayName?.message} hint="Kosongkan untuk memakai nama toko.">
            <Input id="display-name" placeholder="Contoh: Toko Diamond Murah" {...form.register('displayName')} />
          </FormField>
          <FormField
            label="URL Kembali ke Toko"
            htmlFor="return-url"
            error={errors.returnUrl?.message}
            hint="Opsional. Tombol 'Kembali ke toko' muncul setelah pembayaran berhasil, mis. link bot Telegram atau website Anda."
          >
            <Input id="return-url" type="url" placeholder="https://t.me/bot_toko_anda" {...form.register('returnUrl')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifikasi Telegram</CardTitle>
          <CardDescription>Kabar pembayaran MyPG langsung ke Telegram Anda (pribadi, grup, atau channel).</CardDescription>
          <CardAction>
            <Controller
              control={form.control}
              name="telegramEnabled"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Aktifkan notifikasi Telegram" />}
            />
          </CardAction>
        </CardHeader>
        {tgEnabled && (
          <CardContent className="space-y-5">
            <Controller
              control={form.control}
              name="botMode"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-2">
                  <Label htmlFor="bot-system" className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-[[data-checked]]:border-primary">
                    <RadioGroupItem id="bot-system" value="system" className="mt-0.5" />
                    <span>
                      <span className="block font-medium">Bot sistem</span>
                      <span className="text-xs text-muted-foreground">
                        {systemBot ? <>Tekan Start di @{systemBot}, lalu isi Chat ID.</> : 'Pakai bot bawaan, cukup isi Chat ID.'}
                      </span>
                    </span>
                  </Label>
                  <Label htmlFor="bot-own" className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-[[data-checked]]:border-primary">
                    <RadioGroupItem id="bot-own" value="own" className="mt-0.5" />
                    <span>
                      <span className="block font-medium">Bot sendiri</span>
                      <span className="text-xs text-muted-foreground">Pakai bot buatan Anda dari @BotFather.</span>
                    </span>
                  </Label>
                </RadioGroup>
              )}
            />

            {botMode === 'own' && (
              <FormField
                label="Token Bot"
                htmlFor="tg-token"
                error={errors.telegramBotToken?.message}
                hint={
                  settings.hasTelegramBotToken
                    ? 'Token sudah tersimpan dan tidak ditampilkan. Isi hanya jika ingin menggantinya.'
                    : 'Dari @BotFather. Disimpan di server dan tidak ditampilkan lagi.'
                }
              >
                <Input
                  id="tg-token"
                  type="password"
                  autoComplete="off"
                  placeholder={settings.hasTelegramBotToken ? '•••••••• (tersimpan)' : '123456789:AA...'}
                  {...form.register('telegramBotToken')}
                />
              </FormField>
            )}

            <FormField
              label="Chat ID"
              htmlFor="tg-chat"
              error={errors.telegramChatId?.message}
              hint="ID pribadi bisa dilihat lewat @userinfobot. Untuk grup, tambahkan bot ke grup (ID diawali -100). Untuk channel, jadikan bot admin lalu isi @username channel."
            >
              <Input id="tg-chat" placeholder="123456789" {...form.register('telegramChatId')} />
            </FormField>

            <div className="space-y-3">
              {(
                [
                  ['tgNotifyPaid', 'Pembayaran diterima', 'Saat invoice lunas, otomatis maupun ditandai manual.'],
                  ['tgNotifyUnmatched', 'Uang masuk tanpa invoice cocok', 'Notifikasi pembayaran masuk tapi tidak ada invoice dengan total itu, atau nominalnya ganda.'],
                  ['tgNotifyExpired', 'Invoice kedaluwarsa', 'Ringkasan invoice yang lewat batas waktu tanpa dibayar.'],
                ] as const
              ).map(([name, label, desc]) => (
                <Controller
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => <ToggleRow id={name} label={label} desc={desc} checked={field.value} onChange={field.onChange} />}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => testTelegram.mutate()} disabled={isDirty || testTelegram.isPending}>
                <Send /> {testTelegram.isPending ? 'Mengirim...' : 'Kirim Pesan Tes'}
              </Button>
              {isDirty && <p className="text-xs text-muted-foreground">Simpan pengaturan dulu sebelum mengirim tes.</p>}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tombol simpan menempel di bawah layar supaya tidak perlu scroll ke akhir halaman */}
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <p className="mr-auto text-xs text-muted-foreground">{isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}</p>
        <Button type="button" variant="outline" disabled={!isDirty || mutation.isPending} onClick={() => form.reset()}>
          Batal
        </Button>
        <Button type="submit" disabled={!isDirty || mutation.isPending}>
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </form>
  );
}

export default function MypgSettingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['mypg-settings'], queryFn: mypgApi.getSettings, select: (res) => res.data });
  return (
    <>
      <PageHeader title="Pengaturan MyPG" description="Atur batas waktu invoice, kode unik, webhook, halaman pembayaran, dan notifikasi Telegram." />
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-destructive">Gagal memuat pengaturan: {error?.message}</p>
      ) : (
        <SettingsForm settings={data} />
      )}
    </>
  );
}
