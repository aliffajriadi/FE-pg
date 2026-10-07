'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { QueryKey } from '@tanstack/react-query';
import type { ReplyPayload } from '@/lib/api/support';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';

const replySchema = z.object({
  message: z.string().trim().min(1, 'Pesan tidak boleh kosong'),
  attachmentUrl: z.union([z.literal(''), z.url('Link tidak valid')]),
});
type ReplyFormValues = z.infer<typeof replySchema>;

export function ReplyForm({
  title,
  placeholder,
  onReply,
  invalidate,
}: {
  title: string;
  placeholder: string;
  onReply: (body: ReplyPayload) => Promise<unknown>;
  invalidate: QueryKey[];
}) {
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '', attachmentUrl: '' },
  });
  const { errors } = form.formState;

  const mutation = useApiMutation(
    (data: ReplyFormValues) => onReply({ message: data.message, attachmentUrl: data.attachmentUrl || undefined }),
    { successMessage: 'Balasan terkirim', invalidate, onSuccess: () => form.reset() }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <FormField label="Pesan" htmlFor="reply-message" error={errors.message?.message}>
            <Textarea id="reply-message" rows={4} placeholder={placeholder} {...form.register('message')} />
          </FormField>
          <FormField label="Link Referensi (Opsional)" htmlFor="reply-url" error={errors.attachmentUrl?.message}>
            <Input id="reply-url" type="url" placeholder="https://..." {...form.register('attachmentUrl')} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Mengirim...' : 'Kirim Balasan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
