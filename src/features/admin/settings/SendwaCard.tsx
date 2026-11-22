'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CopyField } from '@/components/shared/CopyField';
import { FormField } from '@/components/shared/FormField';

const QUERY_KEY = ['admin-sendwa-config'];

/** Kredensial SendWA Verify untuk daftar mandiri via WhatsApp. Nilai tersimpan hanya ditampilkan tersamar. */
export function SendwaCard() {
  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: adminApi.getSendwaConfig, select: (res) => res.data });
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const save = useApiMutation(() => adminApi.updateSendwaConfig({ apiKey, webhookSecret }), {
    invalidate: [QUERY_KEY],
    onSuccess: () => {
      setApiKey('');
      setWebhookSecret('');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar via WhatsApp (SendWA)</CardTitle>
        <CardDescription>
          Kredensial project SendWA Verify. Selama API key kosong, halaman daftar menampilkan &ldquo;Pendaftaran belum dibuka&rdquo;.
          Merchant baru otomatis berstatus pending dengan Live nonaktif.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data && (
          <FormField label="Webhook URL" htmlFor="sendwa-webhook" hint="Isi di pengaturan project SendWA.">
            <CopyField value={data.webhookUrl} />
          </FormField>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="API Key"
            htmlFor="sendwa-key"
            hint={data?.apiKey ? `Tersimpan: ${data.apiKey}. Kosongkan bila tidak diubah.` : 'Belum diatur.'}
          >
            <Input
              id="sendwa-key"
              type="password"
              autoComplete="off"
              placeholder="pk_live_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </FormField>
          <FormField
            label="Webhook Secret"
            htmlFor="sendwa-secret"
            hint={data?.webhookSecret ? `Tersimpan: ${data.webhookSecret}. Kosongkan bila tidak diubah.` : 'Belum diatur.'}
          >
            <Input
              id="sendwa-secret"
              type="password"
              autoComplete="off"
              placeholder="whsec_..."
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={(!apiKey.trim() && !webhookSecret.trim()) || save.isPending}>
            {save.isPending ? 'Menyimpan...' : 'Simpan Kredensial'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
