'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { API_URL } from '@/lib/api/client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { CopyButton } from '@/components/shared/CopyButton';

const SCRIPT_KEY = ['admin-growtopia-script'];
const VARIABLES = ['{{{world}}}', '{{{apikeybot}}}', '{{{url}}}'];
const ENDPOINT = `${API_URL}/growtopia-script`;
const EXAMPLE_RESPONSE = `{
  "success": true,
  "data": {
    "script": "local world = \\"{{{world}}}\\"\\n...",
    "updatedAt": "2026-11-08T10:00:00.000Z"
  }
}`;

function ScriptEditor({ initial }: { initial: string }) {
  const [script, setScript] = useState(initial);
  const save = useApiMutation(adminApi.saveGrowtopiaScript, { invalidate: [SCRIPT_KEY] });

  return (
    <>
      <Textarea
        aria-label="Script Lua"
        value={script}
        onChange={(e) => setScript(e.target.value)}
        spellCheck={false}
        placeholder={'local world = "{{{world}}}"\nlocal apikey = "{{{apikeybot}}}"'}
        className="min-h-96 font-mono text-xs [field-sizing:fixed] md:text-xs"
      />
      <Button onClick={() => save.mutate(script)} disabled={save.isPending || script === initial}>
        {save.isPending ? 'Menyimpan...' : 'Simpan Script'}
      </Button>
    </>
  );
}

export default function GrowtopiaScript() {
  const { data, isLoading } = useQuery({ queryKey: SCRIPT_KEY, queryFn: adminApi.getGrowtopiaScript });
  const saved = data?.data;

  return (
    <>
      <PageHeader title="Script Growtopia" description="Satu template script Lua yang diambil app lain lewat API." />

      <Card>
        <CardHeader>
          <CardTitle>Script Lua</CardTitle>
          <CardDescription>
            Variabel <code className="font-mono">{VARIABLES.join(' ')}</code> dibiarkan apa adanya; app lain yang menggantinya.{' '}
            {saved?.updatedAt ? `Terakhir disimpan ${formatDate(saved.updatedAt)}.` : 'Belum ada script tersimpan.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((v) => (
              <div key={v} className="flex items-center gap-1 rounded-lg border py-0.5 pr-1 pl-2.5 text-sm">
                <code className="font-mono font-semibold">{v}</code>
                <CopyButton value={v} />
              </div>
            ))}
          </div>
          {isLoading ? (
            <Skeleton className="h-96 rounded-lg" />
          ) : (
            <ScriptEditor key={saved?.updatedAt ?? 'new'} initial={saved?.script ?? ''} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint API</CardTitle>
          <CardDescription>Publik, tanpa API key. Mengembalikan 404 jika script belum diatur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 font-mono text-sm">
            <span className="font-semibold text-primary">GET</span>
            <span className="min-w-0 flex-1 truncate">{ENDPOINT}</span>
            <CopyButton value={ENDPOINT} />
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs">{EXAMPLE_RESPONSE}</pre>
        </CardContent>
      </Card>
    </>
  );
}
