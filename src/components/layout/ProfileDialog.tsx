"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ToneBadge } from "@/components/shared/StatusBadge";
import type { User } from "@/types";

/** Profil admin. Merchant memakai halaman Akun Saya (/dashboard/account). */
export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onLogout: () => void;
}) {
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
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
            <ToneBadge tone="info">Admin</ToneBadge>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onLogout}>
            <LogOut /> Keluar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
