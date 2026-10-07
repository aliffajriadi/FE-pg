import type { Cell } from 'write-excel-file/browser';
import type { PaginatedResponse } from '@/types';

const PAGE_SIZE = 100; // batas maksimal limit di backend
const CONCURRENCY = 4;

export interface ExcelColumn<T> {
  header: string;
  width?: number;
  cell: (row: T) => Cell;
}

/** Format angka rupiah di Excel (tetap bertipe angka agar bisa dijumlahkan). */
export const RUPIAH_FORMAT = '#,##0';

/** Ambil semua halaman dari endpoint berpaginasi, beberapa request sekaligus. */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  onProgress?: (loaded: number, total: number) => void
): Promise<T[]> {
  const first = await fetchPage(1, PAGE_SIZE);
  const { total, totalPages } = first.pagination;
  const rows = [...first.data];
  onProgress?.(rows.length, total);

  const pages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2);
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = await Promise.all(pages.slice(i, i + CONCURRENCY).map((page) => fetchPage(page, PAGE_SIZE)));
    batch.forEach((res) => rows.push(...res.data));
    onProgress?.(rows.length, total);
  }
  return rows;
}

/** Tulis baris ke file .xlsx dan unduh. Library dimuat hanya saat dibutuhkan agar tidak membebani halaman. */
export async function downloadExcel<T>(rows: T[], columns: ExcelColumn<T>[], fileName: string) {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  await writeExcelFile(rows, {
    stickyRowsCount: 1,
    columns: columns.map((c) => ({
      width: c.width,
      header: { value: c.header, fontWeight: 'bold' },
      cell: (row: T) => c.cell(row),
    })),
  }).toFile(fileName);
}
