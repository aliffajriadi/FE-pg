'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { authApi } from '@/lib/api/auth';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { homePathFor, setSession } from '@/lib/session';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

type Pending = { token: string; code: string; waLink: string; expiresAt: string };
type Mode = 'register' | 'login' | 'reset' | 'change' | 'phone-old' | 'phone-new';
const START_LABEL: Record<Mode, string> = {
  register: 'Daftar via WhatsApp',
  login: 'Masuk via WhatsApp',
  reset: 'Verifikasi via WhatsApp',
  change: 'Verifikasi via WhatsApp',
  'phone-old': 'Verifikasi Nomor Lama',
  'phone-new': 'Verifikasi Nomor Baru',
};
// Disimpan per tab agar refresh halaman tidak memulai ulang prosesnya
const storageKey = (mode: Mode) => `wa-${mode}`;

const load = (mode: Mode): Pending | null => {
  try {
    const value = sessionStorage.getItem(storageKey(mode));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
const save = (mode: Mode, value: Pending | null) => {
  try {
    if (value) sessionStorage.setItem(storageKey(mode), JSON.stringify(value));
    else sessionStorage.removeItem(storageKey(mode));
  } catch {
    // storage diblokir: pendaftaran tetap jalan selama tab tidak di-refresh
  }
};

const startFor = (mode: Mode, oldToken?: string) =>
  mode === 'change' || mode === 'phone-old'
    ? authApi.verifyOwnPhoneStart()
    : mode === 'phone-new'
      ? authApi.phoneStart(oldToken)
      : authApi.registerStart(mode);

/**
 * Verifikasi via WhatsApp (user mengirim kode ke bot SendWA, halaman menunggu hasilnya) untuk daftar, masuk cepat,
 * lupa / ubah kata sandi, dan ganti nomor. onVerified: phone-old -> token bukti nomor lama, phone-new -> nomor tersimpan.
 */
export default function RegisterWa({
  mode = 'register',
  oldToken,
  onVerified,
  onRestart,
  updatePassword = merchantApi.updatePassword,
}: {
  mode?: Mode;
  oldToken?: string;
  onVerified?: (token: string) => void;
  /** phone-new dengan oldToken: nomor gagal disimpan, minta parent mengulang dari verifikasi nomor lama */
  onRestart?: () => void;
  /** mode change: endpoint ubah password (merchant / sub admin) */
  updatePassword?: (body: { newPassword: string; waToken: string }) => Promise<unknown>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  // sessionStorage hanya ada di browser: dibaca setelah mount agar hasil render server & client sama
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPending(load(mode)), [mode]);

  const start = useApiMutation(() => startFor(mode, oldToken), {
    successMessage: false,
    onSuccess: ({ data }) => {
      save(mode, data);
      setPending(data);
    },
  });

  // Cek tiap 4 detik apakah user sudah mengirim kode ke bot
  const status = useQuery({
    queryKey: ['wa-verify', pending?.token],
    queryFn: () => authApi.registerStatus(pending!.token),
    select: (res) => res.data,
    enabled: !!pending,
    retry: false,
    refetchInterval: (query) => (query.state.error || query.state.data?.data.status !== 'pending' ? false : 4000),
  });

  useEffect(() => {
    if (status.data?.status !== 'done') return;
    save(mode, null);
    setSession(status.data.token, status.data.user.role);
    router.replace(homePathFor(status.data.user.role));
  }, [status.data, router, mode]);

  const reset = () => {
    save(mode, null);
    setPending(null);
  };

  // Nomor lama terbukti: serahkan tokennya ke langkah berikutnya (ganti nomor)
  const verified = status.data?.status === 'verified';
  useEffect(() => {
    if (!verified || mode !== 'phone-old' || !pending) return;
    save(mode, null);
    onVerified?.(pending.token);
  }, [verified, mode, pending, onVerified]);

  if (!pending) {
    return (
      <div className="space-y-3">
        <Button className="h-11 w-full" onClick={() => start.mutate()} disabled={start.isPending}>
          {start.isPending ? <Loader2 className="animate-spin" /> : <WhatsAppIcon />} {START_LABEL[mode]}
        </Button>
        <p className="text-xs text-muted-foreground">
          Anda akan mengirim satu pesan berisi kode ke WhatsApp kami. Tidak ada kode OTP yang perlu diketik.
        </p>
      </div>
    );
  }

  if (status.data?.status === 'verified' && mode === 'phone-old') return null;
  if (status.data?.status === 'verified' && mode === 'phone-new') {
    return (
      <ConfirmPhone
        token={pending.token}
        phone={status.data.phone}
        onDone={() => {
          reset();
          onVerified?.(pending.token);
        }}
        onRetry={() => {
          reset();
          // Bukti nomor lama sudah terpakai: kembali ke langkah 1. Tanpa nomor lama: langsung buat kode baru
          if (oldToken) onRestart?.();
          else start.mutate();
        }}
      />
    );
  }
  if (status.data?.status === 'verified') {
    return (
      <NewPasswordForm
        submitLabel={mode === 'change' ? 'Ubah Kata Sandi' : 'Simpan & Masuk'}
        submit={async (password) => {
          // Ubah kata sandi saat login: verifikasi WA menggantikan "password saat ini"
          if (mode === 'change') {
            const res = await updatePassword({ waToken: pending.token, newPassword: password });
            reset();
            return res;
          }
          const res = await authApi.resetPassword(pending.token, password);
          save(mode, null);
          setSession(res.data.token, res.data.user.role);
          router.replace(homePathFor(res.data.user.role));
          return res;
        }}
      />
    );
  }

  const failed = status.error?.message ?? (status.data?.status === 'expired' ? 'Kode sudah kedaluwarsa. Silakan ulangi.' : null);

  return (
    <div className="space-y-4">
      {failed ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{failed}</span>
        </div>
      ) : (
        <>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-xs text-muted-foreground">Kode verifikasi</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wider">{pending.code}</p>
          </div>
          <a href={pending.waLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ className: 'h-11 w-full' })}>
            <WhatsAppIcon /> Kirim Kode via WhatsApp
          </a>
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" /> Menunggu pesan Anda masuk...
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Kirim pesan yang sudah terisi tanpa mengubahnya, lalu kembali ke halaman ini. Berlaku sampai{' '}
            {new Date(pending.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.
          </p>
        </>
      )}
      <div className="flex justify-center gap-4 text-sm">
        <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={reset}>
          Ulangi
        </button>
        {failed && (mode === 'register' || mode === 'login' || mode === 'reset') && (
          <Link href={mode === 'register' ? '/login' : '/register'} className="font-medium text-primary underline-offset-4 hover:underline">
            {mode === 'register' ? 'Masuk' : 'Daftar'}
          </Link>
        )}
      </div>
    </div>
  );
}

/** Nomor WA sudah terverifikasi, tinggal isi kata sandi baru (berlaku 15 menit). */
function NewPasswordForm({ submit: save, submitLabel }: { submit: (password: string) => Promise<unknown>; submitLabel: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const error = password && password.length < 8 ? 'Minimal 8 karakter' : confirm && confirm !== password ? 'Kata sandi tidak sama' : null;
  const submit = useApiMutation(() => save(password));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
    >
      <p className="text-sm text-muted-foreground">Nomor WhatsApp terverifikasi. Buat kata sandi baru.</p>
      <FormField label="Kata Sandi Baru" htmlFor="reset-password">
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>
      <FormField label="Ulangi Kata Sandi" htmlFor="reset-confirm" error={error ?? undefined}>
        <Input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </FormField>
      <Button type="submit" className="h-11 w-full" disabled={!!error || !password || password !== confirm || submit.isPending}>
        {submit.isPending ? 'Menyimpan...' : submitLabel}
      </Button>
    </form>
  );
}

/** Nomor baru sudah terverifikasi: tampilkan nomornya, simpan setelah user yakin. */
function ConfirmPhone({ token, phone, onDone, onRetry }: { token: string; phone?: string; onDone: () => void; onRetry: () => void }) {
  const save = useApiMutation(() => authApi.phoneConfirm(token), { invalidate: [['me']], onSuccess: onDone });
  // Gagal simpan (mis. nomor sudah dipakai akun lain): verifikasi ini tidak bisa dipakai lagi, mulai dengan kode baru
  if (save.isError) {
    return (
      <div className="space-y-4">
        <div
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{save.error.message}</span>
        </div>
        <Button className="w-full" onClick={onRetry}>
          <WhatsAppIcon /> Kirim Verifikasi Baru
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Nomor baru terverifikasi: <span className="font-mono font-semibold">{phone ? `+${phone}` : '-'}</span>
      </p>
      <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Menyimpan...' : 'Simpan Nomor Ini'}
      </Button>
    </div>
  );
}
