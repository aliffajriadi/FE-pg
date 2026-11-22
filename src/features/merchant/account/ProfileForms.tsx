'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound, UserRound } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useMe } from '@/features/auth/hooks';
import RegisterWa from '@/features/auth/components/RegisterWa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.email('Format email tidak valid'),
});

const passwordSchema = (minLength: number) =>
  z.object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string().min(minLength, `Password baru minimal ${minLength} karakter`),
  });

/** Endpoint simpan profil & password. Default: merchant; sub admin memakai endpoint-nya sendiri. */
export interface AccountApi {
  updateProfile: (body: { name: string; email: string }) => Promise<unknown>;
  /** waToken (verifikasi WhatsApp) menggantikan currentPassword untuk akun bernomor WA */
  updatePassword: (body: { currentPassword?: string; newPassword: string; waToken?: string }) => Promise<unknown>;
}

function ProfileForm({ name, email, api }: { name: string; email: string; api: AccountApi }) {
  const form = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { name, email } });
  const { errors } = form.formState;
  const mutation = useApiMutation(api.updateProfile, { successMessage: 'Profil diperbarui', invalidate: [['me']] });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <FormField label="Nama Lengkap" htmlFor="profile-name" error={errors.name?.message}>
        <Input id="profile-name" {...form.register('name')} />
      </FormField>
      <FormField label="Email" htmlFor="profile-email" error={errors.email?.message}>
        <Input id="profile-email" type="email" {...form.register('email')} />
      </FormField>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
      </Button>
    </form>
  );
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-9" />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-1.5 -translate-y-1/2"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}

function PasswordForm({ api, minLength }: { api: AccountApi; minLength: number }) {
  const form = useForm<z.infer<ReturnType<typeof passwordSchema>>>({
    resolver: zodResolver(passwordSchema(minLength)),
    defaultValues: { currentPassword: '', newPassword: '' },
  });
  const { errors } = form.formState;
  const mutation = useApiMutation(api.updatePassword, { onSuccess: () => form.reset() });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <FormField label="Password Saat Ini" htmlFor="pass-current" error={errors.currentPassword?.message}>
        <PasswordInput id="pass-current" autoComplete="current-password" {...form.register('currentPassword')} />
      </FormField>
      <FormField label="Password Baru" htmlFor="pass-new" error={errors.newPassword?.message}>
        <PasswordInput id="pass-new" autoComplete="new-password" {...form.register('newPassword')} />
      </FormField>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Menyimpan...' : 'Ubah Password'}
      </Button>
    </form>
  );
}

export function ProfileCard({ api = merchantApi }: { api?: AccountApi }) {
  const { data: me } = useMe();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4 text-primary" /> Profil Pengguna
        </CardTitle>
        <CardDescription>Nama dan email yang dipakai untuk login dan notifikasi.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* key: isi ulang form setelah data profil termuat/berubah */}
        {me && <ProfileForm key={`${me.user.name}|${me.user.email}`} name={me.user.name} email={me.user.email} api={api} />}
      </CardContent>
    </Card>
  );
}

export function PasswordCard({ api = merchantApi, minLength = 6 }: { api?: AccountApi; minLength?: number }) {
  // Akun bernomor WhatsApp wajib verifikasi WA untuk ubah password (hanya merchant yang punya nomor)
  const { data: me } = useMe();
  const viaWhatsApp = !!me?.user.phone;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" /> Ubah Password
        </CardTitle>
        <CardDescription>
          {viaWhatsApp
            ? 'Verifikasi dulu lewat WhatsApp akun Anda, lalu buat password baru (minimal 8 karakter).'
            : `Gunakan minimal ${minLength} karakter. Jangan bagikan password ke siapa pun.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {viaWhatsApp ? <RegisterWa mode="change" updatePassword={api.updatePassword} /> : <PasswordForm api={api} minLength={minLength} />}
      </CardContent>
    </Card>
  );
}

/** Tambah / ganti nomor WhatsApp merchant: nomor lama dibuktikan dulu (bila ada), lalu kirim kode dari nomor baru. */
export function WhatsAppCard() {
  const { data: me } = useMe();
  const phone = me?.user.phone;
  const [editing, setEditing] = useState(false);
  const [oldToken, setOldToken] = useState<string | null>(null);
  const close = () => {
    setEditing(false);
    setOldToken(null);
  };
  const needOld = !!phone && !oldToken;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WhatsAppIcon className="size-4 text-primary" /> Nomor WhatsApp
        </CardTitle>
        <CardDescription>
          {phone
            ? `Terhubung: +${phone}. Dipakai untuk masuk cepat, lupa password, dan verifikasi.`
            : 'Belum ada. Tambahkan untuk masuk cepat dan lupa password via WhatsApp.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            {phone ? 'Ganti Nomor' : 'Tambah Nomor'}
          </Button>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {needOld
                ? 'Langkah 1 dari 2: kirim kode dari nomor lama untuk membuktikan ini Anda.'
                : `${phone ? 'Langkah 2 dari 2: ' : ''}kirim kode dari nomor WhatsApp BARU yang ingin dipakai.`}
            </p>
            {needOld ? (
              <RegisterWa mode="phone-old" onVerified={setOldToken} />
            ) : (
              <RegisterWa mode="phone-new" oldToken={oldToken ?? undefined} onVerified={close} onRestart={() => setOldToken(null)} />
            )}
            <Button variant="ghost" size="sm" onClick={close}>
              Batal
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
