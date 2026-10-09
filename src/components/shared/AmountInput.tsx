'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const formatter = new Intl.NumberFormat('id-ID');

/**
 * Input nominal Rupiah besar dengan pemisah ribuan otomatis (10.000).
 * Nilainya number (atau undefined bila kosong), jadi cocok dipasang lewat Controller.
 */
export function AmountInput({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  autoFocus,
}: {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold',
          value ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        Rp
      </span>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={invalid}
        className="h-14 pl-12 text-2xl font-semibold tabular-nums md:text-2xl"
        value={value === undefined ? '' : formatter.format(value)}
        onBlur={onBlur}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
          onChange(digits ? Number(digits) : undefined);
        }}
      />
    </div>
  );
}
