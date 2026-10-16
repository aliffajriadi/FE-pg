import { ChevronDown } from 'lucide-react';
import { API_URL } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/shared/Logo';
import { HTTP_CODES, LIVE_DOCS, VERIFY_NODE, VERIFY_PHP, type DocsVariant } from './content';
import { MYPG_DOCS } from './content-mypg';

const navFor = (docs: DocsVariant, mypg: boolean) => [
  {
    group: 'Memulai',
    items: [
      ['getting-started', 'Panduan Awal'],
      ...(mypg ? [['detection', 'Cara Deteksi Pembayaran']] : []),
      ['authentication', 'Autentikasi'],
      ['projects', 'Sistem Proyek'],
      ['errors', 'Error Handling'],
    ],
  },
  { group: 'Invoice API', items: docs.endpoints.map((e) => [e.id, e.summary]) },
  { group: 'Sandbox', items: [['sandbox', 'Uji Coba (Sandbox)'], ['sandbox-simulate', 'Simulasi Pembayaran']] },
  { group: 'Webhook', items: [['webhook', 'Cara Kerja'], ['webhook-payload', 'Format Payload'], ['webhook-signature', 'Verifikasi Signature']] },
  { group: 'Referensi', items: [['payment-status', 'Status Pembayaran']] },
];

