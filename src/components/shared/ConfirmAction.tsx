'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<typeof Button>;

/** Tombol yang meminta konfirmasi sebelum menjalankan aksi (dipakai untuk aksi destruktif/penting). */
export function ConfirmAction({
  children,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  onConfirm,
  variant = 'outline',
  size = 'sm',
  destructive = false,
  ...buttonProps
}: Omit<ButtonProps, 'onClick'> & {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // error sudah ditampilkan lewat toast oleh mutation
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} {...buttonProps}>
        {children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <Button variant={destructive ? 'destructive' : 'default'} disabled={loading} onClick={handleConfirm}>
              {loading ? 'Memproses...' : confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
