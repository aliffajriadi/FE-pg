// Dokumentasi API MyPG: struktur & format sama dengan API live, dengan base path /api/mypg/v1.
import { ENDPOINTS, PAYMENT_STATUSES, WEBHOOK_PAYLOAD, type DocsVariant, type Endpoint } from './content';

const toMypg = (text: string) =>
  text
    .replaceAll('/api/v1', '/api/mypg/v1')
    .replaceAll('"platformFee": 500', '"platformFee": 0')
    .replaceAll('"totalAmount": 150500', '"totalAmount": 150001')
    .replaceAll('https://pay.pakasir.com/checkout/xxx', 'https://domain-anda.com/pay/mypg/INV-1722345678901-A3F2');

const ENDPOINT_NOTES: Record<string, Partial<Endpoint>> = {
  'create-invoice': {
    warning:
      'Lisensi MyPG harus aktif. Jika masa aktif habis, endpoint ini mengembalikan HTTP 402. Invoice sandbox (mp_test_) tetap bisa dibuat tanpa lisensi.',
    note:
      'totalAmount bisa lebih besar beberapa rupiah dari amount (kode unik, maksimal +999, bisa diatur di Pengaturan MyPG) agar setiap invoice yang menunggu punya total berbeda dan pembayaran dikenali otomatis. Tampilkan totalAmount ke pelanggan, atau arahkan ke paymentUrl. Field payment_number berisi QRIS dinamis dari QRIS milik Anda.',
  },
  'sync-invoice': {
    summary: 'Ambil status terbaru invoice',
    note: 'Status invoice MyPG diperbarui otomatis saat notifikasi pembayaran masuk di HP Anda. Endpoint ini mengembalikan status terkini (tersedia agar kompatibel dengan API live).',
  },
};

export const MYPG_ENDPOINTS: Endpoint[] = ENDPOINTS.map((ep) => ({
  ...ep,
  path: toMypg(ep.path),
  response: toMypg(ep.response).replace('"payment_number": "00020101...",', '"payment_number": "00020101...",\n    "payment": "mypg",'),
  ...(ep.request && { request: toMypg(ep.request) }),
  ...(ep.body && {
    body: ep.body.map((f) => (f.field === 'method' ? { ...f, desc: 'Metode pembayaran. Saat ini hanya qris' } : f)),
  }),
  ...ENDPOINT_NOTES[ep.id],
}));

export const MYPG_DOCS: DocsVariant = {
  title: 'Dokumentasi API MyPG',
  tagline: 'Terima pembayaran langsung ke QRIS milik Anda sendiri, terdeteksi otomatis dari notifikasi HP.',
  apiPath: '/api/mypg/v1',
  keyPrefix: 'mp',
  startSteps: [
    'Login ke Dashboard, pilih Panel MyPG (tersedia jika akses MyPG sudah diaktifkan admin).',
    'Buka Billing dan masukkan kode lisensi MyPG dari admin untuk mengaktifkan masa aktif.',
    'Buka Perangkat & QRIS: tambahkan QRIS DANA Bisnis, ShopeePay, atau GoPay milik Anda.',
    'Daftarkan HP penerima, pasang APK pelacak notifikasi, lalu isi URL Server dan API Key perangkat di APK.',
    'Buka Integrasi API: buat proyek (langsung aktif), tambahkan API Key MyPG dan Webhook.',
    'Panggil POST /api/mypg/v1/invoices dengan API Key di header x-api-key.',
    'Terima notifikasi lewat webhook dan verifikasi header X-Webhook-Signature.',
  ],
  endpoints: MYPG_ENDPOINTS,
  webhookSteps: [
    'Pelanggan membayar total invoice ke QRIS Anda.',
    'Aplikasi DANA Bisnis / ShopeePay / GoPay di HP Anda menampilkan notifikasi uang masuk.',
    'APK meneruskan notifikasi ke server kami, lalu nominalnya dicocokkan dengan invoice yang menunggu.',
    'Server memperbarui status invoice menjadi PAID.',
    'Server mengirim POST request ke semua Webhook MyPG aktif milik proyek yang membuat invoice.',
    'Endpoint Anda harus merespons HTTP 200 dalam 10 detik.',
  ],
  webhookPayload: toMypg(WEBHOOK_PAYLOAD),
  paymentStatuses: PAYMENT_STATUSES.filter(([s]) => s !== 'REFUNDED' && s !== 'PENDING').map(([s, d]) => [
    s,
    s === 'PAID'
      ? 'Pembayaran terdeteksi dari notifikasi HP Anda, atau ditandai lunas manual oleh merchant. Dana masuk langsung ke akun QRIS Anda'
      : s === 'EXPIRED'
        ? 'Invoice tidak dibayar sampai batas waktu (default 24 jam, diatur di Pengaturan MyPG). Webhook payment.expired bisa diaktifkan di Pengaturan'
        : d,
  ]),
  projectsDesc:
    'Proyek MyPG dibuat langsung dari Panel MyPG tanpa pengajuan. Buat satu proyek untuk tiap aplikasi atau bot; notifikasi hanya dikirim ke webhook di proyek yang sama dengan API Key yang dipakai.',
  projectsNote:
    'API Key MyPG (mp_...) hanya berlaku di /api/mypg/v1, dan API Key live (pk_...) tidak berlaku di MyPG. Data, webhook, dan riwayatnya sepenuhnya terpisah.',
  sandboxWhere: 'Buat API Key sandbox di Panel MyPG (menu Sandbox).',
  sandboxRows: [
    ['Pembayaran', 'QRIS milik Anda, terdeteksi dari notifikasi HP', 'Halaman bayar palsu, tidak bisa dibayar'],
    ['Dana', 'Masuk langsung ke akun QRIS Anda', 'Tidak ada uang yang berpindah'],
  ],
};
