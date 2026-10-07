'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/** Nilai readonly (API key / secret) dengan tombol salin. */
export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Gagal menyalin, salin secara manual');
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
      <code className="min-w-0 flex-1 font-mono text-xs break-all">{value}</code>
      <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label="Salin">
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
