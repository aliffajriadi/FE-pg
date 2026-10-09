'use client';

import { useEffect, useState } from 'react';

/** Nilai yang baru ikut berubah setelah `delay` ms tanpa perubahan, untuk menahan request saat mengetik. */
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
