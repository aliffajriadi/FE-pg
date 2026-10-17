'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { adminApi, type AdminSettings } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { requiredNumber } from '@/lib/validations/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { TIER_STYLE, TierBadge } from '@/components/shared/TierBadge';
import type { TierColor } from '@/lib/api/merchant';
import { GATEWAY_OPTIONS } from '@/lib/gateway';

const NOTIF_OPTIONS = [
  { value: 'wa', label: 'WhatsApp' },
  { value: 'discord', label: 'Discord Webhook' },
  { value: 'telegram', label: 'Telegram' },
];

const MANUAL_METHOD_OPTIONS = [
  { value: 'dana', label: 'DANA saja' },
  { value: 'shopeepay', label: 'ShopeePay saja' },
  { value: 'gopay', label: 'GoPay saja' },
  { value: 'all', label: 'Semua (DANA, ShopeePay & GoPay)' },
];

const TIER_COLOR_OPTIONS = (Object.keys(TIER_STYLE) as TierColor[]).map((value) => ({ value, label: TIER_STYLE[value].label }));

const TIER_BASIS_OPTIONS = [
  { value: 'COUNT', label: 'Jumlah transaksi berhasil' },
  { value: 'VOLUME', label: 'Total volume transaksi (Rp)' },
];

const settingsSchema = z.object({
  defaultPaymentGatewayValue: z.string(),
  defaultManualQrisValue: z.string(),
  qrisMaintenanceIsActive: z.boolean(),
  notifMethodValue: z.string(),
  waNumberValue: z.string(),
  discordWebhookValue: z.string(),
  telegramChatIdValue: z.string(),
  manualPaymentMethodValue: z.string(),
  defaultApiKeyLimitValue: requiredNumber(),
  defaultWebhookLimitValue: requiredNumber(),
  defaultDailyTxLimitValue: z
    .number({ error: 'Wajib diisi' })
    .int('Harus bilangan bulat')
    .min(0, 'Tidak boleh negatif')
    .max(1_000_000, 'Maksimal 1.000.000'),
  bannerIsActive: z.boolean(),
  bannerValue: z.string(),
  minInvoiceAmountValue: z
    .number({ error: 'Wajib diisi' })
    .int('Harus bilangan bulat')
    .min(1, 'Minimal Rp1')
    .max(20_000_000, 'Maksimal Rp20.000.000'),
  autoWdEnabledValue: z.boolean(),
  autoWdMaxHoursValue: z
    .number({ error: 'Wajib diisi' })
    .int('Harus bilangan bulat')
    .min(1, 'Minimal 1 jam')
    .max(72, 'Maksimal 72 jam (3 hari)'),
  merchantTiersValue: z.object({
    basis: z.enum(['COUNT', 'VOLUME']),
    tiers: z
      .array(
        z.object({
          name: z.string().trim().min(1, 'Nama wajib diisi'),
          min: z.number({ error: 'Wajib diisi' }).int('Harus bilangan bulat').min(0, 'Tidak boleh negatif'),
          color: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
        }),
      )
      .min(1, 'Minimal 1 level')
      .max(10, 'Maksimal 10 level'),
  }),
});
type SettingsForm = z.infer<typeof settingsSchema>;

function toFormValues(s: AdminSettings): SettingsForm {
  const manualMethod = s.manualPaymentMethod?.value;
  return {
    defaultPaymentGatewayValue: s.defaultPaymentGateway?.value || 'PAKASIR',
    defaultManualQrisValue: s.defaultManualQris?.value || '',
    qrisMaintenanceIsActive: !!s.qrisMaintenance?.isActive,
    notifMethodValue: s.notifMethod?.value || 'wa',
    waNumberValue: s.waNumber?.value || '',
    discordWebhookValue: s.discordWebhook?.value || '',
    telegramChatIdValue: s.telegramChatId?.value || '',
    // Nilai lama "both" setara dengan "all"
    manualPaymentMethodValue: !manualMethod || manualMethod === 'both' ? 'all' : manualMethod,
    defaultApiKeyLimitValue: Number(s.defaultApiKeyLimit?.value ?? 5),
    defaultWebhookLimitValue: Number(s.defaultWebhookLimit?.value ?? 5),
    defaultDailyTxLimitValue: Number(s.defaultDailyTxLimit?.value ?? 0),
    bannerIsActive: !!s.banner?.isActive,
    bannerValue: s.banner?.value || '',
    minInvoiceAmountValue: Number(s.minInvoiceAmount?.value ?? 500),
    autoWdEnabledValue: s.autoWdEnabled?.value === 'true',
    autoWdMaxHoursValue: Number(s.autoWdMaxHours?.value ?? 72),
    merchantTiersValue: s.merchantTiers ?? {
      basis: 'COUNT',
      tiers: [{ name: 'Bronze', min: 0, color: 'bronze' }],
    },
  };
}

