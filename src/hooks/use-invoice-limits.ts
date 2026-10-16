'use client';

import { useQuery } from '@tanstack/react-query';
import { merchantApi } from '@/lib/api/merchant';

const FALLBACK = { min: 500, max: 20_000_000, manualInvoiceEnabled: false, dailyTxLimit: 0, dailyTxUsed: 0 };

/** Batas nominal invoice (minimum diatur admin). Memakai nilai default selama data belum dimuat. */
export function useInvoiceLimits() {
  const { data } = useQuery({
    queryKey: ['invoice-limits'],
    queryFn: merchantApi.getInvoiceLimits,
    select: (res) => res.data,
    staleTime: 15_000,
  });
  return data ?? FALLBACK;
}
