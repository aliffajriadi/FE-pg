import { addMonths, format } from 'date-fns';
import { toast } from 'sonner';
import { downloadExcel, fetchAllPages, RUPIAH_FORMAT, type ExcelColumn } from '@/lib/export-excel';
import { statusLabel } from '@/lib/status';
import type { DateRange } from '@/components/shared/DateRangeFilter';
import type { Order, PaginatedResponse } from '@/types';

type Row = Order & { store?: { name: string } | null };

// Tanggal ditulis sebagai teks waktu lokal (WIB di browser pengguna) agar tidak bergeser zona waktu di Excel
const dateText = (value: string | null) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '');
const rupiah = (value: number) => ({ value, type: Number, format: RUPIAH_FORMAT });

function columns(includeStore: boolean): ExcelColumn<Row>[] {
  return [
    { header: 'Tanggal', width: 17, cell: (o) => ({ value: dateText(o.createdAt) }) },
    ...(includeStore ? [{ header: 'Merchant', width: 22, cell: (o: Row) => ({ value: o.store?.name ?? '-' }) }] : []),
    { header: 'Kode Invoice', width: 26, cell: (o) => ({ value: o.invoiceCode }) },
    { header: 'Produk', width: 32, cell: (o) => ({ value: o.productName }) },
    { header: 'Pelanggan', width: 20, cell: (o) => ({ value: o.customerName ?? '' }) },
    { header: 'Kontak', width: 18, cell: (o) => ({ value: o.customerContact ?? '' }) },
    { header: 'Nominal', width: 13, cell: (o) => rupiah(o.amount) },
    { header: 'Biaya Layanan', width: 13, cell: (o) => rupiah(o.platformFee) },
    { header: 'Total Dibayar', width: 14, cell: (o) => rupiah(o.totalAmount) },
    { header: 'Diterima Merchant', width: 17, cell: (o) => rupiah(o.netAmount) },
    { header: 'Status', width: 13, cell: (o) => ({ value: statusLabel(o.paymentStatus) }) },
    { header: 'Metode', width: 10, cell: (o) => ({ value: o.paymentMethod ?? '' }) },
    { header: 'Dibayar Pada', width: 17, cell: (o) => ({ value: dateText(o.paidAt) }) },
  ];
}

function fileName(prefix: string, range: DateRange) {
  const period = range.from || range.to ? `${range.from || 'awal'}_sd_${range.to || 'sekarang'}` : format(new Date(), 'yyyy-MM-dd');
  return `${prefix}_${period}.xlsx`;
}

/** Pesan error bila rentang tanggal export tidak diisi lengkap atau melebihi `maxMonths`, null bila valid. */
export function exportRangeError({ from, to }: DateRange, maxMonths: number) {
  if (!from || !to) return `Pilih tanggal awal dan akhir dulu (maksimal ${maxMonths} bulan)`;
  const limit = addMonths(new Date(`${from}T00:00:00`), maxMonths);
  return new Date(`${to}T00:00:00`) > limit ? `Rentang export maksimal ${maxMonths} bulan` : null;
}

/** Ambil seluruh transaksi sesuai filter aktif lalu unduh sebagai .xlsx, dengan progres di toast. */
export async function exportTransactions<T extends Row>({
  fetchPage,
  includeStore,
  range,
  prefix,
  maxMonths,
}: {
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>;
  includeStore: boolean;
  range: DateRange;
  prefix: string;
  /** Wajib filter tanggal dengan rentang maksimal sekian bulan; kosong = tanpa batas */
  maxMonths?: number;
}) {
  const rangeError = maxMonths ? exportRangeError(range, maxMonths) : null;
  if (rangeError) {
    toast.error(rangeError);
    return;
  }

  const toastId = toast.loading('Menyiapkan data...');
  try {
    const rows = await fetchAllPages(fetchPage, (loaded, total) =>
      toast.loading(`Mengambil data ${loaded.toLocaleString('id-ID')} / ${total.toLocaleString('id-ID')}...`, { id: toastId })
    );
    if (!rows.length) {
      toast.info('Tidak ada transaksi untuk diekspor', { id: toastId });
      return;
    }
    await downloadExcel(rows, columns(includeStore), fileName(prefix, range));
    toast.success(`${rows.length.toLocaleString('id-ID')} transaksi berhasil diekspor`, { id: toastId });
  } catch (error) {
    toast.error((error as Error).message || 'Gagal mengekspor data', { id: toastId });
  }
}
