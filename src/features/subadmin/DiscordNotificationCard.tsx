'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing } from 'lucide-react';
import { subadminApi } from '@/lib/api/subadmin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { ToneBadge } from '@/components/shared/StatusBadge';

const KEY = ['subadmin-notification'];
const WEBHOOK_RE = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+\/?$/;

/** Webhook Discord pribadi: pesan masuk setiap ada penarikan baru untuk ditransfer. */
export function DiscordNotificationCard() {
  const { data } = useQuery({ queryKey: KEY, queryFn: subadminApi.getNotification, select: (res) => res.data.discordWebhookUrl });
  const [draft, setDraft] = useState<string>();
  const [error, setError] = useState('');

  const value = draft ?? data ?? '';
  const trimmed = value.trim();
  const validate = () => {
    const next = trimmed && !WEBHOOK_RE.test(trimmed) ? 'Link harus berupa webhook Discord (https://discord.com/api/webhooks/...)' : '';
    setError(next);
    return !next;
  };

  const save = useApiMutation(subadminApi.updateNotification, { invalidate: [KEY], onSuccess: () => setDraft(undefined) });
  const test = useApiMutation(subadminApi.testNotification);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4 text-primary" /> Notifikasi Discord
          {data ? <ToneBadge tone="success">Aktif</ToneBadge> : <ToneBadge tone="neutral">Mati</ToneBadge>}
        </CardTitle>
        <CardDescription>
          Dapat pesan di channel Discord Anda setiap ada penarikan baru. Buat di Discord: Pengaturan Channel → Integrasi → Webhook → Salin
          URL.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (validate()) save.mutate(trimmed);
          }}
        >
          <FormField label="Link Webhook Discord" htmlFor="discord-webhook" error={error}>
            <Input
              id="discord-webhook"
              placeholder="https://discord.com/api/webhooks/..."
              value={value}
              onChange={(e) => {
                setDraft(e.target.value);
                setError('');
              }}
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending || draft === undefined}>
              {save.isPending ? 'Menyimpan...' : trimmed ? 'Simpan' : 'Simpan (matikan)'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!trimmed || test.isPending}
              onClick={() => validate() && test.mutate(trimmed)}
            >
              {test.isPending ? 'Mengirim...' : 'Kirim Pesan Uji'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
