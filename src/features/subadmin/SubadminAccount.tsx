'use client';

import { QrCode } from 'lucide-react';
import { subadminApi } from '@/lib/api/subadmin';
import { useMe } from '@/features/auth/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { PasswordCard, ProfileCard } from '@/features/merchant/account/ProfileForms';
import { DiscordNotificationCard } from './DiscordNotificationCard';

export default function SubadminAccount() {
  const { data: me } = useMe();

  return (
    <>
      <PageHeader title="Pengaturan Akun" description="Profil dan keamanan akun sub admin Anda." />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ProfileCard api={subadminApi} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="size-4 text-primary" /> QRIS yang Dipantau
              </CardTitle>
              <CardDescription>Diatur oleh super admin. Hubungi super admin jika perlu perubahan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {me?.qris?.length ? (
                me.qris.map((q) => (
                  <ToneBadge key={q.id} tone="neutral">
                    {q.name}
                  </ToneBadge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Belum ada QRIS</span>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <PasswordCard api={subadminApi} minLength={8} />
          <DiscordNotificationCard />
        </div>
      </div>
    </>
  );
}
