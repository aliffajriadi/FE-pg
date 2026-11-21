'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type MypgNotifPatterns } from '@/lib/api/admin';
import { MYPG_PROVIDER_LABEL, type MypgProvider } from '@/lib/api/mypg';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';

const PROVIDERS = Object.keys(MYPG_PROVIDER_LABEL) as MypgProvider[];
const QUERY_KEY = ['admin-mypg-notif-patterns'];

// Satu template per baris di textarea
const toText = (p: MypgNotifPatterns) => Object.fromEntries(PROVIDERS.map((k) => [k, p[k].join('\n')])) as Record<MypgProvider, string>;
const toPatterns = (t: Record<MypgProvider, string>) =>
  Object.fromEntries(
    PROVIDERS.map((k) => [
      k,
      t[k]
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    ]),
  ) as MypgNotifPatterns;

function PatternsForm({ patterns, defaults }: { patterns: MypgNotifPatterns; defaults: MypgNotifPatterns }) {
  const [saved, setSaved] = useState(() => toText(patterns));
  const [texts, setTexts] = useState(saved);
  const [sample, setSample] = useState('');
  const isDirty = PROVIDERS.some((k) => texts[k] !== saved[k]);

  const save = useApiMutation(() => adminApi.updateMypgNotifPatterns(toPatterns(texts)), {
    invalidate: [QUERY_KEY],
    onSuccess: (res) => {
      const next = toText(res.data);
      setSaved(next);
      setTexts(next);
    },
  });
  const test = useApiMutation(() => adminApi.testMypgNotifPattern({ text: sample, patterns: toPatterns(texts) }), {
    successMessage: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pola Notifikasi Uang Masuk</CardTitle>
        <CardDescription>
          Teks notifikasi yang dianggap uang masuk. Satu pola per baris. <code>{'{nominal}'}</code> = angka nominal, <code>*</code> = teks
          bebas. Notifikasi harus <b>diawali</b> pola, jadi chat atau promo yang kebetulan mirip tidak ikut terbaca.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {PROVIDERS.map((k) => (
            <FormField key={k} label={MYPG_PROVIDER_LABEL[k]} htmlFor={`pattern-${k}`}>
              <Textarea
                id={`pattern-${k}`}
                rows={4}
                className="font-mono text-xs"
                value={texts[k]}
                onChange={(e) => setTexts({ ...texts, [k]: e.target.value })}
              />
            </FormField>
          ))}
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <FormField
            label="Coba Teks Notifikasi"
            htmlFor="pattern-sample"
            hint="Tempel teks dari log notifikasi untuk dicek dengan pola di atas (belum perlu disimpan)."
          >
            <div className="flex gap-2">
              <Input
                id="pattern-sample"
                placeholder="Rp100 diterima DANA Bisnis."
                value={sample}
                onChange={(e) => setSample(e.target.value)}
              />
              <Button type="button" variant="outline" disabled={!sample.trim() || test.isPending} onClick={() => test.mutate()}>
                Coba
              </Button>
            </div>
          </FormField>
          {test.data && (
            <p className="text-sm" role="status">
              {test.data.data ? (
                <span className="text-emerald-600">
                  Dikenali: {MYPG_PROVIDER_LABEL[test.data.data.provider]} · {formatCurrency(test.data.data.amount)}
                </span>
              ) : (
                <span className="text-destructive">Tidak dikenali, notifikasi ini akan diabaikan.</span>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" className="mr-auto" onClick={() => setTexts(toText(defaults))}>
            Pakai Pola Bawaan
          </Button>
          <Button type="button" variant="outline" disabled={!isDirty || save.isPending} onClick={() => setTexts(saved)}>
            Batal
          </Button>
          <Button type="button" disabled={!isDirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Menyimpan...' : 'Simpan Pola'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotifPatternsCard() {
  const { data, isLoading, error } = useQuery({ queryKey: QUERY_KEY, queryFn: adminApi.getMypgNotifPatterns, select: (res) => res.data });
  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (error || !data) return <p className="text-sm text-destructive">Gagal memuat pola notifikasi: {error?.message}</p>;
  return <PatternsForm patterns={data.patterns} defaults={data.defaults} />;
}
