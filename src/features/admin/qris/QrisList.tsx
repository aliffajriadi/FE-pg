'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { FormField } from '@/components/shared/FormField';

const QRIS_KEY = ['admin-manual-qris'];

const qrisSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  qrisString: z.string().trim().min(1, 'String QRIS wajib diisi'),
});

function CreateQrisDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof qrisSchema>>({ resolver: zodResolver(qrisSchema) });
  const { errors } = form.formState;
  const qrisString = useWatch({ control: form.control, name: 'qrisString' }) ?? '';

  const mutation = useApiMutation(adminApi.createManualQris, {
    invalidate: [QRIS_KEY, ['admin-settings']],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Tambah QRIS
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah QRIS Manual</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Nama / Label" htmlFor="qris-name" error={errors.name?.message}>
              <Input id="qris-name" placeholder="Misal: QRIS Dana Utama" {...form.register('name')} />
            </FormField>
            <FormField label="String Statis QRIS" htmlFor="qris-string" error={errors.qrisString?.message}>
              <Textarea
                id="qris-string"
                rows={5}
                className="font-mono text-xs"
                placeholder="Tempel string QRIS lengkap (diawali 000201010211...)"
                {...form.register('qrisString')}
              />
            </FormField>
            {qrisString.trim() && !qrisString.trim().startsWith('00020101') && (
              <p className="rounded-md bg-amber-500/15 p-2 text-xs text-amber-700 dark:text-amber-400">
                Peringatan: string QRIS biasanya diawali dengan &quot;00020101&quot;. Pastikan string sudah benar.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan QRIS'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function QrisList() {
  const { data, isLoading, error } = useQuery({
    queryKey: QRIS_KEY,
    queryFn: adminApi.getManualQris,
    select: (res) => res.data,
  });
  const remove = useApiMutation(adminApi.deleteManualQris, { invalidate: [QRIS_KEY, ['admin-settings']] });

  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Daftar QRIS Manual"
        description="String QRIS statis yang dapat dipilih untuk gateway manual (DANA, ShopeePay, GoPay)."
      >
        <CreateQrisDialog />
      </PageHeader>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nama / Label</TableHead>
              <TableHead>String QRIS</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={5} isLoading={isLoading} error={error} isEmpty={!list.length} emptyText="Belum ada QRIS yang ditambahkan" />
            {list.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="text-muted-foreground">#{q.id}</TableCell>
                <TableCell className="font-medium">{q.name}</TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground" title={q.qrisString}>
                  {q.qrisString}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(q.createdAt, false)}</TableCell>
                <TableCell className="text-right">
                  <ConfirmAction
                    destructive
                    size="icon-sm"
                    aria-label="Hapus QRIS"
                    title={`Hapus QRIS "${q.name}"?`}
                    description="Toko yang sudah memakai QRIS ini tidak terpengaruh, hanya opsinya yang hilang dari daftar."
                    confirmLabel="Hapus"
                    onConfirm={() => remove.mutateAsync(q.id)}
                  >
                    <Trash2 />
                  </ConfirmAction>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
