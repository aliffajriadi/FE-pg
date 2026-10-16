'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, FolderPlus, Info, Loader2, Plus, Send } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { mypgApi } from '@/lib/api/mypg';
import { useApiMutation } from '@/hooks/use-api-mutation';
import type { IntegrationMode } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';
import { CopyField } from '@/components/shared/CopyField';

import { integrationKeysOf, useIntegrationClient } from './integration-client';

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

const nameSchema = z.object({ name: z.string().trim().min(1, 'Nama wajib diisi') });

// ─── Pengajuan proyek ────────────────────────────────────────
const requestSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Maksimal 100 karakter'),
  purpose: z.string().trim().min(20, 'Jelaskan minimal 20 karakter').max(1000, 'Maksimal 1000 karakter'),
});

const PURPOSE_TEMPLATE = `Platform: 
Produk yang dijual: 
Perkiraan transaksi per hari: 
Kegunaan: `;
const NAME_EXAMPLES = ['Bot Telegram Toko', 'Bot WhatsApp Otomatis', 'Website Toko'];
const PROCESS_STEPS = ['Kirim pengajuan', 'Admin meninjau', 'Dapat 1 API Key & 1 Webhook'];

export function RequestProjectDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { name: '', purpose: '' },
  });
  const { errors } = form.formState;
  const purposeLength = (useWatch({ control: form.control, name: 'purpose' }) ?? '').trim().length;
  const mutation = useApiMutation(merchantApi.requestProject, {
    successMessage: 'Pengajuan terkirim, menunggu persetujuan admin',
    invalidate: [['merchant-project-requests']],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus /> Ajukan Proyek
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <DialogHeader className="space-y-3 border-b bg-muted/40 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderPlus className="size-5" />
              </span>
              <div className="space-y-0.5">
                <DialogTitle>Ajukan Proyek Baru</DialogTitle>
                <DialogDescription>Ceritakan singkat untuk apa proyek ini akan dipakai.</DialogDescription>
              </div>
            </div>
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              {PROCESS_STEPS.map((step, i) => (
                <li key={step} className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="leading-tight">{step}</span>
                </li>
              ))}
            </ol>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5 p-6">
            <FormField label="Nama Proyek" htmlFor="project-name" error={errors.name?.message}>
              <Input id="project-name" placeholder="Contoh: Bot Telegram Toko" autoComplete="off" {...form.register('name')} />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {NAME_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => form.setValue('name', example, { shouldValidate: true })}
                    className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Tujuan & Penggunaan" htmlFor="project-purpose" error={errors.purpose?.message}>
              <Textarea
                id="project-purpose"
                rows={6}
                placeholder="Jelaskan untuk apa proyek ini, platform yang dipakai, produk yang dijual, dan perkiraan jumlah transaksi."
                {...form.register('purpose')}
              />
              <div className="flex items-center justify-between gap-3 pt-0.5 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => form.setValue('purpose', PURPOSE_TEMPLATE, { shouldDirty: true })}
                  disabled={purposeLength > 0}
                  className="text-primary hover:underline disabled:pointer-events-none disabled:opacity-40"
                >
                  Pakai template
                </button>
                <span className={purposeLength >= 20 ? 'text-emerald-600' : ''}>{purposeLength}/20 karakter minimal</span>
              </div>
            </FormField>

            <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Setiap proyek mendapat 1 API Key dan 1 Webhook. Status pengajuan bisa dipantau di halaman ini.
            </p>

            <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Send /> Kirim Pengajuan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Proyek langsung (MyPG, tanpa pengajuan) ────────────────
export function CreateProjectDialog() {
  const client = useIntegrationClient();
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema) });
  const mutation = useApiMutation(({ name }: { name: string }) => mypgApi.createProject({ name }), {
    successMessage: 'Proyek dibuat',
    invalidate: integrationKeysOf(client),
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          form.reset({ name: '' });
          setOpen(true);
        }}
      >
        <Plus /> Buat Proyek
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Proyek MyPG</DialogTitle>
            <DialogDescription>Satu proyek untuk tiap aplikasi atau bot. Masing-masing punya API Key dan Webhook sendiri.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Nama Proyek" htmlFor="mypg-project-name" error={form.formState.errors.name?.message}>
              <Input id="mypg-project-name" placeholder="Contoh: Bot Telegram Toko" autoComplete="off" {...form.register('name')} />
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
  const client = useIntegrationClient();
  const [open, setOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const form = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema) });

  const mutation = useApiMutation(({ name }: { name: string }) => client.api.createApiKey({ name, projectId, mode }), {
    successMessage: sandbox ? 'API Key sandbox berhasil dibuat' : 'API Key berhasil dibuat',
    invalidate: integrationKeysOf(client),
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
                  : `Gunakan sebagai header x-api-key saat memanggil ${client.apiPath}.`
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
  const client = useIntegrationClient();
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const form = useForm<z.infer<typeof webhookSchema>>({ resolver: zodResolver(webhookSchema) });
  const { errors } = form.formState;

  const mutation = useApiMutation((data: z.infer<typeof webhookSchema>) => client.api.createWebhook({ ...data, projectId, mode }), {
    successMessage: sandbox ? 'Webhook sandbox berhasil ditambahkan' : 'Webhook berhasil ditambahkan',
    invalidate: integrationKeysOf(client),
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
  const client = useIntegrationClient();
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const mutation = useApiMutation(() => client.api.regenerateWebhookSecret(webhookId), {
    successMessage: 'Secret key baru dibuat',
    invalidate: integrationKeysOf(client),
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
