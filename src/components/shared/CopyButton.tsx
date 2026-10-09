'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/** Tombol ikon kecil untuk menyalin teks ke clipboard. */
export function CopyButton({ value, label = 'Salin' }: { value: string; label?: string }) {
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
    <Button type="button" variant="ghost" size="icon-xs" onClick={copy} aria-label={label}>
      {copied ? <Check className="text-emerald-600" /> : <Copy />}
    </Button>
  );
}
