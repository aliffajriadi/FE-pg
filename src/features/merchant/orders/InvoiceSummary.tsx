import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { InvoicePreview } from '@/lib/api/merchant';

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? 'font-medium' : 'text-muted-foreground'}>{label}</dt>
      <dd className={strong ? 'text-base font-semibold tabular-nums' : 'tabular-nums'}>{value}</dd>
    </div>
  );
}

/** Rincian biaya yang diperbarui langsung saat nominal diisi. */
export function InvoiceSummary({
  preview,
  loading,
  hasAmount,
}: {
  preview?: InvoicePreview;
  loading: boolean;
  hasAmount: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ringkasan</p>

      {preview ? (
        <dl className="space-y-2.5 text-sm">
          <Row label="Nominal pesanan" value={formatCurrency(preview.amount)} />
          <Row label="Biaya layanan" value={`+ ${formatCurrency(preview.platformFee)}`} />
          {!!preview.uniqueCode && (
            <div>
              <Row label="Kode unik" value={`+ ${formatCurrency(preview.uniqueCode)}`} />
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dibuat agar pembayaran terdeteksi otomatis. Angka final tampil setelah invoice dibuat.
              </p>
            </div>
          )}
          <div className="border-t pt-2.5">
            <Row label="Pelanggan membayar" value={formatCurrency(preview.totalAmount)} strong />
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-3">
            <Row
              label="Anda terima"
              value={<span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(preview.netAmount)}</span>}
              strong
            />
            <p className="mt-1 text-xs text-muted-foreground">Biaya layanan dibayar pelanggan, bukan dipotong dari Anda.</p>
          </div>
        </dl>
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {hasAmount ? 'Nominal belum valid.' : 'Isi nominal untuk melihat rincian biaya dan jumlah yang Anda terima.'}
        </p>
      )}
    </div>
  );
}
