'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Avatar acak tapi konsisten per nama, dari DiceBear (https://www.dicebear.com).
 * Jika gambar gagal dimuat (offline / layanan down), tampilkan inisial.
 */
export function UserAvatar({ name, className }: { name?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'U';
  const src = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name ?? '')}&backgroundColor=dbe4f3`;

  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-bold text-primary',
        className
      )}
    >
      {name && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={name} src={src} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initial
      )}
    </span>
  );
}
