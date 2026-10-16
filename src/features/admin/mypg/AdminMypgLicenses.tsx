'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, type MypgLicense, type MypgLicenseStatus } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { SearchForm } from '@/components/shared/SearchForm';
import { Pagination } from '@/components/shared/Pagination';
import { TableState } from '@/components/shared/TableState';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { CopyButton } from '@/components/shared/CopyButton';
import { ConfirmAction } from '@/components/shared/ConfirmAction';

const KEY = ['admin-mypg-licenses'];
const PRESETS = [
  { days: 7, label: '7 hari' },
  { days: 30, label: '30 hari' },
  { days: 90, label: '3 bulan' },
  { days: 180, label: '6 bulan' },
  { days: 365, label: '1 tahun' },
];
const STATUS: Record<MypgLicenseStatus, { label: string; tone: 'success' | 'info' | 'danger' }> = {
  UNUSED: { label: 'Belum dipakai', tone: 'success' },
  REDEEMED: { label: 'Sudah dipakai', tone: 'info' },
  REVOKED: { label: 'Dinonaktifkan', tone: 'danger' },
};

const schema = z.object({
  durationDays: z.number({ error: 'Wajib diisi' }).int('Bilangan bulat').min(1, 'Minimal 1 hari').max(3650, 'Maksimal 3650 hari'),
  count: z.number({ error: 'Wajib diisi' }).int('Bilangan bulat').min(1, 'Minimal 1').max(100, 'Maksimal 100'),
  note: z.string().max(200, 'Maksimal 200 karakter').optional(),
});
type FormValues = z.infer<typeof schema>;

function CopyAllButton({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(codes.join('\n'));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error('Gagal menyalin, salin secara manual');
        }
      }}
    >
      {copied ? <Check /> : <Copy />} Salin Semua
    </Button>
  );
}

function GenerateDialog() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<MypgLicense[] | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { durationDays: 30, count: 1, note: '' } });
  const { errors } = form.formState;
  const days = useWatch({ control: form.control, name: 'durationDays' });

  const mutation = useApiMutation(
    (data: FormValues) => adminApi.generateMypgLicenses({ ...data, note: data.note || undefined }),
    { invalidate: [KEY], onSuccess: (res) => setCreated(res.data) }
  );

  return (
    <>
      <Button
        onClick={() => {
          form.reset({ durationDays: 30, count: 1, note: '' });
          setCreated(null);
          setOpen(true);
        }}
      >
        <KeyRound /> Buat Kode Lisensi
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{created ? `${created.length} kode lisensi dibuat` : 'Buat Kode Lisensi MyPG'}</DialogTitle>
            <DialogDescription>
              {created
                ? `Masing-masing menambah ${created[0]?.durationDays} hari masa aktif dan hanya bisa dipakai sekali.`
                : 'Kirim kode ke merchant. Merchant memasukkannya di menu Billing Panel MyPG.'}
            </DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="space-y-4">
              <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
                {created.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 px-3 py-2">
                    <code className="flex-1 font-mono text-sm">{l.code}</code>
                    <CopyButton value={l.code} label="Salin kode" />
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <CopyAllButton codes={created.map((l) => l.code)} />
                <Button onClick={() => setOpen(false)}>Selesai</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField label="Masa Aktif (hari)" htmlFor="lic-days" error={errors.durationDays?.message}>
                <div className="flex flex-wrap gap-2 pb-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => form.setValue('durationDays', p.days, { shouldValidate: true })}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted',
                        days === p.days && 'border-primary bg-primary/10 text-primary'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input id="lic-days" type="number" min={1} max={3650} {...form.register('durationDays', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Jumlah Kode" htmlFor="lic-count" error={errors.count?.message} hint="Maksimal 100 kode sekali buat.">
                <Input id="lic-count" type="number" min={1} max={100} {...form.register('count', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Catatan (opsional)" htmlFor="lic-note" error={errors.note?.message} hint="Mis. nama pembeli atau nomor order. Hanya terlihat oleh admin.">
                <Input id="lic-note" {...form.register('note')} />
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Membuat...' : 'Buat Kode'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminMypgLicenses() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: [...KEY, { page, search, status }],
    queryFn: () => adminApi.getMypgLicenses({ page, search, status: (status || undefined) as MypgLicenseStatus | undefined }),
    placeholderData: keepPreviousData,
  });
  const revoke = useApiMutation(adminApi.revokeMypgLicense, { invalidate: [KEY] });
  const rows = data?.data ?? [];
  const counts = data?.counts ?? {};

  const tabs = [
    { value: '', label: 'Semua' },
    ...(Object.keys(STATUS) as MypgLicenseStatus[]).map((s) => ({ value: s, label: `${STATUS[s].label} (${counts[s] ?? 0})` })),
  ];

  return (
    <>
      <PageHeader title="Lisensi MyPG" description="Buat kode lisensi untuk menambah masa aktif MyPG merchant, dan pantau pemakaiannya.">
        <GenerateDialog />
      </PageHeader>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs
          tabs={tabs}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <SearchForm
          placeholder="Cari kode, catatan, toko..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dipakai Oleh</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada kode lisensi" />
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="font-mono text-xs">{l.code}</code>
                    {l.status === 'UNUSED' && <CopyButton value={l.code} label="Salin kode" />}
                  </div>
                </TableCell>
                <TableCell>{l.durationDays} hari</TableCell>
                <TableCell>
                  <ToneBadge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</ToneBadge>
                </TableCell>
                <TableCell>
                  {l.store ? (
                    <>
                      <p className="text-sm font-medium">{l.store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.redeemedAt && formatDate(l.redeemedAt)}
                        {l.activeUntil && ` · aktif s.d. ${formatDate(l.activeUntil, false)}`}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-48 truncate text-sm text-muted-foreground" title={l.note ?? undefined}>
                  {l.note ?? '-'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {formatDate(l.createdAt)}
                  {l.createdBy && <p className="text-xs">oleh {l.createdBy.name}</p>}
                </TableCell>
                <TableCell className="text-right">
                  {l.status === 'UNUSED' && (
                    <ConfirmAction
                      destructive
                      size="xs"
                      title="Nonaktifkan kode ini?"
                      description={`${l.code} tidak bisa ditukarkan lagi. Kode yang sudah dipakai tidak terpengaruh.`}
                      confirmLabel="Nonaktifkan"
                      onConfirm={() => revoke.mutateAsync(l.id)}
                    >
                      Nonaktifkan
                    </ConfirmAction>
                  )}
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
