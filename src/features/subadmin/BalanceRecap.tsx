'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/types';
import type { DailyRecap, PaymentBreakdown } from '@/lib/api/subadmin';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableState } from '@/components/shared/TableState';
import { CustomRangeInput, PeriodSelect, dayLabel, rangeText, usePeriodRange } from './period';

/** Rincian uang masuk: siapa pemilik uang yang dipegang sub admin. */
export function BalanceBreakdown({ breakdown }: { breakdown: PaymentBreakdown }) {
  const rows = [
    { label: 'Hak merchant', value: breakdown.merchant, hint: 'Nominal invoice, sudah masuk saldo merchant' },
    { label: 'Fee platform', value: breakdown.fee, hint: 'Pendapatan platform' },
    { label: 'Kode unik', value: breakdown.unique, hint: 'Tambahan kecil agar nominal unik' },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {rows.map((r) => (
        <div key={r.label} className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{r.label}</p>
          <p className="font-semibold">{formatCurrency(r.value)}</p>
          <p className="text-[11px] text-muted-foreground">{r.hint}</p>
        </div>
      ))}
    </div>
  );
}

const money = (value: number) => (value ? formatCurrency(value) : '-');

/** Rekap pendapatan per hari (WIB) dengan pilihan periode. Dipakai halaman Saldo sub admin & dialog saldo super admin. */
export function DailyRecapTable({
  id,
  queryKey,
  fetchRecap,
}: {
  id: string;
  queryKey: unknown[];
  fetchRecap: (range: { from: string; to: string }) => Promise<ApiResponse<DailyRecap>>;
}) {
  const periodState = usePeriodRange('7d');
  const { range, rangeError } = periodState;

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKey, range],
    queryFn: () => fetchRecap(range),
    select: (res) => res.data,
    enabled: !rangeError,
    placeholderData: keepPreviousData,
  });

  const showAdjust = !!data && (data.totals.added > 0 || data.totals.subtracted > 0);
  const cols = showAdjust ? 8 : 6;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Rekap Pendapatan Harian</h2>
          {data && <p className="text-xs text-muted-foreground">Periode {rangeText(data.range)} (WIB)</p>}
        </div>
        <PeriodSelect id={id} state={periodState} />
      </div>
      <CustomRangeInput state={periodState} />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Transaksi</TableHead>
              <TableHead className="text-right">Total Masuk</TableHead>
              <TableHead className="text-right">Hak Merchant</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead className="text-right">Kode Unik</TableHead>
              {showAdjust && <TableHead className="text-right">Ditambah</TableHead>}
              {showAdjust && <TableHead className="text-right">Dikurangi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState colSpan={cols} isLoading={isLoading} error={error} isEmpty={!data?.days.length} emptyText="Tidak ada data" />
            {data?.days.map((d) => (
              <TableRow key={d.date} className={d.count || d.added || d.subtracted ? undefined : 'text-muted-foreground'}>
                <TableCell className="whitespace-nowrap">{dayLabel(d.date, true)}</TableCell>
                <TableCell className="text-right">{d.count.toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">{money(d.incoming)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{money(d.merchant)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{money(d.fee)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{money(d.unique)}</TableCell>
                {showAdjust && <TableCell className="text-right whitespace-nowrap">{money(d.added)}</TableCell>}
                {showAdjust && <TableCell className="text-right whitespace-nowrap text-destructive">{money(d.subtracted)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
          {data && data.days.length > 1 && (
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{data.totals.count.toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatCurrency(data.totals.incoming)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatCurrency(data.totals.merchant)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatCurrency(data.totals.fee)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatCurrency(data.totals.unique)}</TableCell>
                {showAdjust && <TableCell className="text-right whitespace-nowrap">{formatCurrency(data.totals.added)}</TableCell>}
                {showAdjust && (
                  <TableCell className="text-right whitespace-nowrap text-destructive">{formatCurrency(data.totals.subtracted)}</TableCell>
                )}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
