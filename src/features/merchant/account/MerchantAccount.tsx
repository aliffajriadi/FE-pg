'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, KeyRound, Mail, Receipt, Store as StoreIcon, TrendingUp, Trophy, Wallet, Webhook } from 'lucide-react';
import { merchantApi, type MerchantStats } from '@/lib/api/merchant';
import { useMe } from '@/features/auth/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge, ToneBadge } from '@/components/shared/StatusBadge';
import { TIER_STYLE, TierBadge } from '@/components/shared/TierBadge';
import type { Store, User } from '@/types';
import { describeFeeRule } from '../withdrawals/fee';
import { PasswordCard, ProfileCard } from './ProfileForms';

function ProfileHero({ user, store, stats }: { user: User; store: Store | null; stats?: MerchantStats }) {
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
              <ToneBadge tone="info">Merchant</ToneBadge>
              {stats?.tier.current && <TierBadge tier={stats.tier.current} />}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <Mail className="size-4 shrink-0" /> <span className="truncate">{user.email}</span>
              </span>
              {store && (
                <span className="flex items-center gap-1.5">
                  <StoreIcon className="size-4 shrink-0" /> {store.name}
                </span>
              )}
              {user.createdAt && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 shrink-0" /> Bergabung {formatDate(user.createdAt, false)}
                </span>
              )}
            </div>
          </div>
          {store && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground sm:pb-1">
              Status toko <StatusBadge status={store.status} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium break-words">{children}</div>
      </div>
    </div>
  );
}

const formatTierValue = (basis: MerchantStats['tier']['basis'], value: number) =>
  basis === 'VOLUME' ? formatCurrency(value) : `${value.toLocaleString('id-ID')} transaksi`;

function TierCard({ stats }: { stats?: MerchantStats }) {
  if (!stats) return <Skeleton className="h-56 rounded-xl" />;

  const { tier } = stats;
  const floor = tier.current?.min ?? 0;
  const progress = tier.next ? Math.min(100, Math.max(0, ((tier.value - floor) / (tier.next.min - floor)) * 100)) : 100;
  const barClass = TIER_STYLE[(tier.next ?? tier.current)?.color ?? 'bronze'].bar;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" /> Level Merchant
        </CardTitle>
        <CardDescription>
          Ditentukan dari {tier.basis === 'VOLUME' ? 'total volume' : 'jumlah'} transaksi berhasil.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          {tier.current ? (
            <TierBadge tier={tier.current} className="px-3 py-1 text-sm" />
          ) : (
            <span className="text-sm text-muted-foreground">Belum ada level</span>
          )}
          {tier.next && <TierBadge tier={tier.next} className="opacity-60" />}
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {tier.next ? (
              <>
                Butuh <strong className="text-foreground">{formatTierValue(tier.basis, tier.remaining)}</strong> lagi untuk
                naik ke {tier.next.name}.
              </>
            ) : (
              'Anda sudah berada di level tertinggi.'
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" /> Total Volume
            </p>
            <p className="mt-1 truncate text-lg font-bold">{formatCurrency(stats.totalVolume)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Receipt className="size-3.5" /> Transaksi Berhasil
            </p>
            <p className="mt-1 truncate text-lg font-bold">{stats.paidCount.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StoreInfoCard({ user, store }: { user: User; store: Store }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StoreIcon className="size-4 text-primary" /> Informasi Toko
        </CardTitle>
        <CardDescription>Ketentuan ini diatur oleh admin. Hubungi support jika perlu perubahan.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <InfoRow icon={StoreIcon} label="Nama Toko">
          {store.name}
          <p className="font-mono text-xs font-normal text-muted-foreground">{store.slug}</p>
        </InfoRow>
        <InfoRow icon={Wallet} label="Biaya Penarikan">
          {describeFeeRule(store)}
          {store.wdMaxAmount && (
            <p className="text-xs font-normal text-muted-foreground">Maks {formatCurrency(store.wdMaxAmount)} per transaksi</p>
          )}
        </InfoRow>
        <InfoRow icon={Clock} label="Hold Saldo">
          {store.balanceHoldHours} jam
        </InfoRow>
        {(user.apiKeyLimit !== undefined || user.webhookLimit !== undefined) && (
          <InfoRow icon={KeyRound} label="Batas Integrasi">
            <span className="flex flex-wrap gap-x-3">
              <span>{user.apiKeyLimit ?? '-'} API Key</span>
              <span className="flex items-center gap-1">
                <Webhook className="size-3.5 text-muted-foreground" /> {user.webhookLimit ?? '-'} Webhook
              </span>
            </span>
          </InfoRow>
        )}
        <InfoRow icon={CalendarDays} label="Toko Terdaftar">
          {formatDate(store.createdAt, false)}
        </InfoRow>
      </CardContent>
    </Card>
  );
}

export default function MerchantAccount() {
  const { data, isLoading, error } = useMe();
  const stats = useQuery({ queryKey: ['merchant-stats'], queryFn: merchantApi.getStats, select: (r) => r.data });

  return (
    <>
      <PageHeader title="Akun Saya" description="Profil, informasi toko, dan keamanan akun Anda." />

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
          <ProfileHero user={data.user} store={data.store} stats={stats.data} />
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="space-y-4">
              {stats.isError ? null : <TierCard stats={stats.data} />}
              {data.store && <StoreInfoCard user={data.user} store={data.store} />}
            </div>
            <div className="space-y-4">
              <ProfileCard />
              <PasswordCard />
            </div>
          </div>
        </>
      )}
    </>
  );
}
