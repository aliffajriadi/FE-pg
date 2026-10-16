'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight } from 'lucide-react';
import { guidesApi, type GuideAudience, type GuideSummary } from '@/lib/api/guides';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';

const SECTION_TITLE: Record<GuideAudience, string> = { MYPG: 'Panduan MyPG', ALL: 'Panduan Umum' };

function GuideCards({ guides, basePath }: { guides: GuideSummary[]; basePath: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {guides.map((g) => (
        <Link key={g.id} href={`${basePath}/${g.slug}`} className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardContent className="flex h-full items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-semibold">{g.title}</span>
                {g.summary && <span className="line-clamp-2 block text-sm text-muted-foreground">{g.summary}</span>}
                <span className="block text-xs text-muted-foreground">Diperbarui {formatDate(g.updatedAt, false)}</span>
              </span>
              <ChevronRight className="mt-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/**
 * Daftar panduan yang dipublikasikan. `audiences` urut sesuai tampilan; bila lebih dari satu,
 * panduan dikelompokkan per pembaca (mis. Panel MyPG: Panduan MyPG lalu Panduan Umum).
 */
export default function GuideList({ audiences, basePath, title }: { audiences: GuideAudience[]; basePath: string; title: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['guides'],
    queryFn: () => guidesApi.list(),
    select: (res) => res.data,
  });
  const sections = audiences
    .map((audience) => ({ audience, guides: (data ?? []).filter((g) => g.audience === audience) }))
    .filter((s) => s.guides.length);

  return (
    <>
      <PageHeader title={title} description="Panduan langkah demi langkah dari admin." />
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Gagal memuat panduan: {error.message}</p>
      ) : !sections.length ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada panduan.</CardContent>
        </Card>
      ) : sections.length === 1 ? (
        <GuideCards guides={sections[0].guides} basePath={basePath} />
      ) : (
        sections.map((s) => (
          <section key={s.audience} className="space-y-3">
            <h2 className="text-lg font-semibold">{SECTION_TITLE[s.audience]}</h2>
            <GuideCards guides={s.guides} basePath={basePath} />
          </section>
        ))
      )}
    </>
  );
}
