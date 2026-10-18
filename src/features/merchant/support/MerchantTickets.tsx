'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { merchantSupportApi } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { Pagination } from '@/components/shared/Pagination';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { TicketList } from '@/features/support/TicketList';
import { MAX_TICKET_IMAGE_MB, TICKET_STATUS_TABS, validateTicketImage } from '@/features/support/utils';
import { PhotoInput } from '@/components/shared/PhotoInput';

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
});
type TicketForm = z.infer<typeof ticketSchema>;

function CreateTicketDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string>();
  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: '', priority: 'NORMAL', message: '' },
  });
  const { errors } = form.formState;

  const mutation = useApiMutation((data: TicketForm) => merchantSupportApi.createTicket({ ...data, image }), {
    successMessage: 'Tiket berhasil dikirim',
    invalidate: [['merchant-tickets']],
    onSuccess: (res) => router.push(`/dashboard/support/${res.data.id}`),
  });

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
            <FormField label="Gambar Bukti (Opsional)" htmlFor="ticket-image" error={imageError}>
              <PhotoInput
                id="ticket-image"
                file={image}
                onChange={(file) => {
                  const invalid = file && validateTicketImage(file);
                  setImageError(invalid || undefined);
                  setImage(invalid ? null : file);
                }}
                hint={`Klik untuk pilih screenshot (maks ${MAX_TICKET_IMAGE_MB}MB)`}
              />
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

      <StatusTabs
        tabs={TICKET_STATUS_TABS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <TicketList
        tickets={tickets}
        viewer="MERCHANT"
        hrefFor={(t) => `/dashboard/support/${t.id}`}
        isLoading={isLoading}
        error={error}
        empty={
          status ? (
            'Tidak ada tiket dengan status ini.'
          ) : (
            <>
              <p className="font-medium text-foreground">Belum ada tiket</p>
              <p>Ada kendala? Klik &quot;Buat Tiket Baru&quot; dan tim kami akan membantu.</p>
            </>
          )
        }
      />

      <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
    </>
  );
}
