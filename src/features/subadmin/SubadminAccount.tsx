'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CalendarDays, ChevronRight, Mail, QrCode, Wallet } from 'lucide-react';
import { subadminApi } from '@/lib/api/subadmin';
import { useMe } from '@/features/auth/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ToneBadge } from '@/components/shared/StatusBadge';
import { PasswordCard, ProfileCard } from '@/features/merchant/account/ProfileForms';
import type { User } from '@/types';
import { DiscordNotificationCard } from './DiscordNotificationCard';

function ProfileHero({ user, qrisCount }: { user: User; qrisCount: number }) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="relative h-28 bg-gradient-to-br from-primary via-primary/80 to-primary/40 sm:h-32">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        />
      </div>
      <CardContent className="relative pb-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
          <UserAvatar name={user.name} className="size-24 border-4 border-card text-3xl shadow-md sm:size-28" />
          <div className="min-w-0 flex-1 space-y-1.5 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-bold">{user.name}</h2>
              <ToneBadge tone="info">Sub Admin</ToneBadge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <Mail className="size-4 shrink-0" /> <span className="truncate">{user.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <QrCode className="size-4 shrink-0" /> {qrisCount} QRIS dipantau
              </span>
              {user.createdAt && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 shrink-0" /> Bergabung {formatDate(user.createdAt, false)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  href,
  alert,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <Card size="sm" className={`transition-colors group-hover:border-primary/50 ${alert ? 'border-destructive/40' : ''}`}>
        <CardContent className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Icon className="size-3.5" /> {label}
            <ChevronRight className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </p>
          <p className="truncate text-lg font-bold sm:text-xl" title={value}>
            {value}
          </p>
          <p className={`truncate text-xs ${alert ? 'text-destructive' : 'text-muted-foreground'}`}>{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SummaryStrip() {
  const balance = useQuery({ queryKey: ['subadmin-balance'], queryFn: subadminApi.getBalance, select: (res) => res.data });
  const pending = useQuery({
    queryKey: ['subadmin-withdrawals', 'open-count'],
    queryFn: () => subadminApi.getWithdrawals({ limit: 1, status: 'OPEN' }),
    select: (res) => res.openCount,
  });

  if (balance.isLoading || pending.isLoading) return <Skeleton className="h-24 rounded-xl" />;
  if (!balance.data) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatTile
        icon={Wallet}
        label="Uang yang Dipegang"
        value={formatCurrency(balance.data.balance)}
        hint={`Masuk hari ini ${formatCurrency(balance.data.today.amount)}`}
        href="/subadmin/balance"
      />
      <StatTile
        icon={Banknote}
        label="Penarikan Perlu Ditransfer"
        value={`${pending.data ?? 0} penarikan`}
        hint={pending.data ? 'Ada tugas dari admin' : 'Tidak ada tugas'}
        href="/subadmin/withdrawals"
        alert={!!pending.data}
      />
    </div>
  );
}

export default function SubadminAccount() {
  const { data, isLoading, error } = useMe();

  return (
    <>
      <PageHeader title="Akun Saya" description="Profil, QRIS yang dipantau, notifikasi, dan keamanan akun sub admin Anda." />

      {isLoading ? (
        <>
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </>
      ) : error || !data ? (
        <Card>
          <CardContent className="text-destructive">Gagal memuat akun: {error?.message}</CardContent>
        </Card>
      ) : (
        <>
          <ProfileHero user={data.user} qrisCount={data.qris?.length ?? 0} />
          <SummaryStrip />
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="size-4 text-primary" /> QRIS yang Dipantau
                  </CardTitle>
                  <CardDescription>Diatur oleh super admin. Hubungi super admin jika perlu perubahan.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {data.qris?.length ? (
                    data.qris.map((q) => (
                      <ToneBadge key={q.id} tone="neutral">
                        {q.name}
                      </ToneBadge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Belum ada QRIS</span>
                  )}
                </CardContent>
              </Card>
              <DiscordNotificationCard />
            </div>
            <div className="space-y-4">
              <ProfileCard api={subadminApi} />
              <PasswordCard api={subadminApi} minLength={8} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
