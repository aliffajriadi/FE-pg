import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export const APP_NAME = 'Autoko';

/** Logo Autoko: ikon + wordmark. `inverted` untuk latar navy. */
export function Logo({ className, inverted = false, size = 'md' }: { className?: string; inverted?: boolean; size?: 'md' | 'lg' }) {
  const large = size === 'lg';
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md',
          large ? 'size-10' : 'size-8',
          inverted ? 'bg-white text-[#1d3557]' : 'bg-primary text-primary-foreground'
        )}
      >
        <ShoppingCart className={large ? 'size-6' : 'size-5'} />
      </span>
      <span className={cn('font-bold tracking-tight', large ? 'text-2xl' : 'text-lg')}>{APP_NAME}</span>
    </span>
  );
}
