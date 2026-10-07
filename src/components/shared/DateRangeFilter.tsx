'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface DateRange {
  /** Format YYYY-MM-DD (nilai input type="date"), string kosong = tidak dibatasi */
  from: string;
  to: string;
}

export const EMPTY_RANGE: DateRange = { from: '', to: '' };

/** Ubah rentang tanggal (zona waktu browser) menjadi ISO untuk query API. */
export function rangeToQuery({ from, to }: DateRange) {
  return {
    startDate: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    endDate: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
  };
}

export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (value: DateRange) => void }) {
  const isActive = value.from || value.to;

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Input
        type="date"
        aria-label="Dari tanggal"
        value={value.from}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        className="min-w-0 flex-1 sm:w-40 sm:flex-none"
      />
      <span className="shrink-0 text-sm text-muted-foreground">s/d</span>
      <Input
        type="date"
        aria-label="Sampai tanggal"
        value={value.to}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        className="min-w-0 flex-1 sm:w-40 sm:flex-none"
      />
      {isActive && (
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onChange(EMPTY_RANGE)} aria-label="Hapus filter tanggal" title="Hapus filter tanggal">
          <X />
        </Button>
      )}
    </div>
  );
}
