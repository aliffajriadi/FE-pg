'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { guidesApi } from '@/lib/api/guides';
import { formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GuideContent } from './GuideContent';

export default function GuideDetail({ slug, backHref }: { slug: string; backHref: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['guide', slug],
    queryFn: () => guidesApi.get(slug),
    select: (res) => res.data,
    retry: false,
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link href={backHref} className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-2' })}>
        <ArrowLeft /> Semua panduan
      </Link>
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error || !data ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Panduan tidak ditemukan.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-6 py-2">
            <header className="space-y-2 border-b pb-5">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.title}</h1>
              {data.summary && <p className="text-muted-foreground">{data.summary}</p>}
              <p className="text-xs text-muted-foreground">Diperbarui {formatDate(data.updatedAt)}</p>
            </header>
            <GuideContent blocks={data.blocks} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
