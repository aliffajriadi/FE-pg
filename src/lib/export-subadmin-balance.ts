import { format } from 'date-fns';
import { toast } from 'sonner';
import { downloadExcelSheets, fetchAllPages, RUPIAH_FORMAT, type ExcelColumn } from '@/lib/export-excel';
import type { DailyRecap, DailyRecapRow, SubadminBalanceLog } from '@/lib/api/subadmin';
import type { PaginatedResponse } from '@/types';

const LOG_TYPE_LABEL: Record<SubadminBalanceLog['type'], string> = { PAYMENT: 'Uang Masuk', ADD: 'Ditambah Admin', SUBTRACT: 'Dikurangi Admin' };

const rupiah = (value: number) => ({ value, type: Number, format: RUPIAH_FORMAT });
// Tanggal ditulis sebagai teks agar tidak bergeser zona waktu di Excel
const dayText = (date: string) => (date ? format(new Date(`${date}T00:00:00`), 'dd/MM/yyyy') : 'TOTAL');

const RECAP_COLUMNS: ExcelColumn<DailyRecapRow>[] = [
  { header: 'Tanggal', width: 12, cell: (d) => ({ value: dayText(d.date), fontWeight: d.date ? undefined : 'bold' }) },
  { header: 'Transaksi', width: 10, cell: (d) => ({ value: d.count, type: Number }) },
  { header: 'Total Masuk', width: 15, cell: (d) => rupiah(d.incoming) },
  { header: 'Hak Merchant', width: 15, cell: (d) => rupiah(d.merchant) },
  { header: 'Fee', width: 12, cell: (d) => rupiah(d.fee) },
  { header: 'Kode Unik', width: 11, cell: (d) => rupiah(d.unique) },
  { header: 'Ditambah Admin', width: 15, cell: (d) => rupiah(d.added) },
  { header: 'Dikurangi Admin', width: 15, cell: (d) => rupiah(d.subtracted) },
  { header: 'Perubahan Saldo', width: 16, cell: (d) => rupiah(d.incoming + d.added - d.subtracted) },
];

const LOG_COLUMNS: ExcelColumn<SubadminBalanceLog>[] = [
  { header: 'Waktu', width: 17, cell: (l) => ({ value: format(new Date(l.occurredAt), 'dd/MM/yyyy HH:mm') }) },
  { header: 'Jenis', width: 16, cell: (l) => ({ value: LOG_TYPE_LABEL[l.type] }) },
  { header: 'Kode Invoice', width: 26, cell: (l) => ({ value: l.order?.invoiceCode ?? '' }) },
  { header: 'Merchant', width: 22, cell: (l) => ({ value: l.order?.store.name ?? '' }) },
  { header: 'QRIS', width: 18, cell: (l) => ({ value: l.qris?.name ?? '' }) },
  { header: 'Keterangan', width: 30, cell: (l) => ({ value: l.order ? l.order.productName : (l.description ?? '') }) },
  { header: 'Oleh', width: 16, cell: (l) => ({ value: l.createdBy?.name ?? '' }) },
  { header: 'Hak Merchant', width: 14, cell: (l) => (l.order ? rupiah(l.order.amount) : null) },
  { header: 'Fee', width: 11, cell: (l) => (l.order ? rupiah(l.order.platformFee) : null) },
  { header: 'Kode Unik', width: 11, cell: (l) => (l.order ? rupiah(l.amount - l.order.amount - l.order.platformFee) : null) },
  // Bertanda agar kolom bisa langsung dijumlahkan menjadi perubahan saldo
  { header: 'Nominal', width: 14, cell: (l) => rupiah(l.type === 'SUBTRACT' ? -l.amount : l.amount) },
];

const slug = (text: string) => text.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

/** Unduh rekap saldo sub admin (sheet rekap harian + sheet detail mutasi) untuk rentang tanggal terpilih. */
export async function exportSubadminBalance({
  recap,
  fetchLogs,
  name,
}: {
  recap: DailyRecap;
  fetchLogs: (params: { page: number; limit: number; from: string; to: string }) => Promise<PaginatedResponse<SubadminBalanceLog>>;
  name?: string;
}) {
  const toastId = toast.loading('Menyiapkan data...');
  try {
    const logs = await fetchAllPages(
      (page, limit) => fetchLogs({ page, limit, ...recap.range }),
      (loaded, total) => toast.loading(`Mengambil mutasi ${loaded.toLocaleString('id-ID')} / ${total.toLocaleString('id-ID')}...`, { id: toastId })
    );
    const days = [...recap.days].reverse(); // lama -> baru
    const fileName = ['rekap-saldo', name && slug(name), `${recap.range.from}_sd_${recap.range.to}`].filter(Boolean).join('_');
    await downloadExcelSheets(
      [
        { name: 'Rekap Harian', rows: [...days, { date: '', ...recap.totals }], columns: RECAP_COLUMNS },
        { name: 'Mutasi', rows: [...logs].reverse(), columns: LOG_COLUMNS },
      ],
      `${fileName}.xlsx`
    );
    toast.success(`Rekap ${days.length} hari (${logs.length.toLocaleString('id-ID')} mutasi) berhasil diekspor`, { id: toastId });
  } catch (error) {
    toast.error((error as Error).message || 'Gagal mengekspor data', { id: toastId });
  }
}
