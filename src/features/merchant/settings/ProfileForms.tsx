'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useMe } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.email('Format email tidak valid'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
});

function ProfileForm({ name, email }: { name: string; email: string }) {
  const form = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { name, email } });
  const { errors } = form.formState;
  const mutation = useApiMutation(merchantApi.updateProfile, { successMessage: 'Profil diperbarui', invalidate: [['me']] });

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

function PasswordForm() {
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });
  const { errors } = form.formState;
  const mutation = useApiMutation(merchantApi.updatePassword, { onSuccess: () => form.reset() });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <FormField label="Password Saat Ini" htmlFor="pass-current" error={errors.currentPassword?.message}>
        <Input id="pass-current" type="password" autoComplete="current-password" {...form.register('currentPassword')} />
      </FormField>
      <FormField label="Password Baru" htmlFor="pass-new" error={errors.newPassword?.message}>
        <Input id="pass-new" type="password" autoComplete="new-password" {...form.register('newPassword')} />
      </FormField>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Menyimpan...' : 'Ubah Password'}
      </Button>
    </form>
  );
}

export function ProfileCard() {
  const { data: me } = useMe();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Pengguna</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* key: isi ulang form setelah data profil termuat/berubah */}
        {me && <ProfileForm key={`${me.user.name}|${me.user.email}`} name={me.user.name} email={me.user.email} />}
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-semibold">Ubah Password</h3>
          <PasswordForm />
        </div>
      </CardContent>
    </Card>
  );
}
