// Isi dokumentasi API publik (dipindahkan dari docs.html lama).

export const START_STEPS = [
  'Login ke Dashboard dan buka menu Integrasi API.',
  'Buat Proyek baru (opsional), misalnya "App Kasir" atau "Website Toko".',
  'Tambahkan API Key ke proyek tersebut dan salin nilainya.',
  'Tambahkan Webhook URL ke proyek yang sama agar sistem tahu ke mana notifikasi pembayaran dikirim.',
  'Panggil POST /api/v1/invoices dengan API Key di header x-api-key.',
  'Terima notifikasi lewat webhook dan verifikasi header X-Webhook-Signature.',
];

export const HTTP_CODES: [string, string][] = [
  ['200', 'OK — request berhasil'],
  ['201', 'Created — resource berhasil dibuat'],
  ['400', 'Bad Request — parameter tidak valid'],
  ['401', 'Unauthorized — API Key tidak valid atau tidak ada'],
  ['404', 'Not Found — invoice tidak ditemukan'],
  ['503', 'Service Unavailable — sistem sedang maintenance'],
  ['500', 'Internal Server Error — hubungi support'],
];

export interface Endpoint {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  body?: { field: string; type: string; required: boolean; desc: string }[];
  note?: string;
  warning?: string;
  request?: string;
  response: string;
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: 'create-invoice',
    method: 'POST',
    path: '/api/v1/invoices',
    summary: 'Buat invoice baru',
    body: [
      { field: 'productName', type: 'string', required: true, desc: 'Nama produk / deskripsi pembayaran' },
      { field: 'amount', type: 'integer', required: true, desc: 'Nominal dalam Rupiah. Minimum diatur admin (default 500, response error menyebutkan nilainya), maks 20.000.000' },
      { field: 'customerName', type: 'string', required: false, desc: 'Nama pelanggan' },
      { field: 'customerContact', type: 'string', required: false, desc: 'Nomor HP atau email pelanggan' },
      { field: 'externalId', type: 'string', required: false, desc: 'ID order dari sistem Anda (untuk referensi)' },
      { field: 'method', type: 'string', required: false, desc: 'Metode pembayaran. Default: qris' },
    ],
    request: `{
  "productName": "Paket Premium Bulanan",
  "amount": 150000,
  "customerName": "Budi Santoso",
  "customerContact": "08123456789",
  "externalId": "ORDER-001"
}`,
    response: `{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoiceCode": "INV-1722345678901-A3F2",
    "externalId": "ORDER-001",
    "amount": 150000,
    "platformFee": 500,
    "totalAmount": 150500,
    "netAmount": 150000,
    "paymentStatus": "WAITING_PAYMENT",
    "paymentMethod": "QRIS",
    "paymentUrl": "https://pay.pakasir.com/checkout/xxx",
    "payment_number": "00020101...",
    "expiredAt": "2025-07-31T23:00:00.000Z"
  }
}`,
    note: 'Arahkan pelanggan ke paymentUrl untuk menyelesaikan pembayaran. Field payment_number berisi string QRIS mentah yang bisa dikonversi menjadi QR Code.',
  },
  {
    id: 'get-invoice',
    method: 'GET',
    path: '/api/v1/invoices/:invoiceCode',
    summary: 'Ambil detail invoice',
    response: `{
  "success": true,
  "data": {
    "id": 42,
    "invoiceCode": "INV-1722345678901-A3F2",
    "externalId": "ORDER-001",
    "productName": "Paket Premium Bulanan",
    "amount": 150000,
    "platformFee": 500,
    "totalAmount": 150500,
    "netAmount": 150000,
    "paymentStatus": "PAID",
    "paymentMethod": "QRIS",
    "paymentUrl": "https://pay.pakasir.com/checkout/xxx",
    "paidAt": "2025-07-31T15:30:00.000Z",
    "createdAt": "2025-07-31T14:00:00.000Z"
  }
}`,
  },
  {
    id: 'sync-invoice',
    method: 'POST',
    path: '/api/v1/invoices/:invoiceCode/sync',
    summary: 'Paksa cek status ke penyedia pembayaran',
    note: 'Gunakan jika webhook belum diterima namun Anda perlu status terbaru. Jika status berubah menjadi PAID, webhook otomatis dikirim.',
    response: `{
  "success": true,
  "data": {
    "invoiceCode": "INV-1722345678901-A3F2",
    "paymentStatus": "PAID",
    "paidAt": "2025-07-31T15:30:00.000Z"
  }
}`,
  },
  {
    id: 'cancel-invoice',
    method: 'POST',
    path: '/api/v1/invoices/:invoiceCode/cancel',
    summary: 'Batalkan invoice yang belum dibayar',
    warning: 'Invoice yang sudah berstatus PAID tidak bisa dibatalkan.',
    response: `{
  "success": true,
  "message": "Invoice cancelled successfully",
  "data": {
    "invoiceCode": "INV-1722345678901-A3F2",
    "paymentStatus": "CANCELLED"
  }
}`,
  },
];

