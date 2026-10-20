import jsQR from 'jsqr';
import type { MypgProvider } from '@/lib/api/mypg';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Ukuran sisi terpanjang yang dicoba berurutan; QR kecil/halus kadang hanya terbaca pada skala tertentu
const SCALES = [1600, 1000, 600, 2400];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('File bukan gambar yang valid'));
    };
    img.src = url;
  });
}

/** Baca teks QR dari file gambar (QRIS statis). Melempar Error berpesan bahasa Indonesia bila gagal. */
export async function decodeQrFromImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar (JPG, PNG, atau WEBP)');
  if (file.size > MAX_FILE_BYTES) throw new Error('Ukuran gambar maksimal 10 MB');

  const img = await loadImage(file);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Browser tidak mendukung pembacaan gambar');

  for (const target of SCALES) {
    const scale = Math.min(1, target / longest);
    // Perbesar hanya pada percobaan terakhir untuk gambar kecil
    const ratio = target > longest && target === SCALES[SCALES.length - 1] ? target / longest : scale;
    canvas.width = Math.round(img.naturalWidth * ratio);
    canvas.height = Math.round(img.naturalHeight * ratio);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
    if (result?.data) return result.data.trim();
  }
  throw new Error('QR tidak terbaca. Gunakan gambar QRIS yang jelas, tidak buram, dan tidak terpotong.');
}

/** Ambil nilai tag level atas dari string QRIS (format TLV). */
function topLevelTag(qris: string, wanted: string): string | null {
  let i = 0;
  while (i + 4 <= qris.length) {
    const tag = qris.slice(i, i + 2);
    const len = parseInt(qris.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len)) return null;
    const value = qris.slice(i + 4, i + 4 + len);
    if (tag === wanted) return value;
    i += 4 + len;
  }
  return null;
}

/** Tebak aplikasi penerima dan nama toko dari isi QRIS. provider null bila tidak dikenali. */
export function inspectQris(qris: string): { provider: MypgProvider | null; merchantName: string | null } {
  const upper = qris.toUpperCase();
  const provider: MypgProvider | null = upper.includes('DANA')
    ? 'DANA'
    : upper.includes('SHOPEE')
      ? 'SHOPEEPAY'
      : /GOPAY|GO-JEK|GOJEK/.test(upper)
        ? 'GOPAY'
        : null;
  const name = topLevelTag(qris, '59')?.trim();
  return { provider, merchantName: name ? name.slice(0, 60) : null };
}
