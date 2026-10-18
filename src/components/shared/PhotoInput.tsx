'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

/** Input file gambar dengan pratinjau. */
export function PhotoInput({
  id,
  file,
  onChange,
  hint = 'Klik untuk pilih gambar (maks 5MB)',
}: {
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  hint?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/50"
      >
        <ImageIcon className="size-5" />
        <span className="max-w-full truncate">{file ? file.name : hint}</span>
        <input id={id} type="file" accept="image/*" className="hidden" onChange={(e) => handleChange(e.target.files?.[0] ?? null)} />
      </label>
      {preview && file && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Pratinjau" className="max-h-40 rounded-lg border object-contain" />
      )}
    </div>
  );
}