export const WEBHOOK_STEPS = [
  'Pelanggan menyelesaikan pembayaran di halaman checkout.',
  'Penyedia pembayaran mengirim notifikasi ke server kami.',
  'Server memperbarui status invoice menjadi PAID.',
  'Server mengirim POST request ke semua Webhook URL aktif milik proyek yang membuat invoice.',
  'Endpoint Anda menerima payload dan memproses pesanan.',
  'Endpoint Anda harus merespons HTTP 200 dalam 10 detik.',
];

export const WEBHOOK_PAYLOAD = `{
  // Field utama (kompatibel Pakasir)
  "order_id": "INV-1722345678901-A3F2",
  "amount": 150000,
  "status": "completed",
  "payment_method": "QRIS",
  "payment_number": "00020101...",
  "completed_at": "2025-07-31T15:30:00.000Z",

  // Field detail
  "event": "payment.paid",
  "invoiceCode": "INV-1722345678901-A3F2",
  "externalId": "ORDER-001",
  "orderId": 42,
  "platformFee": 500,
  "totalAmount": 150500,
  "netAmount": 150000,
  "paymentStatus": "PAID",
  "paidAt": "2025-07-31T15:30:00.000Z",
  "createdAt": "2025-07-31T14:00:00.000Z"
}`;

export const VERIFY_NODE = `import crypto from 'crypto';

app.post('/webhook', express.json(), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  const { order_id, status, externalId } = req.body;
  if (status === 'completed') {
    // Aktifkan layanan, kirim email, dsb.
  }

  res.sendStatus(200);
});`;

export const VERIFY_PHP = `$payload   = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'];
$expected  = hash_hmac('sha256', $payload, getenv('WEBHOOK_SECRET'));

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    exit('Invalid signature');
}

$data = json_decode($payload, true);
if ($data['status'] === 'completed') {
    // Proses order...
}

http_response_code(200);`;

export const PAYMENT_STATUSES: [string, string][] = [
  ['PENDING', 'Invoice baru dibuat, belum ada interaksi dari penyedia pembayaran'],
  ['WAITING_PAYMENT', 'Invoice aktif dan menunggu pembayaran dari pelanggan'],
  ['PAID', 'Pembayaran berhasil dikonfirmasi. Saldo masuk ke akun merchant'],
  ['EXPIRED', 'Invoice kedaluwarsa sebelum dibayar'],
  ['FAILED', 'Pembayaran gagal diproses oleh penyedia pembayaran'],
  ['CANCELLED', 'Invoice dibatalkan secara manual via API atau Dashboard'],
  ['REFUNDED', 'Pembayaran sudah di-refund ke pelanggan'],
];

/** Teks yang berbeda antara dokumentasi live dan MyPG. Struktur halamannya sama. */
export interface DocsVariant {
  title: string;
  tagline: string;
  apiPath: string;
  keyPrefix: string;
  startSteps: string[];
  endpoints: Endpoint[];
  webhookSteps: string[];
  webhookPayload: string;
  paymentStatuses: [string, string][];
  projectsDesc: string;
  projectsNote: string;
  sandboxWhere: string;
  sandboxRows: [string, string, string][];
}

export const LIVE_DOCS: DocsVariant = {
  title: 'Dokumentasi API Merchant',
  tagline: 'Hubungkan bot otomatis Anda ke dashboard dalam hitungan menit.',
  apiPath: '/api/v1',
  keyPrefix: 'pk',
  startSteps: START_STEPS,
  endpoints: ENDPOINTS,
  webhookSteps: WEBHOOK_STEPS,
  webhookPayload: WEBHOOK_PAYLOAD,
  paymentStatuses: PAYMENT_STATUSES,
  projectsDesc:
    'Jika Anda mengelola beberapa aplikasi (misal App Kasir dan Website Toko), buat proyek terpisah untuk masing-masing. Ketika App Kasir membuat invoice dengan API Key-nya, notifikasi hanya dikirim ke webhook App Kasir.',
  projectsNote: 'API Key atau Webhook yang tidak terikat proyek bersifat global — aktif untuk invoice yang dibuat dari Dashboard.',
  sandboxWhere: 'Buat API Key sandbox di Dashboard (menu Sandbox).',
  sandboxRows: [
    ['Pembayaran', 'QRIS sungguhan', 'Halaman bayar palsu, tidak bisa dibayar'],
    ['Saldo & penarikan', 'Bertambah saat dibayar', 'Tidak pernah berubah'],
  ],
};
