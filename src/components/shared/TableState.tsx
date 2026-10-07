import { Loader2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';

/** Baris tabel untuk kondisi loading / error / kosong. Return null jika data siap ditampilkan. */
export function TableState({
  colSpan,
  isLoading,
  error,
  isEmpty,
  emptyText = 'Belum ada data',
}: {
  colSpan: number;
  isLoading: boolean;
  error?: Error | null;
  isEmpty: boolean;
  emptyText?: string;
}) {
  let content: React.ReactNode = null;
  if (isLoading) {
    content = (
      <span className="inline-flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Memuat data...
      </span>
    );
  } else if (error) {
    content = <span className="text-destructive">Gagal memuat data: {error.message}</span>;
  } else if (isEmpty) {
    content = emptyText;
  }

  if (!content) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center text-muted-foreground">
        {content}
      </TableCell>
    </TableRow>
  );
}
