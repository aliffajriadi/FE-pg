'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';
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

const GATEWAY_OPTIONS = [
  { value: 'PAKASIR', label: 'Pakasir (QRIS via Pakasir SDK)' },
  { value: 'DANA_MANUAL', label: 'DANA Manual (lacak via notifikasi HP)' },
  { value: 'SHOPEEPAY_MANUAL', label: 'ShopeePay Manual (lacak via notifikasi HP)' },
  { value: 'GOPAY_MANUAL', label: 'GoPay Manual (lacak via notifikasi HP)' },
];

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
  bannerIsActive: z.boolean(),
  bannerValue: z.string(),
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
    bannerIsActive: !!s.banner?.isActive,
    bannerValue: s.banner?.value || '',
  };
}

function SettingsFormView({ settings }: { settings: AdminSettings }) {
  const form = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema), defaultValues: toFormValues(settings) });
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

  const qrisOptions = settings.manualQrisList.map((q) => ({ value: String(q.id), label: q.name }));

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway Global</CardTitle>
          <CardDescription>Gateway pembayaran yang dipakai oleh seluruh merchant.</CardDescription>
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
              hint="QRIS ini dipakai untuk semua transaksi manual. Tambahkan QRIS di menu Daftar QRIS jika belum ada."
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
            <Input id="default-api-key" type="number" min={0} {...form.register('defaultApiKeyLimitValue', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Default Limit Webhook" htmlFor="default-webhook" error={errors.defaultWebhookLimitValue?.message}>
            <Input id="default-webhook" type="number" min={0} {...form.register('defaultWebhookLimitValue', { valueAsNumber: true })} />
          </FormField>
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
              dangerouslySetInnerHTML={{ __html: bannerValue || '<span style="opacity:.6">Belum ada konten</span>' }}
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
