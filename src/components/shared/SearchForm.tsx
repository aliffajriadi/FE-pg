'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Input pencarian yang baru dijalankan saat tombol Cari / Enter ditekan. */
export function SearchForm({
  defaultValue = '',
  placeholder = 'Cari...',
  onSearch,
}: {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      className="flex w-full gap-2 sm:w-auto"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="sm:w-60"
      />
      <Button type="submit" variant="secondary">
        <Search /> Cari
      </Button>
    </form>
  );
}
