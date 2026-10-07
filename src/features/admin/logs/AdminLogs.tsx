'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity, Loader2, Plus } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { assetUrl } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { FormField } from '@/components/shared/FormField';
import { PhotoInput } from '@/components/shared/PhotoInput';
import { SimpleSelect } from '@/components/shared/SimpleSelect';

const LOGS_KEY = ['admin-logs'];
const LIMIT = 20;
const NONE = 'NONE';

const TARGET_OPTIONS = [
  { value: NONE, label: '-- Tidak ada --' },
  { value: 'WITHDRAWAL', label: 'Penarikan' },
  { value: 'STORE', label: 'Toko' },
  { value: 'USER', label: 'Pengguna' },
];

const logSchema = z.object({
  action: z.string().trim().min(1, 'Judul catatan wajib diisi'),
  targetType: z.string(),
  targetId: z.string().optional(),
  note: z.string().optional(),
});
type LogForm = z.infer<typeof logSchema>;

function AddLogDialog() {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const form = useForm<LogForm>({ resolver: zodResolver(logSchema), defaultValues: { targetType: NONE } });

  const mutation = useApiMutation(
    (data: LogForm) => {
      const body = new FormData();
      body.append('action', data.action);
      if (data.targetType !== NONE) body.append('targetType', data.targetType);
      if (data.targetId) body.append('targetId', data.targetId);
      if (data.note) body.append('note', data.note);
      if (photo) body.append('photo', photo);
      return adminApi.createLog(body);
    },
    {
      successMessage: 'Catatan berhasil disimpan',
      invalidate: [LOGS_KEY],
      onSuccess: () => {
        setOpen(false);
        setPhoto(null);
        form.reset();
      },
    }
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Tambah Catatan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Catatan Aktivitas</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Aksi / Judul Catatan *" htmlFor="log-action" error={form.formState.errors.action?.message}>
              <Input id="log-action" placeholder="Contoh: Transfer manual ke merchant X" {...form.register('action')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tipe Target (Opsional)" htmlFor="log-target-type">
                <Controller
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <SimpleSelect
                      id="log-target-type"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v || NONE)}
                      options={TARGET_OPTIONS}
                    />
                  )}
                />
              </FormField>
              <FormField label="ID Target (Opsional)" htmlFor="log-target-id">
                <Input id="log-target-id" type="number" placeholder="ID toko/penarikan/dll" {...form.register('targetId')} />
              </FormField>
            </div>
            <FormField label="Catatan Detail" htmlFor="log-note">
              <Textarea id="log-note" rows={3} placeholder="Detail catatan admin..." {...form.register('note')} />
            </FormField>
            <FormField label="Foto Bukti (Opsional)">
              <PhotoInput id="log-photo" file={photo} onChange={setPhoto} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan Catatan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: [...LOGS_KEY, page],
    queryFn: () => adminApi.getLogs({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const logs = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / LIMIT));

  return (
    <>
      <PageHeader title="Log Aktivitas Admin" description="Jejak semua aksi yang dilakukan admin.">
        <AddLogDialog />
      </PageHeader>

      <Card>
        <CardContent>
          {isLoading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat log...
            </p>
          ) : error ? (
            <p className="py-10 text-center text-destructive">Gagal memuat log: {error.message}</p>
          ) : !logs.length ? (
            <p className="py-10 text-center text-muted-foreground">Belum ada log aktivitas</p>
          ) : (
            <ul className="divide-y">
              {logs.map((log) => (
                <li key={log.id} className="flex gap-3 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Activity className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      oleh <strong>{log.admin?.name ?? 'Admin'}</strong>
                      {log.targetType && ` • ${log.targetType} #${log.targetId ?? ''}`} • {formatDate(log.createdAt)}
                    </p>
                    {log.note && <p className="rounded-md bg-muted px-3 py-2 text-sm">{log.note}</p>}
                    {log.photoUrl && (
                      <a href={assetUrl(log.photoUrl)} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetUrl(log.photoUrl)} alt="Bukti foto" className="mt-1 max-h-32 rounded-md border" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}
