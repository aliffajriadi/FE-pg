'use client';

import Link from 'next/link';
import { LogOut, Pencil } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { Store, User } from '@/types';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  store,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  store?: Store | null;
  onLogout: () => void;
}) {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profil Saya</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <UserAvatar name={user?.name} className="size-16 text-xl" />
          <div className="min-w-0 space-y-1">
            <p className="truncate text-lg font-semibold">{user?.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            <ToneBadge tone={isAdmin ? 'info' : 'neutral'}>{isAdmin ? 'Admin' : 'Merchant'}</ToneBadge>
          </div>
        </div>

        {store && (
          <div className="divide-y rounded-lg border px-4">
            <Row label="Toko">{store.name}</Row>
            <Row label="Status toko">
              <StatusBadge status={store.status} />
            </Row>
            <Row label="Hold saldo">{store.balanceHoldHours} jam</Row>
            <Row label="Terdaftar sejak">{formatDate(store.createdAt, false)}</Row>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onLogout}>
            <LogOut /> Keluar
          </Button>
          {!isAdmin && (
            <Link href="/dashboard/settings" onClick={() => onOpenChange(false)} className={buttonVariants()}>
              <Pencil /> Ubah Profil
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
