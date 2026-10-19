'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MinusCircle } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableState } from '@/components/shared/TableState';
import { Pagination } from '@/components/shared/Pagination';
import { AdjustCard } from './AdjustCard';

const LOG_LIMIT = 10;
const DEDUCT_OPTIONS = [{ value: 'DEDUCT' as const, label: 'Kurangi Pendapatan', icon: MinusCircle, out: true }];

export const incomeKey = (id: number) => ['admin-subadmin-income', id];

/** Tab Pendapatan: rincian saldo pendapatan, form pengurangan, dan riwayat pengurangan. */
export function SubadminIncomePanel({ subadminId }: { subadminId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: [...incomeKey(subadminId), page],
    queryFn: () => adminApi.getSubadminIncome(subadminId, { page, limit: LOG_LIMIT }),
    placeholderData: keepPreviousData,
  });
  const detail = data?.data;

  const deduct = useApiMutation(
    ({ amount, description }: { amount: number; description?: string }) =>
      adminApi.deductSubadminIncome(subadminId, { amount, description }),
    {
      // Saldo dipegang ikut berkurang, jadi ringkasan, riwayat, dan rekap saldo juga di-refresh
      invalidate: [
        ['admin-subadmins'],
        incomeKey(subadminId),
        ['admin-subadmin-balance', subadminId],
        ['admin-subadmin-logs', subadminId],
        ['admin-subadmin-daily', subadminId],
      ],
      onSuccess: () => setPage(1),
    },
  );

  const parts = [
    { label: 'Fee platform', hint: 'Dari invoice di QRIS-nya', value: detail?.earned.fee },
    { label: 'Kode unik', hint: 'Tambahan nominal unik', value: detail?.earned.unique },
    { label: 'Biaya admin penarikan', hint: 'Dari penarikan yang ia transfer', value: detail?.earned.withdrawalFee },
  ];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Rincian Pendapatan</CardTitle>
            <CardDescription>Pendapatan platform yang ada di uang yang dipegang sub admin ini, dihitung sejak awal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {parts.map((p) => (
                <div key={p.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="font-semibold">{p.value === undefined ? '…' : formatCurrency(p.value)}</p>
                  <p className="text-[11px] text-muted-foreground">{p.hint}</p>
                </div>
              ))}
            </div>
            <div className="divide-y rounded-lg border text-sm">
              <div className="flex justify-between px-3 py-2">
                <span className="text-muted-foreground">Total pendapatan</span>
                <span className="font-medium">{detail ? formatCurrency(detail.earned.total) : '…'}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-muted-foreground">Sudah dikurangi</span>
                <span className="font-medium text-destructive">{detail ? `− ${formatCurrency(detail.deducted)}` : '…'}</span>
              </div>
              <div className="flex justify-between bg-muted/40 px-3 py-2">
                <span className="font-semibold">Saldo pendapatan</span>
                <span className="font-bold">{detail ? formatCurrency(detail.income) : '…'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Riwayat Pengurangan</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={3}
                isLoading={isLoading}
                error={error}
                isEmpty={!detail?.logs.length}
                emptyText="Belum ada pengurangan"
              />
              {detail?.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm">{log.description || '-'}</p>
                    {log.createdBy && <p className="text-xs text-muted-foreground">oleh {log.createdBy.name}</p>}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap text-destructive">
                    − {formatCurrency(log.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Pagination page={page} totalPages={data?.pagination.totalPages ?? 1} onPageChange={setPage} />
      </div>

      <AdjustCard
        title="Kurangi Saldo Pendapatan"
        description="Saat pendapatan sudah disetor. Saldo dipegang ikut berkurang sebesar nominal ini."
        current={detail?.income}
        currentLabel="Saldo pendapatan"
        options={DEDUCT_OPTIONS}
        notePlaceholder="Mis. pendapatan Oktober sudah disetor"
        onSubmit={({ amount, description }) => deduct.mutateAsync({ amount, description })}
      />
    </div>
  );
}
