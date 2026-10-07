'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { merchantSupportApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Dalam Proses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'CLOSED', label: 'Ditutup' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Rendah' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Tinggi' },
  { value: 'URGENT', label: 'Mendesak' },
];

const ticketSchema = z.object({
  subject: z.string().trim().min(1, 'Subjek wajib diisi').max(200, 'Maksimal 200 karakter'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  message: z.string().trim().min(1, 'Deskripsi kendala wajib diisi'),
  attachmentUrl: z.union([z.literal(''), z.url('Link tidak valid')]),
});
type TicketForm = z.infer<typeof ticketSchema>;

function CreateTicketDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: '', priority: 'NORMAL', message: '', attachmentUrl: '' },
  });
  const { errors } = form.formState;

  const mutation = useApiMutation(
    (data: TicketForm) => merchantSupportApi.createTicket({ ...data, attachmentUrl: data.attachmentUrl || undefined }),
    {
      successMessage: 'Tiket berhasil dikirim',
      invalidate: [['merchant-tickets']],
      onSuccess: (res) => router.push(`/dashboard/support/${res.data.id}`),
    }
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Buat Tiket Baru
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Tiket Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Subjek *" htmlFor="ticket-subject" error={errors.subject?.message}>
              <Input id="ticket-subject" placeholder="Singkat dan jelas..." {...form.register('subject')} />
            </FormField>
            <FormField label="Prioritas" htmlFor="ticket-priority">
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <SimpleSelect id="ticket-priority" value={field.value} onValueChange={field.onChange} options={PRIORITY_OPTIONS} />
                )}
              />
            </FormField>
            <FormField label="Deskripsi Kendala *" htmlFor="ticket-message" error={errors.message?.message}>
              <Textarea id="ticket-message" rows={5} placeholder="Jelaskan kendala Anda secara detail..." {...form.register('message')} />
            </FormField>
            <FormField
              label="Link Referensi (Opsional)"
              htmlFor="ticket-url"
              error={errors.attachmentUrl?.message}
              hint="Tempel link Google Drive, Imgur, dsb jika ada bukti pendukung."
            >
              <Input id="ticket-url" type="url" placeholder="https://..." {...form.register('attachmentUrl')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Mengirim...' : 'Kirim Tiket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MerchantTickets() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant-tickets', { page, status }],
    queryFn: () => merchantSupportApi.getTickets({ page, status }),
    placeholderData: keepPreviousData,
  });
  const tickets = data?.data ?? [];

  return (
    <>
      <PageHeader title="Bantuan & Support" description="Kirim kendala Anda ke tim admin.">
        <CreateTicketDialog />
      </PageHeader>

      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as string);
          setPage(1);
        }}
      >
        <TabsList className="max-w-full overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Subjek</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead>Pesan</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState
              colSpan={7}
              isLoading={isLoading}
              error={error}
              isEmpty={!tickets.length}
              emptyText='Belum ada tiket. Klik "Buat Tiket Baru" untuk mengirim kendala.'
            />
            {tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground">#{t.id}</TableCell>
                <TableCell className="max-w-64 truncate font-medium" title={t.subject}>
                  {t.subject}
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.priority} />
                </TableCell>
                <TableCell className="text-muted-foreground">{t._count?.messages ?? 0}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(t.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/support/${t.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Lihat
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}