function SettingsFormView({ settings }: { settings: AdminSettings }) {
  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(settings),
  });
  const { errors } = form.formState;
  const [gateway, notifMethod, bannerValue] = useWatch({
    control: form.control,
    name: ['defaultPaymentGatewayValue', 'notifMethodValue', 'bannerValue'],
  });
  const isManualGateway = gateway !== 'PAKASIR';

  const mutation = useApiMutation((data: SettingsForm) => adminApi.updateSettings(data), {
    successMessage: 'Pengaturan sistem berhasil disimpan',
    invalidate: [['admin-settings']],
  });

  const tierFields = useFieldArray({
    control: form.control,
    name: 'merchantTiersValue.tiers',
  });
  const [tierBasis, tierPreview] = useWatch({
    control: form.control,
    name: ['merchantTiersValue.basis', 'merchantTiersValue.tiers'],
  });

  const runAutoWd = useApiMutation(() => adminApi.runAutoWithdrawals(), {
    invalidate: [['admin-withdrawals']],
  });

  const qrisOptions = settings.manualQrisList.map((q) => ({
    value: String(q.id),
    label: q.name,
  }));

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Penyedia Pembayaran Global</CardTitle>
          <CardDescription>
            Gateway default untuk merchant yang belum diatur khusus. Gateway & QRIS per merchant diatur di menu Toko / Merchant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Gateway Aktif" htmlFor="gateway">
            <Controller
              control={form.control}
              name="defaultPaymentGatewayValue"
              render={({ field }) => (
                <SimpleSelect id="gateway" value={field.value} onValueChange={field.onChange} options={GATEWAY_OPTIONS} />
              )}
            />
          </FormField>
          {isManualGateway && (
            <FormField
              label="QRIS Global"
              htmlFor="manual-qris"
              hint="Dipakai merchant yang mengikuti default. Tambahkan QRIS di menu QRIS jika belum ada."
            >
              <Controller
                control={form.control}
                name="defaultManualQrisValue"
                render={({ field }) => (
                  <SimpleSelect
                    id="manual-qris"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={qrisOptions}
                    placeholder="-- Pilih QRIS --"
                  />
                )}
              />
            </FormField>
          )}
          <Controller
            control={form.control}
            name="qrisMaintenanceIsActive"
            render={({ field }) => (
              <Label className="flex items-center gap-3 rounded-lg border p-3">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                <span>
                  <span className="block font-medium">Mode Maintenance</span>
                  <span className="text-xs font-normal text-muted-foreground">Blokir pembuatan invoice QRIS baru</span>
                </span>
              </Label>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifikasi Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Metode Notifikasi" htmlFor="notif-method">
            <Controller
              control={form.control}
              name="notifMethodValue"
              render={({ field }) => (
                <SimpleSelect id="notif-method" value={field.value} onValueChange={field.onChange} options={NOTIF_OPTIONS} />
              )}
            />
          </FormField>
          {notifMethod === 'wa' && (
            <FormField label="No. WhatsApp Admin" htmlFor="wa-number" hint="Format: 628xxx">
              <Input id="wa-number" {...form.register('waNumberValue')} />
            </FormField>
          )}
          {notifMethod === 'discord' && (
            <FormField label="URL Discord Webhook" htmlFor="discord-webhook">
              <Input id="discord-webhook" placeholder="https://discord.com/api/webhooks/..." {...form.register('discordWebhookValue')} />
            </FormField>
          )}
          {notifMethod === 'telegram' && (
            <FormField label="Telegram Chat ID" htmlFor="telegram-chat-id" hint="Opsional, memakai default jika kosong.">
              <Input id="telegram-chat-id" placeholder="Misal: 123456789" {...form.register('telegramChatIdValue')} />
            </FormField>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metode Penerimaan Pembayaran Manual</CardTitle>
          <CardDescription>Aplikasi yang boleh memicu konfirmasi pembayaran otomatis via notifikasi HP.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={form.control}
            name="manualPaymentMethodValue"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="sm:grid-cols-2">
                {MANUAL_METHOD_OPTIONS.map((opt) => (
                  <Label key={opt.value} className="cursor-pointer rounded-lg border p-3 font-normal">
                    <RadioGroupItem value={opt.value} /> {opt.label}
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Limit Merchant Baru</CardTitle>
          <CardDescription>Dipakai otomatis saat membuat merchant baru. Bisa diubah per pengguna di menu Pengguna.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Default Limit API Key" htmlFor="default-api-key" error={errors.defaultApiKeyLimitValue?.message}>
            <Input
              id="default-api-key"
              type="number"
              min={0}
              {...form.register('defaultApiKeyLimitValue', {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField label="Default Limit Webhook" htmlFor="default-webhook" error={errors.defaultWebhookLimitValue?.message}>
            <Input
              id="default-webhook"
              type="number"
              min={0}
              {...form.register('defaultWebhookLimitValue', {
                valueAsNumber: true,
              })}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batas Transaksi per Hari</CardTitle>
          <CardDescription>
            Jumlah maksimal transaksi live yang berhasil (sudah dibayar) per merchant dalam sehari (reset 00:00 WIB), berlaku untuk API dan
            Dashboard. Sandbox tidak dihitung. Bisa diatur khusus per merchant di menu Manajemen Toko.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            label="Default Maks. Transaksi per Hari"
            htmlFor="default-daily-tx"
            error={errors.defaultDailyTxLimitValue?.message}
            hint="Isi 0 untuk tanpa batas. Merchant yang batasnya tidak diatur khusus mengikuti nilai ini."
          >
            <Input
              id="default-daily-tx"
              type="number"
              min={0}
              {...form.register('defaultDailyTxLimitValue', {
                valueAsNumber: true,
              })}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batas Nominal Invoice</CardTitle>
          <CardDescription>
            Minimum nominal yang boleh dibuat merchant per invoice, berlaku untuk API, Dashboard, dan Sandbox. Maksimum tetap Rp20.000.000.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            label="Minimum Nominal Invoice (Rp)"
            htmlFor="min-invoice-amount"
            error={errors.minInvoiceAmountValue?.message}
            hint="Default Rp500. Invoice yang sudah dibuat tidak terpengaruh. Pastikan tidak di bawah batas minimum penyedia pembayaran yang dipakai."
          >
            <Input
              id="min-invoice-amount"
              type="number"
              min={1}
              max={20000000}
              {...form.register('minInvoiceAmountValue', {
                valueAsNumber: true,
              })}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto Penarikan</CardTitle>
          <CardDescription>
            Saldo Utama merchant yang mengendap ditarik otomatis ke rekening yang disetujui. Merchant bisa memilih interval lebih pendek,
            tapi tidak bisa membatalkan penarikan otomatis. Merchant tertentu bisa dikecualikan lewat kolom Auto WD di menu Manajemen Toko.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={form.control}
            name="autoWdEnabledValue"
            render={({ field }) => (
              <Label className="flex items-center gap-3 rounded-lg border p-3">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                <span>
                  <span className="block font-medium">Aktifkan Auto Penarikan</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Saat diaktifkan, siklus semua merchant dimulai dari saat itu.
                  </span>
                </span>
              </Label>
            )}
          />
          <FormField
            label="Maksimal Pengendapan Saldo (jam)"
            htmlFor="auto-wd-max-hours"
            error={errors.autoWdMaxHoursValue?.message}
            hint="1 - 72 jam. Pilihan merchant yang lebih besar dari nilai ini akan diturunkan otomatis."
          >
            <Input
              id="auto-wd-max-hours"
              type="number"
              min={1}
              max={72}
              {...form.register('autoWdMaxHoursValue', { valueAsNumber: true })}
            />
          </FormField>
          <Button type="button" variant="outline" onClick={() => runAutoWd.mutate()} disabled={runAutoWd.isPending}>
            {runAutoWd.isPending ? <Loader2 className="animate-spin" /> : null} Jalankan Pengecekan Sekarang
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Level Merchant</CardTitle>
          <CardDescription>
            Level ditampilkan di halaman Akun merchant. Merchant mendapat level tertinggi yang batas minimalnya sudah tercapai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Dasar Penentuan Level" htmlFor="tier-basis">
            <Controller
              control={form.control}
              name="merchantTiersValue.basis"
              render={({ field }) => (
                <SimpleSelect id="tier-basis" value={field.value} onValueChange={field.onChange} options={TIER_BASIS_OPTIONS} />
              )}
            />
          </FormField>

          <div className="space-y-2">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_auto] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
              <span>Nama Level</span>
              <span>Minimal {tierBasis === 'VOLUME' ? 'Volume (Rp)' : 'Transaksi'}</span>
              <span>Warna</span>
              <span className="w-7" />
            </div>
            {tierFields.fields.map((field, index) => {
              const err = errors.merchantTiersValue?.tiers?.[index];
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_auto] sm:items-start sm:border-0 sm:p-0"
                >
                  <div className="col-span-2 space-y-1 sm:col-span-1">
                    <Input
                      placeholder="Contoh: Gold"
                      aria-label="Nama level"
                      {...form.register(`merchantTiersValue.tiers.${index}.name`)}
                    />
                    {err?.name && <p className="text-xs text-destructive">{err.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min={0}
                      aria-label="Batas minimal"
                      {...form.register(`merchantTiersValue.tiers.${index}.min`, { valueAsNumber: true })}
                    />
                    {err?.min && <p className="text-xs text-destructive">{err.min.message}</p>}
                  </div>
                  <Controller
                    control={form.control}
                    name={`merchantTiersValue.tiers.${index}.color`}
                    render={({ field: f }) => <SimpleSelect value={f.value} onValueChange={f.onChange} options={TIER_COLOR_OPTIONS} />}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="col-span-2 justify-self-end text-destructive sm:col-span-1"
                    disabled={tierFields.fields.length <= 1}
                    onClick={() => tierFields.remove(index)}
                    aria-label="Hapus level"
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
            {errors.merchantTiersValue?.tiers?.root?.message && (
              <p className="text-xs text-destructive">{errors.merchantTiersValue.tiers.root.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={tierFields.fields.length >= 10}
              onClick={() => tierFields.append({ name: '', min: 0, color: 'diamond' })}
            >
              <Plus /> Tambah Level
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Pratinjau:
            {[...(tierPreview ?? [])]
              .filter((t) => t?.name?.trim())
              .sort((a, b) => (a.min || 0) - (b.min || 0))
              .map((t, i) => (
                <TierBadge key={`${t.name}-${i}`} tier={{ name: t.name, min: t.min, color: t.color }} />
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banner Pengumuman Merchant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={form.control}
            name="bannerIsActive"
            render={({ field }) => (
              <Label className="flex items-center gap-3">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Tampilkan banner ke merchant
              </Label>
            )}
          />
          <FormField label="Konten Banner (HTML diperbolehkan)" htmlFor="banner">
            <Textarea
              id="banner"
              rows={8}
              className="font-mono text-xs"
              placeholder="<h2>Pengumuman Penting!</h2><p>Isi pengumuman...</p>"
              {...form.register('bannerValue')}
            />
          </FormField>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Pratinjau</p>
            {/* Konten ditulis oleh admin sendiri, sama seperti frontend lama */}
            <div
              className="min-h-20 rounded-lg border border-dashed p-4 text-sm"
              dangerouslySetInnerHTML={{
                __html: bannerValue || '<span style="opacity:.6">Belum ada konten</span>',
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end border-t bg-background py-3">
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </form>
  );
}

function BackupCard() {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const blob = await adminApi.backupDatabase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_payment_${new Date().toISOString().slice(0, 10)}.db`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error((error as Error).message || 'Gagal mengunduh database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup Database</CardTitle>
        <CardDescription>Unduh seluruh database SQLite sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={download} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Download />} Unduh Database (SQLite)
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SystemSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminApi.getSettings,
    select: (res) => res.data,
  });

  return (
    <>
      <PageHeader title="Pengaturan Sistem" description="Konfigurasi global untuk seluruh merchant." />
      {isLoading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat pengaturan...
        </p>
      ) : error || !data ? (
        <p className="text-destructive">Gagal memuat pengaturan: {error?.message}</p>
      ) : (
        <SettingsFormView settings={data} />
      )}
      <BackupCard />
    </>
  );
}
