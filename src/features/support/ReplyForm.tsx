'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { QueryKey } from '@tanstack/react-query';
import { ImagePlus, Loader2, SendHorizontal, X } from 'lucide-react';
import type { ReplyPayload } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MAX_TICKET_IMAGE_MB, MAX_TICKET_IMAGES, validateTicketImage } from './utils';

const replySchema = z.object({ message: z.string().trim() });
type ReplyFormValues = z.infer<typeof replySchema>;

/** Kotak balasan di bawah percakapan, bisa melampirkan satu gambar. Ctrl/⌘ + Enter untuk kirim. */
export function ReplyForm({
  placeholder,
  onReply,
  invalidate,
  imagesLeft,
}: {
  placeholder: string;
  onReply: (body: ReplyPayload) => Promise<unknown>;
  invalidate: QueryKey[];
  /** Sisa jatah gambar pengirim di tiket ini. */
  imagesLeft: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const form = useForm<ReplyFormValues>({ resolver: zodResolver(replySchema), defaultValues: { message: '' } });

  const setImageWithPreview = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    setImage(file);
  };

  const pickImage = (file: File | null) => {
    if (fileRef.current) fileRef.current.value = '';
    const invalid = file && validateTicketImage(file);
    setError(invalid || undefined);
    if (!invalid) setImageWithPreview(file);
  };

  const mutation = useApiMutation((data: ReplyFormValues) => onReply({ message: data.message, image }), {
    successMessage: false,
    invalidate,
    onSuccess: () => {
      form.reset();
      setImageWithPreview(null);
    },
  });

  const submit = form.handleSubmit((data) => {
    if (!data.message && !image) return setError('Pesan tidak boleh kosong');
    setError(undefined);
    mutation.mutate(data);
  });

  return (
    <form onSubmit={submit} className="space-y-2">
      {preview && image && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Gambar yang akan dikirim" className="max-h-32 rounded-lg border object-contain" />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Hapus gambar"
            className="absolute -top-2 -right-2 rounded-full shadow"
            onClick={() => setImageWithPreview(null)}
          >
            <X />
          </Button>
        </div>
      )}

      <Textarea
        rows={2}
        placeholder={placeholder}
        aria-label="Pesan balasan"
        aria-invalid={!!error}
        className="max-h-48 min-h-20 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
        {...form.register('message')}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="ghost" size="sm" disabled={!imagesLeft} onClick={() => fileRef.current?.click()}>
            <ImagePlus /> {image ? 'Ganti gambar' : 'Lampirkan gambar'}
          </Button>
          <span className="truncate text-xs text-muted-foreground">
            {imagesLeft
              ? `Sisa ${imagesLeft}/${MAX_TICKET_IMAGES} gambar · maks ${MAX_TICKET_IMAGE_MB}MB`
              : `Jatah ${MAX_TICKET_IMAGES} gambar habis`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl + Enter untuk kirim</span>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <SendHorizontal />} Kirim
          </Button>
        </div>
      </div>
    </form>
  );
}
