'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Tombol muat ulang data; ikon berputar selama data diambil. */
export function RefreshButton({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <Button variant="outline" onClick={onRefresh} disabled={loading} title="Muat ulang data">
      <RefreshCw className={cn(loading && 'animate-spin')} /> Refresh
    </Button>
  );
}
