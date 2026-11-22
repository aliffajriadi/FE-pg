'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserRole } from '@/types';
import RegisterWa from './RegisterWa';

const SKIP_KEY = 'wa-link-skip';

/** Admin boleh melewati permintaan sambung WhatsApp; diingat selama tab terbuka (diminta lagi setelah login berikutnya). */
export function usePhoneSkip() {
  const [skipped, setSkipped] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(SKIP_KEY) === '1';
    } catch {
      return false;
    }
  });
  const skip = () => {
    try {
      sessionStorage.setItem(SKIP_KEY, '1');
    } catch {
      // storage diblokir: cukup dilewati sampai halaman dimuat ulang
    }
    setSkipped(true);
  };
  return [skipped, skip] as const;
}

/** Akun lama tanpa nomor WhatsApp: wajib untuk merchant & sub admin, opsional untuk admin. */
export function LinkWhatsAppGate({ role, onSkip }: { role: UserRole; onSkip: () => void }) {
  const optional = role === 'ADMIN';
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Verifikasi Nomor WhatsApp
        </CardTitle>
        <CardDescription>
          Demi keamanan akun{role === 'MERCHANT' ? ' dan toko' : ''} kamu, sambungkan nomor WhatsApp terlebih dahulu. Nomor ini dipakai
          untuk masuk cepat, memulihkan password, dan memastikan hanya kamu yang bisa mengubah password atau nomor akun.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Kirim kode dari nomor WhatsApp yang ingin kamu pakai.</p>
        <RegisterWa mode="phone-new" />
        {optional && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onSkip}>
            Lewati untuk sekarang
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
