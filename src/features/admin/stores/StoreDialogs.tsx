'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type AdminStore } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { optionalNumber, requiredNumber, toOptionalNumber } from '@/lib/validations/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { GATEWAY_OPTIONS, GATEWAY_SHORT_LABEL, isManualGateway } from '@/lib/gateway';
import type { FeeType } from '@/types';

const STORES_KEY = ['admin-stores'];
const FEE_TYPE_OPTIONS = [
  { value: 'FIXED', label: 'Tetap (Nominal Rp)' },
  { value: 'PERCENT', label: 'Persen (%)' },
];

function DialogActions({ pending, onCancel, label = 'Simpan' }: { pending: boolean; onCancel: () => void; label?: string }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Batal
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? 'Menyimpan...' : label}
      </Button>
    </DialogFooter>
  );
}

// ─── Fee transaksi & fee penarikan (bentuk form sama) ────────
const feeSchema = z.object({
  type: z.enum(['FIXED', 'PERCENT']),
  value: requiredNumber(),
  threshold: optionalNumber(),
  extraType: z.enum(['FIXED', 'PERCENT']),
  extraValue: optionalNumber(),
  maxAmount: optionalNumber(),
});
type FeeForm = z.infer<typeof feeSchema>;

function feeDefaults(store: AdminStore, mode: 'fee' | 'wd'): FeeForm {
  const nullToUndef = (v: number | null) => (v ? v : undefined);
  return mode === 'fee'
    ? {
        type: store.feeType,
        value: store.feeValue,
        threshold: nullToUndef(store.feeThreshold),
        extraType: store.extraFeeType ?? 'FIXED',
        extraValue: nullToUndef(store.extraFeeValue),
      }
    : {
        type: store.wdFeeType ?? 'FIXED',
        value: store.wdFeeValue ?? 3500,
        threshold: nullToUndef(store.wdFeeThreshold),
        extraType: store.wdExtraFeeType ?? 'FIXED',
        extraValue: nullToUndef(store.wdExtraFeeValue),
        maxAmount: nullToUndef(store.wdMaxAmount),
      };
}