const METHOD_CLASS = {
  GET: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
};

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4 border-b pb-10">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Callout({ tone = 'info', children }: { tone?: 'info' | 'warning'; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-lg border p-3 text-sm',
        tone === 'info'
          ? 'border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
      )}
    >
      {children}
    </p>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={step} className="flex gap-3 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-muted-foreground first:text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApiDocs({ variant = 'live' }: { variant?: 'live' | 'mypg' }) {
  const mypg = variant === 'mypg';
  const docs = mypg ? MYPG_DOCS : LIVE_DOCS;
  const NAV = navFor(docs, mypg);
  const baseUrl = `${API_URL}${docs.apiPath.replace(/^\/api/, '')}`;
  const pk = docs.keyPrefix;

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-4 py-8 md:px-8">
      <aside className="sticky top-8 hidden h-[calc(100vh-4rem)] w-56 shrink-0 space-y-6 overflow-y-auto lg:block">
        <div>
          <Logo />
          <p className="mt-1 text-xs text-muted-foreground">{mypg ? 'Dokumentasi MyPG · v1.0' : 'Dokumentasi API · v1.0'}</p>
        </div>
        {NAV.map((group) => (
          <div key={group.group} className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{group.group}</p>
            {group.items.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                {label}
              </a>
            ))}
          </div>
        ))}
      </aside>

      <main className="min-w-0 flex-1 space-y-10">
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{docs.title}</h1>
              <p className="mt-1 text-muted-foreground">{docs.tagline}</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Base URL</span>
            <code className="font-mono font-semibold break-all">{baseUrl}</code>
          </div>
        </header>

        <Section id="getting-started" title="Panduan Awal" desc="Langkah-langkah untuk mulai menggunakan API.">
          <Steps steps={docs.startSteps} />
        </Section>

        {mypg && (
          <Section
            id="detection"
            title="Cara Deteksi Pembayaran"
            desc="MyPG tidak memakai penyedia pembayaran pihak ketiga. Pembayaran dikenali dari notifikasi di HP Anda."
          >
            <SimpleTable
              head={['Komponen', 'Keterangan']}
              rows={[
                ['QRIS', 'QRIS statis milik Anda (DANA Bisnis, ShopeePay, atau GoPay). Setiap invoice dibuatkan QRIS dinamis dengan nominal terisi.'],
                ['Kode unik', 'Jika ada invoice lain yang menunggu dengan nominal sama, total ditambah beberapa rupiah (maksimal 999, diatur di Pengaturan MyPG) agar tiap invoice punya total berbeda.'],
                ['Tandai manual', 'Bila notifikasi terlewat, merchant bisa menandai invoice lunas dari halaman Transaksi. Webhook payment.paid tetap dikirim (bisa dimatikan).'],
                ['APK', 'Aplikasi di HP penerima yang meneruskan notifikasi uang masuk ke server. Diatur di menu Perangkat & QRIS.'],
                ['Pencocokan', 'Nominal di notifikasi dicocokkan dengan totalAmount invoice yang masih menunggu. Bila cocok, invoice menjadi PAID dan webhook dikirim.'],
              ]}
            />
            <Callout tone="warning">
              Pelanggan harus membayar tepat sebesar totalAmount. HP penerima harus menyala, terhubung internet, dan APK berjalan agar
              pembayaran terdeteksi. Invoice yang tidak dibayar kedaluwarsa sesuai batas waktu di Pengaturan MyPG (default 24 jam).
            </Callout>
          </Section>
        )}

        <Section id="authentication" title="Autentikasi" desc={`Semua request ke ${docs.apiPath}/* wajib menyertakan API Key di header.`}>
          <SimpleTable
            head={['Header', 'Tipe', 'Keterangan']}
            rows={[[<code key="h">x-api-key</code>, 'string', `API Key dari ${mypg ? 'Panel MyPG' : 'Dashboard'}. Format: ${pk}_live_xxxx`]]}
          />
          <Code>{`curl -X POST ${baseUrl}/invoices \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${pk}_live_abc123xyz..." \\
  -d '{...}'`}</Code>
          <Callout>
            API Key terikat ke Proyek. Notifikasi webhook hanya dikirim ke webhook di proyek yang sama dengan API Key yang
            dipakai.
          </Callout>
        </Section>

        <Section id="projects" title="Sistem Proyek" desc="Setiap proyek memiliki API Key dan Webhook sendiri yang terpisah.">
          <p className="text-sm text-muted-foreground">{docs.projectsDesc}</p>
          <Code>{`Merchant (Toko)
  ├── Proyek "App Kasir"
  │     ├── API Key: ${pk}_live_aaa...
  │     └── Webhook: https://app-kasir.com/webhook
  │
  └── Proyek "Website Toko"
        ├── API Key: ${pk}_live_bbb...
        └── Webhook: https://website-toko.com/webhook`}</Code>
          <Callout tone="warning">{docs.projectsNote}</Callout>
        </Section>

        <Section id="errors" title="Error Handling" desc="Semua response mengikuti format yang konsisten.">
          <div className="grid gap-4 md:grid-cols-2">
            <Code>{`// Sukses
{
  "success": true,
  "data": { ... }
}`}</Code>
            <Code>{`// Error
{
  "success": false,
  "message": "Pesan error"
}`}</Code>
          </div>
          <SimpleTable head={['Status', 'Arti']} rows={HTTP_CODES.map(([code, desc]) => [<code key={code}>{code}</code>, desc])} />
        </Section>

        <section className="space-y-4 border-b pb-10">
          <div>
            <h2 className="text-xl font-bold">Invoice API</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat dan kelola invoice pembayaran. Semua endpoint memerlukan header <code>x-api-key</code>.
            </p>
          </div>
          {docs.endpoints.map((ep) => (
            <details key={ep.id} id={ep.id} className="group scroll-mt-6 rounded-xl border" open={ep.id === 'create-invoice'}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                <span className={cn('rounded px-2 py-0.5 font-mono text-xs font-bold', METHOD_CLASS[ep.method])}>{ep.method}</span>
                <code className="font-mono text-sm font-semibold break-all">{ep.path}</code>
                <span className="text-sm text-muted-foreground">{ep.summary}</span>
                <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t p-4">
                {ep.body && (
                  <SimpleTable
                    head={['Field', 'Tipe', 'Wajib', 'Keterangan']}
                    rows={ep.body.map((f) => [<code key={f.field}>{f.field}</code>, f.type, f.required ? 'Wajib' : 'Opsional', f.desc])}
                  />
                )}
                {ep.warning && <Callout tone="warning">{ep.warning}</Callout>}
                {ep.request && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Contoh Request</p>
                    <Code>{ep.request}</Code>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Contoh Response</p>
                  <Code>{ep.response}</Code>
                </div>
                {ep.note && <Callout>{ep.note}</Callout>}
              </div>
            </details>
          ))}
        </section>

        <Section
          id="sandbox"
          title="Uji Coba (Sandbox)"
          desc="Coba integrasi Anda tanpa memproses pembayaran sungguhan. Tidak ada uang yang berpindah."
        >
          <p className="text-sm text-muted-foreground">
            {docs.sandboxWhere} Formatnya <code className="font-mono">{pk}_test_xxxx</code>. Endpoint, header, request, dan response-nya sama dengan API asli,
            jadi untuk go-live Anda cukup mengganti key.
          </p>
          <Code>{`curl -X POST ${baseUrl}/invoices \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${pk}_test_abc123xyz..." \
  -d '{"productName":"Produk Uji","amount":10000}'`}</Code>
          <SimpleTable
            head={['', 'Live', 'Sandbox']}
            rows={[
              ['API Key', <code key="a">{pk}_live_...</code>, <code key="b">{pk}_test_...</code>],
              ['Kode invoice', <code key="c">INV-...</code>, <code key="d">SBX-...</code>],
              ...docs.sandboxRows,
              ['Webhook', 'Ke webhook live', 'Hanya ke webhook sandbox'],
              ['Penyimpanan', 'Permanen', 'Dihapus otomatis setelah 7 hari'],
            ]}
          />
          <Callout tone="warning">
            Key live dan key sandbox saling terpisah: invoice sandbox tidak bisa dibaca dengan key live, begitu juga sebaliknya.
            Daftarkan webhook sandbox terpisah di Dashboard supaya event uji coba tidak masuk ke server produksi Anda.
          </Callout>
        </Section>

        <Section
          id="sandbox-simulate"
          title="Simulasi Pembayaran"
          desc="Ubah status invoice sandbox lewat halaman bayar atau API. Webhook sandbox ikut terkirim."
        >
          <p className="text-sm text-muted-foreground">
            Setiap invoice sandbox punya <code className="font-mono">paymentUrl</code> berupa halaman bayar dengan tombol
            simulasi. Untuk tes otomatis, panggil endpoint ini dengan key sandbox:
          </p>
          <Code>{`POST ${baseUrl}/sandbox/invoices/SBX-1700000000000-AB12/simulate
x-api-key: ${pk}_test_abc123xyz...

{ "status": "paid" }   // paid | failed | expired`}</Code>
          <SimpleTable
            head={['status', 'Hasil', 'Event webhook']}
            rows={[
              [<code key="p">paid</code>, 'PAID', <code key="e1">payment.paid</code>],
              [<code key="f">failed</code>, 'FAILED', <code key="e2">payment.failed</code>],
              [<code key="x">expired</code>, 'EXPIRED', <code key="e3">payment.expired</code>],
            ]}
          />
          <Callout>
            Payload webhook sandbox sama dengan yang asli, ditambah <code className="font-mono">sandbox: true</code> dan header{' '}
            <code className="font-mono">X-Webhook-Mode: sandbox</code>. Saat ini webhook live hanya mengirim{' '}
            <code className="font-mono">payment.paid</code>; event <code className="font-mono">failed</code> dan{' '}
            <code className="font-mono">expired</code> disediakan di sandbox untuk menguji penanganan status tersebut. Invoice
            sandbox yang tidak dibayar kedaluwarsa otomatis setelah 24 jam.
          </Callout>
        </Section>

        <Section id="webhook" title="Webhook" desc="Sistem mengirim notifikasi otomatis ke endpoint Anda saat status pembayaran berubah.">
          <Steps steps={docs.webhookSteps} />
          <Callout tone="warning">
            Webhook dikirim dengan timeout 10 detik. Gunakan queue/background job untuk proses yang memakan waktu lama.
          </Callout>
        </Section>

        <Section id="webhook-payload" title="Format Payload Webhook">
          <SimpleTable
            head={['Header', 'Nilai']}
            rows={[
              ['Content-Type', 'application/json'],
              ['X-Webhook-Event', 'payment.paid atau payment.test'],
              ['X-Webhook-Signature', 'HMAC-SHA256 dari body — untuk verifikasi keaslian'],
            ]}
          />
          <Code>{docs.webhookPayload}</Code>
          <Callout>Gunakan field externalId untuk mencocokkan invoice dengan order di sistem Anda.</Callout>
        </Section>

        <Section
          id="webhook-signature"
          title="Verifikasi Signature"
          desc="Header X-Webhook-Signature berisi HMAC-SHA256 dari body request memakai Secret Key webhook. Selalu verifikasi untuk memastikan request berasal dari server kami."
        >
          <p className="text-sm font-semibold">Node.js</p>
          <Code>{VERIFY_NODE}</Code>
          <p className="text-sm font-semibold">PHP</p>
          <Code>{VERIFY_PHP}</Code>
          <Callout tone="warning">
            Simpan Secret Key di environment variable, bukan di kode. Secret bisa di-regenerate kapan saja dari menu Pengaturan
            &amp; API.
          </Callout>
        </Section>

        <Section id="payment-status" title="Status Pembayaran" desc="Nilai yang mungkin muncul di field paymentStatus.">
          <SimpleTable
            head={['Status', 'Keterangan']}
            rows={docs.paymentStatuses.map(([status, desc]) => [<StatusBadge key={status} status={status} label={status} />, desc])}
          />
          <p className="pt-4 text-center text-xs text-muted-foreground">Perlu bantuan? Hubungi support melalui Dashboard. — API v1.0</p>
        </Section>
      </main>
    </div>
  );
}
