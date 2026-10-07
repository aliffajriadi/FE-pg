'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, SlidersHorizontal, UserPlus } from 'lucide-react';
import { adminApi, type AdminUser } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { requiredNumber } from '@/lib/validations/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';

const USERS_KEY = ['admin-users'];

// ─── Tambah user ─────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof createSchema>>({ resolver: zodResolver(createSchema) });
  const { errors } = form.formState;

  const mutation = useApiMutation(adminApi.createUser, {
    successMessage: 'Merchant baru berhasil ditambahkan',
    invalidate: [USERS_KEY, ['admin-stores']],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus /> Tambah User
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Merchant Baru</DialogTitle>
            <DialogDescription>Toko akan dibuat otomatis untuk merchant ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Nama" htmlFor="name" error={errors.name?.message}>
              <Input id="name" {...form.register('name')} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...form.register('email')} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" {...form.register('password')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Ubah password ───────────────────────────────────────────
const passwordSchema = z.object({ password: z.string().min(6, 'Password minimal 6 karakter') });

export function ChangePasswordDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });

  const mutation = useApiMutation(({ password }: { password: string }) => adminApi.changeUserPassword(user.id, password), {
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <KeyRound /> Password
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password Pengguna</DialogTitle>
            <DialogDescription>
              Akun: <strong className="text-foreground">{user.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Password Baru" htmlFor="new-password" error={form.formState.errors.password?.message}>
              <Input id="new-password" type="password" placeholder="Minimal 6 karakter" {...form.register('password')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Limit API key & webhook ─────────────────────────────────
const limitSchema = z.object({ apiKeyLimit: requiredNumber(), webhookLimit: requiredNumber() });
type LimitForm = z.infer<typeof limitSchema>;

export function UserLimitDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const form = useForm<LimitForm>({
    resolver: zodResolver(limitSchema),
    defaultValues: { apiKeyLimit: user.apiKeyLimit, webhookLimit: user.webhookLimit },
  });
  const { errors } = form.formState;

  const mutation = useApiMutation(
    async (data: LimitForm) => {
      await adminApi.updateApiKeyLimit(user.id, data.apiKeyLimit);
      await adminApi.updateWebhookLimit(user.id, data.webhookLimit);
    },
    { successMessage: 'Limit berhasil diperbarui', invalidate: [USERS_KEY], onSuccess: () => setOpen(false) }
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          form.reset({ apiKeyLimit: user.apiKeyLimit, webhookLimit: user.webhookLimit });
          setOpen(true);
        }}
      >
        <SlidersHorizontal /> Limit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limit API Key &amp; Webhook</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Limit API Key" htmlFor="apiKeyLimit" error={errors.apiKeyLimit?.message}>
                <Input id="apiKeyLimit" type="number" min={0} {...form.register('apiKeyLimit', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Limit Webhook" htmlFor="webhookLimit" error={errors.webhookLimit?.message}>
                <Input id="webhookLimit" type="number" min={0} {...form.register('webhookLimit', { valueAsNumber: true })} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
