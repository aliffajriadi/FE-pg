'use client';

import { useState } from 'react';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { DateRangeFilter, type DateRange } from '@/components/shared/DateRangeFilter';

// Pilihan periode statistik sub admin (tanggal WIB), dipakai dashboard & rekap harian saldo
export type Period = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hari ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'custom', label: 'Pilih tanggal...' },
];
const MAX_RANGE_DAYS = 92;
const DAY_MS = 24 * 60 * 60 * 1000;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Tanggal WIB (YYYY-MM-DD), mundur `daysAgo` hari dari hari ini. */
const wibDate = (daysAgo = 0) => new Date(Date.now() + WIB_OFFSET_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);

function presetRange(period: Exclude<Period, 'custom'>): DateRange {
  switch (period) {
    case 'today':
      return { from: wibDate(), to: wibDate() };
    case 'yesterday':
      return { from: wibDate(1), to: wibDate(1) };
    case '7d':
      return { from: wibDate(6), to: wibDate() };
    case '30d':
      return { from: wibDate(29), to: wibDate() };
    case 'month':
      return { from: `${wibDate().slice(0, 8)}01`, to: wibDate() };
  }
}

const daysBetween = ({ from, to }: DateRange) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;

export const dayLabel = (date: string, withYear = false) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: withYear ? 'short' : undefined,
    day: '2-digit',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  });

/** Label rentang dari respons API, mis. "12 Okt – Sab, 18 Okt 2026". */
export const rangeText = (range: DateRange) =>
  range.from === range.to ? dayLabel(range.from, true) : `${dayLabel(range.from)} – ${dayLabel(range.to, true)}`;

/** State periode terpilih; range siap dikirim ke API, rangeError diisi bila tanggal custom belum valid. */
export function usePeriodRange(initial: Exclude<Period, 'custom'> = '7d') {
  const [period, setPeriod] = useState<Period>(initial);
  const [custom, setCustom] = useState<DateRange>(() => presetRange(initial));

  const range = period === 'custom' ? custom : presetRange(period);
  const rangeError =
    period !== 'custom'
      ? null
      : !custom.from || !custom.to
        ? 'Pilih tanggal awal dan akhir'
        : daysBetween(custom) > MAX_RANGE_DAYS
          ? `Rentang maksimal ${MAX_RANGE_DAYS} hari`
          : null;

  const changePeriod = (value: string) => {
    const next = (value || initial) as Period;
    if (next === 'custom') setCustom(range);
    setPeriod(next);
  };

  return { period, changePeriod, custom, setCustom, range, rangeError };
}

export function PeriodSelect({ id, state }: { id: string; state: ReturnType<typeof usePeriodRange> }) {
  return <SimpleSelect id={id} value={state.period} onValueChange={state.changePeriod} options={PERIOD_OPTIONS} className="sm:w-44" />;
}

/** Input tanggal custom, tampil hanya saat "Pilih tanggal..." dipilih. */
export function CustomRangeInput({ state }: { state: ReturnType<typeof usePeriodRange> }) {
  if (state.period !== 'custom') return null;
  return (
    <div className="flex flex-col gap-1">
      <DateRangeFilter value={state.custom} onChange={state.setCustom} />
      {state.rangeError && <p className="text-xs text-destructive">{state.rangeError}</p>}
    </div>
  );
}
