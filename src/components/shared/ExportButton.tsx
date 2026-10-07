'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExportButton({ onExport }: { onExport: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onExport();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Export Excel
    </Button>
  );
}
