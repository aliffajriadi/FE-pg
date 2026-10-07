/**
 * Animasi masuk halaman: murni CSS (fade + geser 8px, 200ms), tanpa JavaScript di client.
 * Dipakai di template.tsx sehingga diputar ulang setiap pindah halaman.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in space-y-6 duration-200 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      {children}
    </div>
  );
}
