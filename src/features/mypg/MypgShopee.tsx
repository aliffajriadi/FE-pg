'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mypgApi, type MypgShopeeLoginStep } from '@/lib/api/mypg';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';

type Step = 'device' | 'phone' | 'otp' | 'merchant' | 'store';

const DEVICE_GUIDE = [
  'Buka https://partner.business.accounts.shopee.co.id di Chrome/Firefox desktop (jangan login dulu).',
  'Tekan F12 → tab Network → centang "Preserve log", lalu refresh halaman (F5).',
  'Ketik "report" di kotak filter, cari request POST ke df.infra.sz.shopee.co.id/v2/shpsec/web/report.',
  'Buka tab Payload → View source, salin seluruh teksnya, lalu tempel di bawah.',
];

function Connect({ hasDeviceReport, onDone }: { hasDeviceReport: boolean; onDone: () => void }) {
  const [step, setStep] = useState<Step>(hasDeviceReport ? 'phone' : 'device');
  const [report, setReport] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginId, setLoginId] = useState('');
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [choice, setChoice] = useState('');

  // Hasil verifikasi/pilihan: lanjut ke langkah berikutnya atau selesai
  const next = (res: { data: MypgShopeeLoginStep }) => {
    const d = res.data;
    if (d.status === 'merchant-selection-required' || d.status === 'store-selection-required') {
      setOptions((d.status === 'merchant-selection-required' ? d.merchants : d.stores) ?? []);
      setChoice('');
      setStep(d.status === 'merchant-selection-required' ? 'merchant' : 'store');
    } else onDone();
  };

  const saveDevice = useApiMutation(mypgApi.saveShopeeDevice, { invalidate: [['mypg-shopee']], onSuccess: () => setStep('phone') });
  const sendOtp = useApiMutation(mypgApi.shopeeOtp, {
    onSuccess: (res) => {
      setLoginId(res.data.login_id);
      setStep('otp');
    },
  });
  const verify = useApiMutation(mypgApi.shopeeVerify, { invalidate: [['mypg-shopee']], onSuccess: next });
  const pickMerchant = useApiMutation(mypgApi.shopeeMerchant, { invalidate: [['mypg-shopee']], onSuccess: next });
  const pickStore = useApiMutation(mypgApi.shopeeStore, { invalidate: [['mypg-shopee']], onSuccess: next });

  if (step === 'device') {
    return (
      <div className="space-y-3">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {DEVICE_GUIDE.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <FormField
          label="Device report"
          htmlFor="shopee-report"
          hint="Berisi data perangkat browser Anda, bukan password. Disimpan terenkripsi."
        >
          <Textarea id="shopee-report" rows={4} value={report} onChange={(e) => setReport(e.target.value)} className="font-mono text-xs" />
        </FormField>
        <Button size="sm" disabled={saveDevice.isPending || report.trim().length < 50} onClick={() => saveDevice.mutate(report)}>
          {saveDevice.isPending ? 'Menyimpan...' : 'Simpan & Lanjut'}
        </Button>
      </div>
    );
  }

  if (step === 'phone') {
    return (
      <div className="space-y-3">
        <FormField label="Nomor HP akun Shopee Partner" htmlFor="shopee-phone">
          <Input id="shopee-phone" inputMode="tel" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <FormField label="Password (jika akun memakai password)" htmlFor="shopee-pass">
          <Input id="shopee-pass" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={sendOtp.isPending || !phone.trim()}
            onClick={() => sendOtp.mutate({ phone, password: password || undefined })}
          >
            {sendOtp.isPending ? 'Mengirim...' : 'Kirim OTP'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStep('device')}>
            Ganti device report
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="space-y-3">
        <FormField
          label="Kode OTP"
          htmlFor="shopee-otp"
          hint="Kode dikirim Shopee ke nomor tadi. Jika tidak masuk, device report kemungkinan salah: ulangi dari panduan."
        >
          <Input id="shopee-otp" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} />
        </FormField>
        <div className="flex gap-2">
          <Button size="sm" disabled={verify.isPending || !otp.trim()} onClick={() => verify.mutate({ login_id: loginId, otp })}>
            {verify.isPending ? 'Memverifikasi...' : 'Verifikasi'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStep('phone')}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const isMerchant = step === 'merchant';
  const pending = pickMerchant.isPending || pickStore.isPending;
  return (
    <div className="space-y-3">
      <FormField label={isMerchant ? 'Pilih merchant Shopee' : 'Pilih toko Shopee'} htmlFor="shopee-choice">
        <SimpleSelect
          id="shopee-choice"
          value={choice}
          onValueChange={setChoice}
          options={options.map((o) => ({ value: o.id, label: o.name || o.id }))}
        />
      </FormField>
      <Button
        size="sm"
        disabled={pending || !choice}
        onClick={() =>
          isMerchant
            ? pickMerchant.mutate({ login_id: loginId, merchant_id: choice })
            : pickStore.mutate({ login_id: loginId, store_id: choice })
        }
      >
        {pending ? 'Menyambungkan...' : 'Sambungkan'}
      </Button>
    </div>
  );
}

export function ShopeeAutoSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['mypg-shopee'],
    queryFn: mypgApi.getShopee,
    select: (res) => res.data,
    refetchInterval: 30_000,
  });
  const [connecting, setConnecting] = useState(false);
  const disconnect = useApiMutation(mypgApi.disconnectShopee, { invalidate: [['mypg-shopee']], onSuccess: () => setConnecting(false) });

  const connected = data?.status === 'CONNECTED';
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shopee Otomatis (tanpa HP)</CardTitle>
        <CardDescription>
          Server memantau transaksi ShopeePay akun Anda, jadi pembayaran terdeteksi tanpa HP. Berlaku untuk QRIS ShopeePay; invoice
          kedaluwarsa dalam 5 menit.
        </CardDescription>
        {data && (
          <CardAction>
            <ToneBadge tone={connected ? 'success' : data.status === 'NEEDS_LOGIN' ? 'warning' : 'neutral'}>
              {connected ? 'Terhubung' : data.status === 'NEEDS_LOGIN' ? 'Perlu login ulang' : 'Belum terhubung'}
            </ToneBadge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !data ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : !data.available ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Fitur ini belum diaktifkan di server. Hubungi admin.
          </p>
        ) : connected ? (
          <>
            <p className="text-sm">
              {data.merchantName || 'Akun Shopee'}
              {data.shopeeStoreName ? ` · ${data.shopeeStoreName}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.lastPollAt ? `Terakhir dipantau ${formatDate(data.lastPollAt)}` : 'Dipantau saat ada invoice menunggu pembayaran.'}
              {data.lastError ? ` · Error terakhir: ${data.lastError}` : ''}
            </p>
            {!data.hasShopeeQris && <p className="text-xs text-amber-600">Tambahkan QRIS ShopeePay agar invoice dipantau.</p>}
            <ConfirmAction
              destructive
              variant="outline"
              title="Putuskan sambungan Shopee?"
              description="Sesi dan device report dihapus dari server. Pembayaran tidak lagi terdeteksi otomatis lewat Shopee."
              confirmLabel="Putuskan"
              onConfirm={() => disconnect.mutateAsync()}
            >
              Putuskan
            </ConfirmAction>
          </>
        ) : connecting || data.status === 'NEEDS_LOGIN' ? (
          <>
            {data.lastError && <p className="text-xs text-amber-600">{data.lastError}</p>}
            <Connect hasDeviceReport={data.hasDeviceReport} onDone={() => setConnecting(false)} />
          </>
        ) : (
          <Button size="sm" onClick={() => setConnecting(true)}>
            Hubungkan Shopee
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
