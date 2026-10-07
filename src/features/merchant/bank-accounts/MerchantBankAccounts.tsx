'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Plus, Trash2 } from 'lucide-react';
import { merchantApi } from '@/lib/api/merchant';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { FormField } from '@/components/shared/FormField';

const BANKS_KEY = ['merchant-bank-accounts'];

const bankSchema = z.object({
  bankName: z.string().trim().min(1, 'Nama bank wajib diisi'),
  accountNumber: z.string().trim().min(1, 'Nomor rekening wajib diisi'),
  accountHolder: z.string().trim().min(1, 'Nama pemilik wajib diisi'),
});
type BankForm = z.infer<typeof bankSchema>;

function AddBankDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<BankForm>({ resolver: zodResolver(bankSchema) });
  const { errors } = form.formState;

  const mutation = useApiMutation(merchantApi.createBankAccount, {
    successMessage: 'Rekening ditambahkan dan menunggu persetujuan admin',
    invalidate: [BANKS_KEY],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Tambah Rekening
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Rekening Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Nama Bank / E-Wallet" htmlFor="bank-name" error={errors.bankName?.message}>
              <Input id="bank-name" placeholder="BCA, Mandiri, DANA, dll" {...form.register('bankName')} />
            </FormField>
            <FormField label="Nomor Rekening / No. HP" htmlFor="bank-number" error={errors.accountNumber?.message}>
              <Input id="bank-number" inputMode="numeric" {...form.register('accountNumber')} />
            </FormField>
            <FormField label="Atas Nama Pemilik" htmlFor="bank-holder" error={errors.accountHolder?.message}>
              <Input id="bank-holder" {...form.register('accountHolder')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan Rekening'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MerchantBankAccounts() {
  const { data, isLoading, error } = useQuery({
    queryKey: BANKS_KEY,
    queryFn: merchantApi.getBankAccounts,
    select: (res) => res.data,
  });
  const remove = useApiMutation(merchantApi.deleteBankAccount, { invalidate: [BANKS_KEY] });
  const accounts = data ?? [];

  return (
    <>
      <PageHeader title="Rekening Saya" description="Rekening tujuan untuk penarikan saldo.">
        <AddBankDialog />
      </PageHeader>

      <p className="flex gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="size-4 shrink-0" />
        Rekening yang ditambahkan harus disetujui admin sebelum bisa dipakai untuk penarikan saldo.
      </p>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Bank</TableHead>
              <TableHead>Nomor Rekening</TableHead>
              <TableHead>Atas Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={6} isLoading={isLoading} error={error} isEmpty={!accounts.length} emptyText="Belum ada rekening yang ditambahkan" />
            {accounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium">{acc.bankName}</TableCell>
                <TableCell>{acc.accountNumber}</TableCell>
                <TableCell>{acc.accountHolder}</TableCell>
                <TableCell>
                  <StatusBadge status={acc.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(acc.createdAt, false)}</TableCell>
                <TableCell className="text-right">
                  {acc.status === 'APPROVED' ? (
                    <span className="text-xs text-muted-foreground italic">Hubungi admin untuk menghapus</span>
                  ) : (
                    <ConfirmAction
                      destructive
                      title="Hapus rekening ini?"
                      description={`${acc.bankName} - ${acc.accountNumber}`}
                      confirmLabel="Hapus"
                      onConfirm={() => remove.mutateAsync(acc.id)}
                    >
                      <Trash2 /> Hapus
                    </ConfirmAction>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
