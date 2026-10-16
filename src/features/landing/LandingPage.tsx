import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api/client';

// Semua angka di halaman ini mengikuti aturan yang berlaku di backend.
const STEPS = [
  {
    title: 'Buat invoice',
    desc: 'Isi nama produk dan nominal dari dashboard, atau panggil API dari aplikasi Anda.',
  },
  {
    title: 'Pelanggan scan QRIS',
    desc: 'Pelanggan membuka link pembayaran dan membayar pakai DANA, OVO, GoPay, ShopeePay, atau mobile banking.',
  },
  {
    title: 'Saldo masuk, lalu tarik',
    desc: 'Status invoice berubah jadi Dibayar, saldo bertambah, dan Anda bisa mengajukan penarikan ke rekening.',
  },
];

const TERMS: [string, string][] = [
  ['Nominal per invoice', 'Rp500 sampai Rp20.000.000'],
  ['Biaya layanan', 'Ditambahkan ke total tagihan pelanggan. Nominal yang Anda tetapkan masuk utuh ke saldo.'],
  ['Saldo tertunda', 'Pembayaran ditahan beberapa jam sebelum bisa ditarik. Durasinya terlihat di dashboard.'],
  ['Penarikan minimal', 'Rp15.000 per pengajuan'],
  ['Biaya transfer', 'Tambahan Rp2.500 untuk rekening selain DANA'],
];

const FAQ: [string, string][] = [
  [
    'Bagaimana cara mendaftar?',
    'Akun dibuat oleh admin Autoko. Setelah akun aktif dan toko disetujui, Anda bisa langsung memakai dashboard.',
  ],
  [
    'Apakah pelanggan perlu aplikasi khusus?',
    'Tidak. Semua aplikasi yang mendukung QRIS bisa dipakai untuk membayar.',
  ],
  [
    'Bagaimana aplikasi saya tahu invoice sudah dibayar?',
    'Kami mengirim webhook ke URL Anda begitu status berubah. Setiap request disertai signature HMAC-SHA256 untuk diverifikasi.',
  ],
  [
    'Bisa dipakai untuk beberapa aplikasi sekaligus?',
    'Bisa. Buat satu proyek untuk tiap aplikasi; masing-masing punya API key dan webhook sendiri.',
  ],
];

const CURL = `curl -X POST ${API_URL}/v1/invoices \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: pk_live_xxxx" \\
  -d '{
    "productName": "Paket Premium",
    "amount": 150000,
    "externalId": "ORDER-001"
  }'`;

const RESPONSE = `{
  "invoiceCode": "INV-1722345678901-A3F2",
  "totalAmount": 150500,
  "netAmount": 150000,
  "paymentStatus": "WAITING_PAYMENT",
  "paymentUrl": "https://www.akuqris.com/pay.html?invoice=INV-..."
}`;

function InvoicePreview() {
  return (
    <div className="mx-auto w-full max-w-xs rounded-xl border bg-card p-6 text-center shadow-sm">
      <p className="font-semibold">Toko Anda</p>
      <p className="font-mono text-xs text-muted-foreground">INV-1722345678901-A3F2</p>
      <p className="mt-4 text-3xl font-bold text-primary">Rp 150.500</p>
      <p className="text-sm text-muted-foreground">Paket Premium</p>
      <span className="mt-4 inline-block rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        Menunggu Pembayaran
      </span>
      <div className="mx-auto mt-4 w-fit rounded-lg border-2 bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=6&data=https%3A%2F%2Fwww.akuqris.com"
          alt="Contoh kode QRIS"
          width={150}
          height={150}
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Bayar tepat sesuai nominal hingga 3 digit terakhir.</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl space-y-2">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {desc && <p className="text-muted-foreground">{desc}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="Autoko">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#cara-kerja" className="hover:text-foreground">Cara kerja</a>
            <a href="#developer" className="hover:text-foreground">Untuk developer</a>
            <a href="#ketentuan" className="hover:text-foreground">Ketentuan</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants()}>
              Masuk
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="space-y-6">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Dashboard bot otomatis untuk mengelola penjualan toko Anda.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Pantau pesanan dari bot otomatis, kelola saldo toko, dan ajukan penarikan ke rekening dari satu dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-5')}>
                Buka Dashboard Bot Otomatis <ArrowRight />
              </Link>
              <Link href="/docs" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-5')}>
                Baca Dokumentasi API
              </Link>
            </div>
          </div>
          <InvoicePreview />
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="scroll-mt-16 border-t bg-muted/40">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6">
            <SectionTitle eyebrow="Cara kerja" title="Tiga langkah dari tagihan sampai dana di rekening." />
            <ol className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="space-y-2 border-t-2 border-primary pt-4">
                  <p className="font-mono text-sm text-muted-foreground">0{i + 1}</p>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Developer */}
        <section id="developer" className="scroll-mt-16 border-t">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div className="space-y-6">
              <SectionTitle
                eyebrow="Untuk developer"
                title="Satu request untuk membuat pesanan."
                desc="Kirim nominal dan nama produk dari bot Anda. Status pesanan dikabarkan lewat webhook."
              />
              <ul className="space-y-3 text-sm">
                <li className="border-l-2 border-primary pl-3">
                  <strong>API key per proyek.</strong>{' '}
                  <span className="text-muted-foreground">Pisahkan tiap bot atau toko Anda.</span>
                </li>
                <li className="border-l-2 border-primary pl-3">
                  <strong>Webhook bertanda tangan.</strong>{' '}
                  <span className="text-muted-foreground">Header X-Webhook-Signature berisi HMAC-SHA256 dari body.</span>
                </li>
                <li className="border-l-2 border-primary pl-3">
                  <strong>Cek status & batalkan.</strong>{' '}
                  <span className="text-muted-foreground">Endpoint sync dan cancel untuk invoice yang belum dibayar.</span>
                </li>
              </ul>
              <Link href="/docs" className={buttonVariants({ variant: 'outline' })}>
                Dokumentasi lengkap <ArrowRight />
              </Link>
            </div>
            <div className="min-w-0 space-y-3">
              <pre className="overflow-x-auto rounded-lg bg-[#1d3557] p-4 font-mono text-xs leading-relaxed text-slate-100">
                <code>{CURL}</code>
              </pre>
              <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
                <code>{RESPONSE}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Ketentuan */}
        <section id="ketentuan" className="scroll-mt-16 border-t bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <SectionTitle
              eyebrow="Ketentuan"
              title="Aturannya ditulis jelas."
              desc="Biaya layanan per transaksi diatur untuk tiap toko."
            />
            <dl className="divide-y rounded-lg border bg-card">
              {TERMS.map(([term, value]) => (
                <div key={term} className="grid gap-1 p-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium">{term}</dt>
                  <dd className="text-sm text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 border-t">
          <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 sm:px-6">
            <SectionTitle eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
            <div className="divide-y border-y">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {q}
                    <span className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Penutup */}
        <section className="bg-[#1d3557] text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Sudah punya akun merchant?</h2>
              <p className="mt-1 text-white/70">Masuk untuk mengelola bot otomatis dan toko Anda.</p>
            </div>
            <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'h-11 bg-white px-5 text-[#1d3557] hover:bg-white/90')}>
              Buka Dashboard Bot Otomatis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <nav className="flex gap-6">
            <Link href="/login" className="hover:text-foreground">Masuk</Link>
            <Link href="/docs" className="hover:text-foreground">Dokumentasi API</Link>
          </nav>
          <p>© {new Date().getFullYear()} Autoko</p>
        </div>
      </footer>
    </div>
  );
}
