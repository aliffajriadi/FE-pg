'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { merchantApi } from '@/lib/api/merchant';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SEEN_KEY = 'banner_shown';

/** Pengumuman dari admin, ditampilkan sekali per sesi browser. */
export function MerchantBanner() {
  const [open, setOpen] = useState(false);
  const { data: banner } = useQuery({
    queryKey: ['merchant-banner'],
    queryFn: merchantApi.getBanner,
    select: (res) => res.data,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (banner?.isActive && !sessionStorage.getItem(SEEN_KEY)) {
      sessionStorage.setItem(SEEN_KEY, 'true');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage hanya tersedia di browser
      setOpen(true);
    }
  }, [banner]);

  if (!banner?.isActive) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pengumuman</DialogTitle>
        </DialogHeader>
        {/* Konten HTML ditulis oleh admin di Pengaturan Sistem */}
        <div className="max-h-[60vh] overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: banner.value }} />
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
