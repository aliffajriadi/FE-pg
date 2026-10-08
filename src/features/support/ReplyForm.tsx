'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { QueryKey } from '@tanstack/react-query';
import { Link2, Loader2, SendHorizontal, X } from 'lucide-react';
import type { ReplyPayload } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const replySchema = z.object({
  message: z.string().trim().min(1, 'Pesan tidak boleh kosong'),
  attachmentUrl: z.union([z.literal(''), z.url('Link tidak valid')]),
});
type ReplyFormValues = z.infer<typeof replySchema>;

/** Kotak balasan di bawah percakapan. Ctrl/⌘ + Enter untuk kirim. */
export function ReplyForm({
  placeholder,
  onReply,
  invalidate,
}: {
  placeholder: string;
  onReply: (body: ReplyPayload) => Promise<unknown>;
  invalidate: QueryKey[];
}) {
  const [showLink, setShowLink] = useState(false);
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '', attachmentUrl: '' },
  });
  const { errors } = form.formState;

  const mutation = useApiMutation(
    (data: ReplyFormValues) => onReply({ message: data.message, attachmentUrl: data.attachmentUrl || undefined }),
    {
      successMessage: false,
      invalidate,
      onSuccess: () => {
        form.reset();
        setShowLink(false);
      },
    }
  );

  const submit = form.handleSubmit((data) => mutation.mutate(data));

  return (
    <form onSubmit={submit} className="space-y-2">
      {showLink && (
        <div className="flex items-center gap-2">
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Link bukti / referensi (Google Drive, Imgur, dll)"
            aria-label="Link referensi"
            aria-invalid={!!errors.attachmentUrl}
            className="h-8"
            autoFocus
            {...form.register('attachmentUrl')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Hapus link"
            onClick={() => {
              form.setValue('attachmentUrl', '');
              setShowLink(false);
            }}
          >
            <X />
          </Button>
        </div>
      )}

      <Textarea
        rows={2}
        placeholder={placeholder}
        aria-label="Pesan balasan"
        aria-invalid={!!errors.message}
        className="max-h-48 min-h-20 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
        {...form.register('message')}
      />

      {(errors.message || errors.attachmentUrl) && (
        <p className="text-xs text-destructive">{errors.message?.message ?? errors.attachmentUrl?.message}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {!showLink ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowLink(true)}>
            <Link2 /> Lampirkan link
          </Button>
        ) : (
          <span />
        )}
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
