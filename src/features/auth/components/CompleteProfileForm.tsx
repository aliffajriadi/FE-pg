'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Maksimal 100 karakter'),
    email: z.email('Format email tidak valid'),
    password: z.string().min(8, 'Minimal 8 karakter'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Kata sandi tidak sama' });
type FormValues = z.infer<typeof schema>;

/** Akun baru dari daftar via WhatsApp wajib mengisi ini sebelum memakai dashboard. */
export function CompleteProfileForm({ phone }: { phone?: string | null }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', confirm: '' } });
  const { errors } = form.formState;
  const mutation = useApiMutation(({ name, email, password }: FormValues) => authApi.completeProfile({ name, email, password }), {
    invalidate: [['me']],
  });

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Lengkapi Akun Anda</CardTitle>
        <CardDescription>
          {phone ? `Nomor WhatsApp ${phone} sudah terverifikasi. ` : ''}Isi data berikut untuk mulai memakai dashboard. Email dan kata sandi
          dipakai untuk masuk berikutnya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <FormField label="Nama" htmlFor="cp-name" error={errors.name?.message}>
            <Input id="cp-name" autoComplete="name" {...form.register('name')} />
          </FormField>
          <FormField label="Email" htmlFor="cp-email" error={errors.email?.message}>
            <Input id="cp-email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <FormField label="Kata Sandi" htmlFor="cp-password" error={errors.password?.message}>
            <Input id="cp-password" type="password" autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <FormField label="Ulangi Kata Sandi" htmlFor="cp-confirm" error={errors.confirm?.message}>
            <Input id="cp-confirm" type="password" autoComplete="new-password" {...form.register('confirm')} />
          </FormField>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
