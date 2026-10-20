'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Copy, KeyRound, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, type MypgLicense, type MypgLicenseStatus } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
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
const AMOUNT_PRESETS = [
  { amount: 1_000_000, label: 'Rp1 jt' },
  { amount: 5_000_000, label: 'Rp5 jt' },
  { amount: 10_000_000, label: 'Rp10 jt' },
  { amount: 50_000_000, label: 'Rp50 jt' },
  { amount: null, label: 'Tanpa batas' },
];
const STATUS: Record<MypgLicenseStatus, { label: string; tone: 'success' | 'info' | 'danger' }> = {
  UNUSED: { label: 'Belum dipakai', tone: 'success' },
  REDEEMED: { label: 'Sudah dipakai', tone: 'info' },
  REVOKED: { label: 'Dinonaktifkan', tone: 'danger' },
};

const schema = z.object({
  durationDays: z.number({ error: 'Wajib diisi' }).int('Bilangan bulat').min(1, 'Minimal 1 hari').max(3650, 'Maksimal 3650 hari'),
  maxAmount: z.preprocess(
    (v) => (v === '' || v === null || Number.isNaN(v) ? null : v),
    z.number({ error: 'Harus berupa angka' }).int('Bilangan bulat').min(1, 'Minimal Rp1').nullable()
  ),
  count: z.number({ error: 'Wajib diisi' }).int('Bilangan bulat').min(1, 'Minimal 1').max(100, 'Maksimal 100'),
  note: z.string().max(200, 'Maksimal 200 karakter').optional(),
});
type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const editSchema = schema.pick({ durationDays: true, maxAmount: true, note: true });
type EditInput = z.input<typeof editSchema>;
type EditOutput = z.output<typeof editSchema>;

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
  const form = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema), defaultValues: { durationDays: 30, maxAmount: 1_000_000, count: 1, note: '' } });
  const { errors } = form.formState;
  const days = useWatch({ control: form.control, name: 'durationDays' });
  const maxAmount = useWatch({ control: form.control, name: 'maxAmount' });

  const mutation = useApiMutation(
    (data: FormOutput) => adminApi.generateMypgLicenses({ ...data, note: data.note || undefined }),
    { invalidate: [KEY], onSuccess: (res) => setCreated(res.data) }
  );

  return (
    <>
      <Button
        onClick={() => {
          form.reset({ durationDays: 30, maxAmount: 1_000_000, count: 1, note: '' });
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
                ? `Masing-masing menambah ${created[0]?.durationDays} hari masa aktif, ${
                    created[0]?.maxAmount ? `batas transaksi ${formatCurrency(created[0].maxAmount)}` : 'tanpa batas transaksi'
                  }, dan hanya bisa dipakai sekali.`
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
              <FormField
                label="Batas Transaksi (Rp)"
                htmlFor="lic-amount"
                error={errors.maxAmount?.message}
                hint="Total nominal invoice yang boleh dibuat selama lisensi. Kosongkan untuk tanpa batas."
              >
                <div className="flex flex-wrap gap-2 pb-1">
                  {AMOUNT_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => form.setValue('maxAmount', p.amount, { shouldValidate: true })}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted',
                        (maxAmount ?? null) === p.amount && 'border-primary bg-primary/10 text-primary'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input id="lic-amount" type="number" min={1} placeholder="Tanpa batas" {...form.register('maxAmount', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })} />
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

function EditDialog({ license }: { license: MypgLicense }) {
  const [open, setOpen] = useState(false);
  const used = license.status === 'REDEEMED';
  const form = useForm<EditInput, unknown, EditOutput>({
    resolver: zodResolver(editSchema),
    defaultValues: { durationDays: license.durationDays, maxAmount: license.maxAmount, note: license.note ?? '' },
  });
  const { errors } = form.formState;
  const mutation = useApiMutation((data: EditOutput) => adminApi.updateMypgLicense(license.id, data), {
    invalidate: [KEY],
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button
        variant="outline"
        size="xs"
        onClick={() => {
          form.reset({ durationDays: license.durationDays, maxAmount: license.maxAmount, note: license.note ?? '' });
          setOpen(true);
        }}
      >
        <Pencil /> Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lisensi</DialogTitle>
            <DialogDescription>
              <code className="font-mono">{license.code}</code>
              {used && ` · dipakai ${license.store?.name ?? 'toko'}. Perubahan durasi dan batas langsung diterapkan ke toko tersebut.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField label="Masa Aktif (hari)" htmlFor="edit-days" error={errors.durationDays?.message}>
              <Input id="edit-days" type="number" min={1} max={3650} {...form.register('durationDays', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Batas Transaksi (Rp)" htmlFor="edit-amount" error={errors.maxAmount?.message} hint="Kosongkan untuk tanpa batas.">
              <Input
                id="edit-amount"
                type="number"
                min={1}
                placeholder="Tanpa batas"
                {...form.register('maxAmount', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
              />
            </FormField>
            <FormField label="Catatan" htmlFor="edit-note" error={errors.note?.message}>
              <Input id="edit-note" {...form.register('note')} />
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
              <TableHead>Batas Transaksi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dipakai Oleh</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={8} isLoading={isLoading} error={error} isEmpty={!rows.length} emptyText="Belum ada kode lisensi" />
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="font-mono text-xs">{l.code}</code>
                    {l.status === 'UNUSED' && <CopyButton value={l.code} label="Salin kode" />}
                  </div>
                </TableCell>
                <TableCell>{l.durationDays} hari</TableCell>
                <TableCell>{l.maxAmount ? formatCurrency(l.maxAmount) : 'Tanpa batas'}</TableCell>
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
                  {l.status !== 'REVOKED' && (
                    <div className="flex justify-end gap-1">
                      <EditDialog license={l} />
                      <ConfirmAction
                        destructive
                        size="xs"
                        title={l.status === 'REDEEMED' ? 'Cabut lisensi dari toko?' : 'Nonaktifkan kode ini?'}
                        description={
                          l.status === 'REDEEMED'
                            ? `${l.code} dicabut dari ${l.store?.name ?? 'toko'}: masa aktif ${l.durationDays} hari dan batas transaksinya ikut dikurangi. Lisensi toko bisa langsung tidak aktif.`
                            : `${l.code} tidak bisa ditukarkan lagi.`
                        }
                        confirmLabel={l.status === 'REDEEMED' ? 'Cabut' : 'Nonaktifkan'}
                        onConfirm={() => revoke.mutateAsync(l.id)}
                      >
                        {l.status === 'REDEEMED' ? 'Cabut' : 'Nonaktifkan'}
                      </ConfirmAction>
                    </div>
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
