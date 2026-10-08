import { Crown, Gem, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MerchantTier, TierColor } from '@/lib/api/merchant';

export const TIER_STYLE: Record<TierColor, { label: string; className: string; bar: string }> = {
  bronze: {
    label: 'Bronze',
    className: 'border-orange-300 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 dark:border-orange-800 dark:from-orange-950 dark:to-amber-950 dark:text-orange-300',
    bar: 'bg-gradient-to-r from-orange-400 to-amber-600',
  },
  silver: {
    label: 'Silver',
    className: 'border-slate-300 bg-gradient-to-r from-slate-100 to-zinc-200 text-slate-700 dark:border-slate-600 dark:from-slate-800 dark:to-zinc-800 dark:text-slate-200',
    bar: 'bg-gradient-to-r from-slate-300 to-slate-500',
  },
  gold: {
    label: 'Gold',
    className: 'border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-800 dark:border-yellow-700 dark:from-yellow-950 dark:to-amber-900 dark:text-yellow-300',
    bar: 'bg-gradient-to-r from-yellow-400 to-amber-500',
  },
  platinum: {
    label: 'Platinum',
    className: 'border-cyan-200 bg-gradient-to-r from-cyan-50 to-slate-200 text-cyan-800 dark:border-cyan-800 dark:from-cyan-950 dark:to-slate-800 dark:text-cyan-200',
    bar: 'bg-gradient-to-r from-cyan-300 to-slate-400',
  },
  diamond: {
    label: 'Diamond',
    className: 'border-violet-300 bg-gradient-to-r from-sky-100 to-violet-200 text-violet-800 dark:border-violet-700 dark:from-sky-950 dark:to-violet-900 dark:text-violet-200',
    bar: 'bg-gradient-to-r from-sky-400 to-violet-500',
  },
};

const ICON: Record<TierColor, typeof Medal> = {
  bronze: Medal,
  silver: Medal,
  gold: Crown,
  platinum: Crown,
  diamond: Gem,
};

export function TierBadge({ tier, className }: { tier: MerchantTier; className?: string }) {
  const Icon = ICON[tier.color] ?? Medal;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        TIER_STYLE[tier.color]?.className ?? TIER_STYLE.bronze.className,
        className
      )}
    >
      <Icon className="size-3.5" /> {tier.name}
    </span>
  );
}
