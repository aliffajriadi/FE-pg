import type { BalanceLogType, SubadminBalanceLog } from '@/lib/api/subadmin';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableState } from '@/components/shared/TableState';
import { ToneBadge } from '@/components/shared/StatusBadge';

export const BALANCE_LOG_LABEL: Record<BalanceLogType, { label: string; tone: 'success' | 'info' | 'warning' }> = {
  PAYMENT: { label: 'Uang Masuk', tone: 'success' },
  ADD: { label: 'Ditambah Admin', tone: 'info' },
  SUBTRACT: { label: 'Dikurangi Admin', tone: 'warning' },
  WITHDRAWAL: { label: 'Penarikan Merchant', tone: 'warning' },
};

export const BALANCE_LOG_TABS = [
  { value: 'ALL', label: 'Semua' },
  ...Object.entries(BALANCE_LOG_LABEL).map(([value, { label }]) => ({ value, label })),
];

/** Riwayat mutasi saldo sub admin, dipakai di halaman Saldo sub admin dan dialog saldo super admin. */
export function BalanceLogTable({ logs, isLoading, error }: { logs: SubadminBalanceLog[]; isLoading: boolean; error: Error | null }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Jenis</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead className="text-right">Nominal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableState colSpan={4} isLoading={isLoading} error={error} isEmpty={!logs.length} emptyText="Belum ada riwayat saldo" />
        {logs.map((log) => {
          const { label, tone } = BALANCE_LOG_LABEL[log.type];
          const isOut = log.type === 'SUBTRACT' || log.type === 'WITHDRAWAL';
          return (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(log.occurredAt)}</TableCell>
              <TableCell>
                <ToneBadge tone={tone}>{label}</ToneBadge>
              </TableCell>
              <TableCell className="max-w-xs">
                {log.withdrawal ? (
                  <>
                    <p className="text-sm">
                      Penarikan #{log.withdrawal.id} · {log.withdrawal.store.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.withdrawal.bankName} {log.withdrawal.bankAccount} a.n. {log.withdrawal.bankHolderName}
                    </p>
                  </>
                ) : log.order ? (
                  <>
                    <p className="font-mono text-xs">{log.order.invoiceCode}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.order.store.name}
                      {log.qris && ` · ${log.qris.name}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm">{log.description || '-'}</p>
                    {log.createdBy && <p className="text-xs text-muted-foreground">oleh {log.createdBy.name}</p>}
                  </>
                )}
              </TableCell>
              <TableCell className={cn('text-right font-medium whitespace-nowrap', isOut ? 'text-destructive' : 'text-emerald-600')}>
                {isOut ? '−' : '+'}
                {formatCurrency(log.amount)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