export function FeeDialog({ store, mode }: { store: AdminStore; mode: 'fee' | 'wd' }) {
  const [open, setOpen] = useState(false);
  const form = useForm<FeeForm>({
    resolver: zodResolver(feeSchema),
    defaultValues: feeDefaults(store, mode),
  });
  const { errors } = form.formState;
  const isWd = mode === 'wd';

  const mutation = useApiMutation(
    (data: FeeForm) => {
      // Extra fee hanya berlaku jika threshold diisi (> 0), sama seperti frontend lama
      const hasThreshold = !!data.threshold && data.threshold > 0;
      const threshold = hasThreshold ? data.threshold! : null;
      const extraValue = hasThreshold ? (data.extraValue ?? 0) : null;
      return isWd
        ? adminApi.updateStoreWdSettings(store.id, {
            wdFeeType: data.type,
            wdFeeValue: data.value,
            wdFeeThreshold: threshold,
            wdExtraFeeType: data.extraType,
            wdExtraFeeValue: extraValue,
            wdMaxAmount: data.maxAmount && data.maxAmount > 0 ? data.maxAmount : null,
          })
        : adminApi.updateStoreFee(store.id, {
            feeType: data.type,
            feeValue: data.value,
            feeThreshold: threshold,
            extraFeeType: data.extraType,
            extraFeeValue: extraValue,
          });
    },
    {
      successMessage: isWd ? 'Pengaturan penarikan disimpan' : 'Fee toko disimpan',
      invalidate: [STORES_KEY],
      onSuccess: () => setOpen(false),
    },
  );

  const typeSelect = (name: 'type' | 'extraType', id: string) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <SimpleSelect id={id} value={field.value} onValueChange={(v) => field.onChange(v as FeeType)} options={FEE_TYPE_OPTIONS} />
      )}
    />
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          form.reset(feeDefaults(store, mode));
          setOpen(true);
        }}
      >
        {isWd ? 'Fee WD' : 'Fee'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isWd ? 'Biaya & Batasan Penarikan (WD)' : 'Biaya Layanan (Fee)'}</DialogTitle>
            <DialogDescription>{store.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{isWd ? 'Biaya Dasar Penarikan' : 'Fee Dasar'}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Tipe" htmlFor={`${mode}-type`}>
                  {typeSelect('type', `${mode}-type`)}
                </FormField>
                <FormField label="Nilai" htmlFor={`${mode}-value`} error={errors.value?.message}>
                  <Input id={`${mode}-value`} type="number" min={0} step="any" {...form.register('value', { valueAsNumber: true })} />
                </FormField>
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <div>
                <h3 className="text-sm font-semibold">Extra Fee (Opsional)</h3>
                <p className="text-xs text-muted-foreground">
                  Biaya tambahan otomatis jika nominal {isWd ? 'penarikan' : 'transaksi'} mencapai batas tertentu.
                </p>
              </div>
              <FormField label="Batas Minimal (Threshold)" htmlFor={`${mode}-threshold`} error={errors.threshold?.message}>
                <Input
                  id={`${mode}-threshold`}
                  type="number"
                  min={0}
                  placeholder="Kosongkan jika tidak ada extra fee"
                  {...form.register('threshold', {
                    setValueAs: toOptionalNumber,
                  })}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Tipe Extra Fee" htmlFor={`${mode}-extra-type`}>
                  {typeSelect('extraType', `${mode}-extra-type`)}
                </FormField>
                <FormField label="Nilai Extra Fee" htmlFor={`${mode}-extra-value`} error={errors.extraValue?.message}>
                  <Input
                    id={`${mode}-extra-value`}
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    {...form.register('extraValue', {
                      setValueAs: toOptionalNumber,
                    })}
                  />
                </FormField>
              </div>
            </section>

            {isWd && (
              <section className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Batasan Penarikan</h3>
                <FormField label="Maksimal Penarikan per Transaksi (Rp)" htmlFor="wd-max" error={errors.maxAmount?.message}>
                  <Input
                    id="wd-max"
                    type="number"
                    min={0}
                    placeholder="Kosongkan jika tidak ada batasan"
                    {...form.register('maxAmount', {
                      setValueAs: toOptionalNumber,
                    })}
                  />
                </FormField>
              </section>
            )}

            <DialogActions pending={mutation.isPending} onCancel={() => setOpen(false)} label="Simpan Konfigurasi" />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Gateway & QRIS khusus toko ──────────────────────────────
const FOLLOW_DEFAULT = 'DEFAULT';

export function PaymentGatewayDialog({ store }: { store: AdminStore }) {
  const [open, setOpen] = useState(false);
  const [gateway, setGateway] = useState(FOLLOW_DEFAULT);
  const [qris, setQris] = useState('');
  const [qrisError, setQrisError] = useState('');

  // Pengaturan sistem memuat gateway default + daftar QRIS sekaligus
  const settings = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminApi.getSettings,
    select: (res) => res.data,
    enabled: open,
  });
  const qrisList = settings.data?.manualQrisList ?? [];
  const qrisName = (id?: string | null) => qrisList.find((q) => String(q.id) === id)?.name;

  const defaultGateway = settings.data?.defaultPaymentGateway?.value || 'PAKASIR';
  const defaultLabel = settings.data
    ? `${GATEWAY_SHORT_LABEL[defaultGateway] ?? defaultGateway}${
        isManualGateway(defaultGateway) ? ` · ${qrisName(settings.data.defaultManualQris?.value) ?? 'QRIS belum dipilih'}` : ''
      }`
    : 'memuat...';

  const mutation = useApiMutation(
    () =>
      adminApi.updateStorePaymentGateway(store.id, {
        paymentGateway: gateway === FOLLOW_DEFAULT ? null : gateway,
        manualQris: isManualGateway(gateway) ? qris : null,
      }),
    {
      successMessage: 'Metode pembayaran toko disimpan',
      invalidate: [STORES_KEY],
      onSuccess: () => setOpen(false),
    },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isManualGateway(gateway) && !qris) return setQrisError('Pilih QRIS yang dipakai toko ini');
    mutation.mutate();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setGateway(store.paymentGateway ?? FOLLOW_DEFAULT);
          setQris(store.manualQris ?? '');
          setQrisError('');
          setOpen(true);
        }}
      >
        QRIS
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Metode Pembayaran Toko</DialogTitle>
            <DialogDescription>{store.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <FormField
              label="Gateway"
              htmlFor="store-gateway"
              hint="Ikut default: toko memakai gateway & QRIS dari Pengaturan Sistem, dan ikut berubah bila default diganti."
            >
              <SimpleSelect
                id="store-gateway"
                value={gateway}
                onValueChange={(v) => {
                  setGateway(v);
                  setQrisError('');
                }}
                options={[{ value: FOLLOW_DEFAULT, label: `Ikut default sistem (${defaultLabel})` }, ...GATEWAY_OPTIONS]}
              />
            </FormField>
            {gateway === FOLLOW_DEFAULT && (
              <p className="rounded-lg bg-muted p-3 text-sm">
                Toko ini memakai <strong>{defaultLabel}</strong> dari Pengaturan Sistem. Tidak perlu memilih QRIS.
              </p>
            )}
            {isManualGateway(gateway) && (
              <FormField
                label="QRIS *"
                htmlFor="store-qris"
                error={qrisError}
                hint={qrisList.length ? 'Invoice baru toko ini memakai QRIS ini.' : 'Belum ada QRIS. Tambahkan dulu di menu QRIS.'}
              >
                <SimpleSelect
                  id="store-qris"
                  value={qris}
                  onValueChange={(v) => {
                    setQris(v);
                    setQrisError('');
                  }}
                  options={qrisList.map((q) => ({ value: String(q.id), label: q.name }))}
                  placeholder="-- Pilih QRIS --"
                />
              </FormField>
            )}
            <p className="text-xs text-muted-foreground">
              Perubahan hanya berlaku untuk invoice baru. Invoice yang sedang menunggu tetap memakai QRIS lamanya.
            </p>
            <DialogActions pending={mutation.isPending} onCancel={() => setOpen(false)} />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Durasi hold saldo ───────────────────────────────────────
const holdSchema = z.object({ holdHours: requiredNumber() });

export function HoldHoursDialog({ store }: { store: AdminStore }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof holdSchema>>({
    resolver: zodResolver(holdSchema),
  });

  const mutation = useApiMutation(({ holdHours }: { holdHours: number }) => adminApi.updateStoreHoldHours(store.id, holdHours), {
    successMessage: 'Durasi hold saldo disimpan',
    invalidate: [STORES_KEY],
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          form.reset({ holdHours: store.balanceHoldHours ?? 48 });
          setOpen(true);
        }}
      >
        Hold
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Durasi Penahanan Saldo (Hold)</DialogTitle>
            <DialogDescription>{store.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              label="Durasi (Jam)"
              htmlFor="hold-hours"
              error={form.formState.errors.holdHours?.message}
              hint="0 berarti saldo langsung masuk ke saldo utama tanpa ditahan."
            >
              <Input id="hold-hours" type="number" min={0} {...form.register('holdHours', { valueAsNumber: true })} />
            </FormField>
            <DialogActions pending={mutation.isPending} onCancel={() => setOpen(false)} />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Batas transaksi per hari ────────────────────────────────
const dailyLimitSchema = z.object({
  // Kosong = ikut default sistem, 0 = tanpa batas
  limit: z
    .string()
    .trim()
    .regex(/^\d*$/, 'Harus bilangan bulat >= 0')
    .refine((v) => v.length < 8 && Number(v || 0) <= 1_000_000, 'Maksimal 1.000.000'),
});

export function DailyLimitDialog({ store }: { store: AdminStore }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof dailyLimitSchema>>({
    resolver: zodResolver(dailyLimitSchema),
  });

  const mutation = useApiMutation(
    ({ limit }: { limit: string }) => adminApi.updateStoreDailyTxLimit(store.id, limit === '' ? null : Number(limit)),
    {
      successMessage: 'Batas transaksi harian disimpan',
      invalidate: [STORES_KEY],
      onSuccess: () => setOpen(false),
    },
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          form.reset({
            limit: store.dailyTxLimit == null ? '' : String(store.dailyTxLimit),
          });
          setOpen(true);
        }}
      >
        Batas/Hari
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batas Transaksi per Hari</DialogTitle>
            <DialogDescription>{store.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              label="Maks. Transaksi per Hari"
              htmlFor="daily-limit"
              error={form.formState.errors.limit?.message}
              hint="Kosongkan untuk mengikuti default sistem. Isi 0 untuk tanpa batas. Reset setiap 00:00 WIB."
            >
              <Input id="daily-limit" inputMode="numeric" placeholder="Ikuti default" {...form.register('limit')} />
            </FormField>
            <DialogActions pending={mutation.isPending} onCancel={() => setOpen(false)} />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
