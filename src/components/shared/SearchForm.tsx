'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Input pencarian yang baru dijalankan saat tombol Cari / Enter ditekan. */
export function SearchForm({
  defaultValue = '',
  placeholder = 'Cari...',
  onSearch,
  fill = false,
}: {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
  /** Lebarkan mengisi ruang yang tersedia (untuk baris toolbar) */
  fill?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      className={cn('flex w-full gap-2', fill ? 'min-w-0 flex-1' : 'sm:w-auto')}
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={fill ? 'min-w-0 flex-1' : 'sm:w-60'}
      />
      <Button type="submit" variant="secondary">
        <Search /> Cari
      </Button>
    </form>
  );
}
