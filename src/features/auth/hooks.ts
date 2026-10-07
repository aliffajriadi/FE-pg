'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { clearSession } from '@/lib/session';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    clearSession();
    queryClient.clear();
    router.replace('/login');
  };
}
