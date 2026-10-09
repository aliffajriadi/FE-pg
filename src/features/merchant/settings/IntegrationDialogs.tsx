'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Plus } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import type { IntegrationMode } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { CopyField } from '@/components/shared/CopyField';

export const INTEGRATION_KEYS = [['merchant-projects'], ['merchant-webhooks'], ['merchant-api-keys']];

type ButtonProps = { label: string; size?: 'sm' | 'default'; variant?: 'default' | 'outline'; mode?: IntegrationMode };

/** Hasil pembuatan key/secret yang hanya ditampilkan sekali. */
function SecretResult({ title, label, value, hint, onDone }: { title: string; label: string; value: string; hint?: string; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-4" /> {title}
      </p>
      <FormField label={label} hint={hint}>
        <CopyField value={value} />
      </FormField>
      <DialogFooter>
        <Button onClick={onDone}>Selesai</Button>
      </DialogFooter>
    </div>
  );
}

// ─── Proyek ──────────────────────────────────────────────────
const nameSchema = z.object({ name: z.string().trim().min(1, 'Nama wajib diisi') });

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema) });
  const mutation = useApiMutation(({ name }: { name: string }) => merchantApi.createProject(name), {
    successMessage: 'Proyek berhasil dibuat',
    invalidate: INTEGRATION_KEYS,
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus /> Proyek Baru
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Proyek Baru</DialogTitle>
            <DialogDescription>Setelah proyek dibuat, tambahkan API Key dan Webhook khusus untuk proyek ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Nama Proyek" htmlFor="project-name" error={form.formState.errors.name?.message}>
              <Input id="project-name" placeholder="Contoh: App Kasir, Website Toko" {...form.register('name')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Membuat...' : 'Buat Proyek'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── API key ─────────────────────────────────────────────────
export function CreateApiKeyDialog({ projectId, projectName, label, size = 'sm', variant = 'default', mode = 'LIVE' }: ButtonProps & { projectId?: number; projectName?: string }) {
  const sandbox = mode === 'SANDBOX';
  const [open, setOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const form = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema) });

  const mutation = useApiMutation(({ name }: { name: string }) => merchantApi.createApiKey({ name, projectId, mode }), {
    successMessage: sandbox ? 'API Key sandbox berhasil dibuat' : 'API Key berhasil dibuat',
    invalidate: INTEGRATION_KEYS,
    onSuccess: (res) => setCreatedKey(res.data.key),
  });

  const openDialog = () => {
    form.reset({ name: '' });
    setCreatedKey(null);
    setOpen(true);
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={openDialog}>
        <Plus /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {projectName ? `Tambah API Key ${sandbox ? 'sandbox ' : ''}ke "${projectName}"` : `Buat API Key ${sandbox ? 'Sandbox' : 'Global'}`}
            </DialogTitle>
          </DialogHeader>
          {createdKey ? (
            <SecretResult
              title={sandbox ? 'API Key sandbox berhasil dibuat' : 'API Key berhasil dibuat'}
              label="API Key"
              value={createdKey}
              hint={
                sandbox
                  ? 'Gunakan sebagai header x-api-key. Hanya untuk uji coba: tidak ada uang yang berpindah.'
                  : 'Gunakan sebagai header x-api-key saat memanggil API.'
              }
              onDone={() => setOpen(false)}
            />
          ) : (
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField label="Label API Key" htmlFor="key-name" error={form.formState.errors.name?.message}>
                <Input id="key-name" placeholder={sandbox ? 'Contoh: Key Uji Coba' : 'Contoh: Key Produksi'} {...form.register('name')} />
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Membuat...' : 'Generate API Key'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Webhook ─────────────────────────────────────────────────
const webhookSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  url: z.url('URL tidak valid'),
});

export function CreateWebhookDialog({ projectId, projectName, label, size = 'sm', variant = 'default', mode = 'LIVE' }: ButtonProps & { projectId?: number; projectName?: string }) {
  const sandbox = mode === 'SANDBOX';
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const form = useForm<z.infer<typeof webhookSchema>>({ resolver: zodResolver(webhookSchema) });
  const { errors } = form.formState;

  const mutation = useApiMutation((data: z.infer<typeof webhookSchema>) => merchantApi.createWebhook({ ...data, projectId, mode }), {
    successMessage: sandbox ? 'Webhook sandbox berhasil ditambahkan' : 'Webhook berhasil ditambahkan',
    invalidate: INTEGRATION_KEYS,
    onSuccess: (res) => setSecret(res.data.secret),
  });

  const openDialog = () => {
    form.reset({ name: '', url: '' });
    setSecret(null);
    setOpen(true);
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={openDialog}>
        <Plus /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {projectName ? `Tambah Webhook ${sandbox ? 'sandbox ' : ''}ke "${projectName}"` : `Tambah Webhook ${sandbox ? 'Sandbox' : 'Global'}`}
            </DialogTitle>
          </DialogHeader>
          {secret ? (
            <SecretResult
              title="Webhook berhasil dibuat"
              label="Secret Key"
              value={secret}
              hint="Dipakai untuk verifikasi header X-Webhook-Signature. Simpan baik-baik."
              onDone={() => setOpen(false)}
            />
          ) : (
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField label="Nama / Label" htmlFor="wh-name" error={errors.name?.message}>
                <Input id="wh-name" placeholder="Contoh: Server Produksi" {...form.register('name')} />
              </FormField>
              <FormField
                label="URL Endpoint"
                htmlFor="wh-url"
                error={errors.url?.message}
                hint={
                  sandbox
                    ? 'Menerima event uji coba saja (ditandai sandbox: true). Server kami harus bisa menjangkau URL ini, untuk tes lokal pakai tunnel seperti ngrok.'
                    : 'Sistem akan mengirim POST ke URL ini saat ada pembayaran.'
                }
              >
                <Input id="wh-url" type="url" placeholder="https://situs-anda.com/webhook" {...form.register('url')} />
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Menyimpan...' : 'Simpan Webhook'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Regenerate secret: konfirmasi lalu tampilkan secret baru. */
export function RegenerateSecretDialog({ webhookId }: { webhookId: number }) {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const mutation = useApiMutation(() => merchantApi.regenerateWebhookSecret(webhookId), {
    successMessage: 'Secret key baru dibuat',
    invalidate: INTEGRATION_KEYS,
    onSuccess: (res) => setSecret(res.data.secret),
  });

  return (
    <>
      <Button
        variant="outline"
        size="xs"
        onClick={() => {
          setSecret(null);
          setOpen(true);
        }}
      >
        Regen Secret
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Secret Key</DialogTitle>
          </DialogHeader>
          {secret ? (
            <SecretResult
              title="Secret lama sudah tidak berlaku"
              label="Secret Key Baru"
              value={secret}
              hint="Perbarui konfigurasi aplikasi Anda dengan secret ini."
              onDone={() => setOpen(false)}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Aplikasi yang masih memakai secret lama harus diperbarui agar verifikasi signature tetap berhasil.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                  {mutation.isPending ? 'Memproses...' : 'Ya, buat secret baru'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
