'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Options<TData> {
  /** Pesan toast saat sukses. Jika tidak diisi, pakai `message` dari response API. */
  successMessage?: string;
  /** Query yang di-refresh setelah sukses. */
  invalidate?: QueryKey[];
  onSuccess?: (data: TData) => void;
}

/** useMutation + toast sukses/gagal + invalidasi query, agar tiap aksi tidak menulis ulang boilerplate. */
export function useApiMutation<TVariables = void, TData = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  { successMessage, invalidate = [], onSuccess }: Options<TData> = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      const apiMessage = (data as { message?: string } | undefined)?.message;
      toast.success(successMessage || apiMessage || 'Berhasil');
      invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Terjadi kesalahan');
    },
  });
}
