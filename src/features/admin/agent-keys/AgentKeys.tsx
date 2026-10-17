'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { adminApi, type AgentKey, type ManualGateway } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableState } from '@/components/shared/TableState';
import { ConfirmAction } from '@/components/shared/ConfirmAction';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { CopyButton } from '@/components/shared/CopyButton';
import { CopyField } from '@/components/shared/CopyField';

const KEYS = ['admin-agent-keys'];
const LEGACY_LABEL: Record<ManualGateway, string> = { DANA_MANUAL: 'DANA', SHOPEEPAY_MANUAL: 'ShopeePay', GOPAY_MANUAL: 'GoPay' };

const maskKey = (key: string) => `${key.slice(0, 6)}${'•'.repeat(12)}${key.slice(-4)}`;

/** Dialog buat / ubah API key. Setelah dibuat, key ditampilkan untuk disalin ke HP agent. */
function AgentKeyDialog({ agentKey }: { agentKey?: AgentKey }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [qrisId, setQrisId] = useState('');
  const [errors, setErrors] = useState<{ name?: string; qris?: string }>({});
  const [created, setCreated] = useState<AgentKey | null>(null);

  const { data: qrisList } = useQuery({
    queryKey: ['admin-manual-qris'],
    queryFn: adminApi.getManualQris,
    select: (res) => res.data,
    enabled: open,
  });

  const mutation = useApiMutation(
    () =>
      agentKey
        ? adminApi.updateAgentKey(agentKey.id, { name, manualQrisId: Number(qrisId) })
        : adminApi.createAgentKey({ name, manualQrisId: Number(qrisId) }),
    {
      invalidate: [KEYS],
      onSuccess: (res) => (agentKey ? setOpen(false) : setCreated(res.data)),
    },
  );

  const openDialog = () => {
    setName(agentKey?.name ?? '');
    setQrisId(agentKey ? String(agentKey.manualQris.id) : '');
    setErrors({});
    setCreated(null);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { name: name.trim() ? undefined : 'Nama wajib diisi', qris: qrisId ? undefined : 'Pilih QRIS' };
    setErrors(next);
    if (!next.name && !next.qris) mutation.mutate();
  };

  return (
    <>
      {agentKey ? (
        <Button variant="ghost" size="icon-sm" onClick={openDialog} aria-label="Ubah API key">
          <Pencil />
        </Button>
      ) : (
        <Button onClick={openDialog}>
          <Plus /> Buat API Key
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {created ? (
            <>
              <DialogHeader>
                <DialogTitle>API Key Dibuat</DialogTitle>
                <DialogDescription>
                  Masukkan key ini sebagai apikey di aplikasi HP agent &quot;{created.name}&quot;. Notifikasinya hanya dicocokkan ke invoice
                  QRIS {created.manualQris.name}.
                </DialogDescription>
              </DialogHeader>
              <CopyField value={created.key} />
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Selesai</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{agentKey ? 'Ubah API Key Agent' : 'Buat API Key Agent'}</DialogTitle>
                <DialogDescription>
                  Satu API key untuk satu HP agent. Key terikat ke QRIS yang notifikasinya diterima HP itu.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <FormField label="Nama *" htmlFor="agent-name" error={errors.name}>
                  <Input id="agent-name" placeholder="Misal: HP Kasir DANA 1" value={name} onChange={(e) => setName(e.target.value)} />
                </FormField>
                <FormField
                  label="QRIS *"
                  htmlFor="agent-qris"
                  error={errors.qris}
                  hint={qrisList && !qrisList.length ? 'Belum ada QRIS. Tambahkan dulu di menu QRIS.' : undefined}
                >
                  <SimpleSelect
                    id="agent-qris"
                    value={qrisId}
                    onValueChange={setQrisId}
                    options={(qrisList ?? []).map((q) => ({ value: String(q.id), label: q.name }))}
                    placeholder="-- Pilih QRIS --"
                  />
                </FormField>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Menyimpan...' : agentKey ? 'Simpan' : 'Buat API Key'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function KeyCell({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <code className="font-mono text-xs text-muted-foreground">{shown ? value : maskKey(value)}</code>
      <Button variant="ghost" size="icon-xs" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Sembunyikan key' : 'Tampilkan key'}>
        {shown ? <EyeOff /> : <Eye />}
      </Button>
      <CopyButton value={value} label="Salin key" />
    </div>
  );
}

export default function AgentKeys() {
  const { data, isLoading, error } = useQuery({ queryKey: KEYS, queryFn: adminApi.getAgentKeys, select: (res) => res.data });

  const options = { invalidate: [KEYS] };
  const toggle = useApiMutation(({ id, isActive }: { id: number; isActive: boolean }) => adminApi.updateAgentKey(id, { isActive }), {
    ...options,
    successMessage: 'Status API key disimpan',
  });
  const regenerate = useApiMutation(adminApi.regenerateAgentKey, options);
  const remove = useApiMutation(adminApi.deleteAgentKey, options);
  const legacy = useApiMutation(adminApi.setLegacyAgentKeys, options);

  const keys = data?.keys ?? [];
  const legacyGateways = data ? (Object.keys(data.legacyConfigured) as ManualGateway[]).filter((g) => data.legacyConfigured[g]) : [];

  return (
    <>
      <PageHeader
        title="API Key Agent"
        description="API key untuk HP agent yang meneruskan notifikasi DANA, ShopeePay, dan GoPay ke server (invoice Live)."
      >
        <AgentKeyDialog />
      </PageHeader>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Apikey Lama (.env Server)</CardTitle>
            <CardDescription>
              Apikey bawaan yang dipakai HP agent sebelum fitur ini. Notifikasinya dicocokkan ke semua QRIS. Matikan setelah semua HP
              memakai API key baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="flex items-center gap-3 rounded-lg border p-3">
              <Switch checked={data.legacyEnabled} onCheckedChange={(checked) => legacy.mutate(checked)} disabled={legacy.isPending} />
              <span>
                <span className="block font-medium">{data.legacyEnabled ? 'Masih diterima' : 'Tidak diterima'}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {legacyGateways.length
                    ? `Terisi di server untuk: ${legacyGateways.map((g) => LEGACY_LABEL[g]).join(', ')}`
                    : 'Tidak ada apikey lama yang terisi di server'}
                </span>
              </span>
            </Label>
            {data.legacyEnabled && legacyGateways.length > 0 && (
              <p className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                Selama aktif, siapa pun yang tahu apikey lama bisa mengirim notifikasi untuk semua QRIS.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>QRIS</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead>Terakhir Dipakai</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={7} isLoading={isLoading} error={error} isEmpty={!keys.length} emptyText="Belum ada API key agent" />
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell className="whitespace-nowrap">{k.manualQris.name}</TableCell>
                <TableCell>
                  <KeyCell value={k.key} />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={k.isActive}
                    onCheckedChange={(checked) => toggle.mutate({ id: k.id, isActive: checked })}
                    disabled={toggle.isPending}
                    aria-label={`Aktifkan ${k.name}`}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Belum pernah'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(k.createdAt, false)}
                  {k.createdBy && <p className="text-xs">oleh {k.createdBy.name}</p>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <AgentKeyDialog agentKey={k} />
                    <ConfirmAction
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Buat ulang key"
                      title={`Buat ulang key "${k.name}"?`}
                      description="Key lama langsung tidak berlaku. HP agent perlu diisi key baru."
                      confirmLabel="Buat Ulang"
                      onConfirm={() => regenerate.mutateAsync(k.id)}
                    >
                      <RefreshCw />
                    </ConfirmAction>
                    <ConfirmAction
                      destructive
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus API key"
                      title={`Hapus API key "${k.name}"?`}
                      description="HP agent yang memakai key ini tidak bisa mengirim notifikasi lagi."
                      confirmLabel="Hapus"
                      onConfirm={() => remove.mutateAsync(k.id)}
                    >
                      <Trash2 />
                    </ConfirmAction>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
