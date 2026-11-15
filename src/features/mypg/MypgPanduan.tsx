import Link from 'next/link';
import {
  BellRing,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Code2,
  CreditCard,
  FileText,
  KeyRound,
  Lightbulb,
  QrCode,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';

type Node = React.ReactNode;

const Go = ({ href, children }: { href: string; children: Node }) => (
  <Link href={href} className="font-medium text-primary underline underline-offset-2">
    {children}
  </Link>
);

function Steps({ items }: { items: Node[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1 pt-0.5 leading-relaxed">{item}</div>
        </li>
      ))}
    </ol>
  );
}

function Note({ tone = 'tip', children }: { tone?: 'tip' | 'warn'; children: Node }) {
  const warn = tone === 'warn';
  const Icon = warn ? TriangleAlert : Lightbulb;
  return (
    <div
      className={`flex gap-2 rounded-lg border px-3 py-2 text-sm leading-relaxed ${
        warn ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10'
      }`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${warn ? 'text-amber-600' : 'text-emerald-600'}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Section({ id, icon: Icon, title, desc, children }: { id: string; icon: LucideIcon; title: string; desc: string; children: Node }) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="size-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Faq({ items }: { items: [string, Node][] }) {
  return (
    <div className="divide-y rounded-lg border">
      {items.map(([q, a]) => (
        <details key={q} className="group px-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span className="flex-1">{q}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-3 text-sm leading-relaxed text-muted-foreground">{a}</div>
        </details>
      ))}
    </div>
  );
}

const Code = ({ children }: { children: Node }) => (
  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs break-all">{children}</code>
);

const TOC: [string, string][] = [
  ['apa-itu', 'Apa itu MyPG?'],
  ['kamus', 'Kamus kata sulit'],
  ['mulai', '4 langkah mulai'],
  ['lisensi', '1. Lisensi'],
  ['qris', '2. Pasang QRIS'],
  ['shopee', '3a. Shopee Otomatis'],
  ['hp', '3b. Pakai HP'],
  ['invoice', '4. Buat tagihan'],
  ['pengaturan', 'Pengaturan'],
  ['telegram', 'Kabar Telegram'],
  ['developer', 'Untuk programmer'],
  ['masalah', 'Kalau ada masalah'],
];

const WORDS: [string, string][] = [
  ['QRIS', 'Gambar kotak-kotak hitam putih. Orang scan pakai HP, lalu uangnya masuk ke kamu.'],
  ['Invoice / Tagihan', 'Surat kecil berisi "tolong bayar Rp sekian". Tiap pembeli dapat satu.'],
  ['Kode unik', 'Beberapa rupiah tambahan di total, misal Rp 10.000 jadi Rp 10.003. Biar tiap tagihan beda dan gampang dikenali.'],
  ['Lunas / Paid', 'Tagihan sudah dibayar. Hore!'],
  ['Kedaluwarsa / Expired', 'Waktu bayar sudah habis. Tagihan tidak berlaku lagi.'],
  ['Lisensi', 'Tiket masuk MyPG. Ada masa berlakunya (berapa hari).'],
  ['OTP', 'Kode angka rahasia yang dikirim ke HP kamu lewat SMS/WhatsApp. Cuma berlaku sebentar.'],
  ['APK', 'File untuk memasang aplikasi di HP Android.'],
  ['API Key', 'Kata sandi khusus untuk program/bot kamu. Jangan dikasih ke siapa-siapa.'],
  ['Webhook', 'Cara MyPG "menelepon" website/bot kamu waktu ada yang bayar.'],
  ['Sandbox', 'Tempat latihan. Semua pura-pura, tidak pakai uang beneran.'],
];

const SHOPEE_DEVICE_STEPS: Node[] = [
  <>
    Pakai <b>laptop/komputer</b> (bukan HP). Buka Chrome, lalu buka alamat ini: <Code>https://partner.business.accounts.shopee.co.id</Code>.{' '}
    <b>Jangan login dulu.</b>
  </>,
  <>
    Tekan tombol <b>F12</b> di keyboard. Akan muncul jendela penuh tulisan di samping/bawah. Tenang, itu normal. Klik tab yang namanya{' '}
    <b>Network</b>.
  </>,
  <>
    Cari kotak kecil bertulisan <b>Preserve log</b>, lalu centang. Setelah itu tekan <b>F5</b> untuk memuat ulang halaman.
  </>,
  <>
    Di kotak pencarian (tulisannya <i>Filter</i>), ketik <Code>report</Code>. Akan muncul baris yang alamatnya mengandung{' '}
    <Code>df.infra.sz.shopee.co.id/v2/shpsec/web/report</Code>. Klik baris itu.
  </>,
  <>
    Klik tab <b>Payload</b>, lalu klik tulisan <b>view source</b>. Blok semua teksnya (klik di teks, tekan <b>Ctrl+A</b>), lalu salin (
    <b>Ctrl+C</b>).
  </>,
  <>
    Kembali ke halaman <Go href="/dashboard/mypg/devices">Perangkat &amp; QRIS</Go>, di kotak <b>Shopee Otomatis</b> klik{' '}
    <b>Hubungkan Shopee</b>. Tempel teks tadi (<b>Ctrl+V</b>) ke kolom <b>Device report</b>, lalu klik <b>Simpan &amp; Lanjut</b>.
  </>,
];

const SHOPEE_LOGIN_STEPS: Node[] = [
  <>
    Isi <b>Nomor HP</b> akun Shopee Partner kamu (nomor yang dipakai untuk akun ShopeePay toko). Kalau akunmu pakai password, isi juga
    passwordnya. Klik <b>Kirim OTP</b>.
  </>,
  <>
    Lihat HP kamu. Shopee akan mengirim <b>kode OTP</b>. Ketik kodenya, lalu klik <b>Verifikasi</b>.
  </>,
  <>
    Kalau ditanya <b>pilih merchant</b> atau <b>pilih toko</b>, pilih toko yang punya QRIS ShopeePay kamu, lalu klik <b>Sambungkan</b>.
  </>,
  <>
    Selesai! Tulisan di pojok kotak berubah jadi <b className="text-emerald-600">Terhubung</b>.
  </>,
];

const HP_STEPS: Node[] = [
  <>
    Buka <Go href="/dashboard/mypg/devices">Perangkat &amp; QRIS</Go>, buka bagian <b>Cara menghubungkan HP</b>, lalu klik tombol{' '}
    <b>Unduh Autoko MyPG</b>. Pasang aplikasinya di HP yang menerima notifikasi uang masuk (DANA Bisnis, ShopeePay, atau GoPay).
  </>,
  <>
    Buka aplikasi Autoko MyPG, lalu <b>login pakai email dan password yang sama</b> dengan yang kamu pakai di website ini. HP langsung
    terdaftar sendiri.
  </>,
  <>
    Waktu aplikasi minta <b>izin akses notifikasi</b>, tekan <b>Izinkan</b>. Ini supaya aplikasi bisa &ldquo;membaca&rdquo; kabar uang masuk.
  </>,
  <>Biarkan aplikasi tetap jalan. Jangan dimatikan paksa, dan matikan mode hemat baterai untuk aplikasi ini.</>,
  <>
    Cek di bagian <b>HP Penerima</b>: kalau HP kamu tertulis <b>Online</b>, berarti sudah siap.
  </>,
];

export default function MypgPanduan() {
  return (
    <>
      <PageHeader
        title="Panduan MyPG dari Nol"
        description="Dijelaskan pelan-pelan, langkah demi langkah. Ikuti dari atas ke bawah, pasti bisa!"
      />

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">Mau lompat ke mana?</p>
          <div className="flex flex-wrap gap-2">
            {TOC.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary ${
                  id === 'shopee' ? 'border-primary bg-primary text-primary-foreground hover:text-primary-foreground' : 'bg-background'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <Section id="apa-itu" icon={Sparkles} title="Apa itu MyPG?" desc="Penjelasan paling gampang.">
        <p className="text-sm leading-relaxed">
          Bayangkan kamu punya toko kecil. Pembeli bayar pakai <b>QRIS</b>: mereka scan gambar kotak-kotak pakai HP, lalu uangnya masuk ke
          dompet digital kamu (DANA, ShopeePay, atau GoPay).
        </p>
        <p className="text-sm leading-relaxed">
          Masalahnya, kamu harus terus melihat HP untuk tahu: <i>&ldquo;Si A sudah bayar belum, ya?&rdquo;</i>. Capek!
        </p>
        <p className="text-sm leading-relaxed">
          <b>MyPG itu seperti asisten robot.</b> Robot ini melihat uang yang masuk ke QRIS <b>milik kamu sendiri</b>, lalu mencocokkan
          dengan tagihan. Kalau cocok, robot langsung bilang <b>&ldquo;Lunas!&rdquo;</b>, dan bisa mengabari kamu atau bot/website kamu.
        </p>
        <Note>
          Uangnya <b>langsung masuk ke dompet digital kamu</b>, bukan ke kami. MyPG cuma membantu mengecek siapa yang sudah bayar.
        </Note>
        <p className="text-sm leading-relaxed">Robot bisa melihat uang masuk dengan 2 cara. Pilih salah satu (atau dua-duanya):</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <a href="#shopee" className="rounded-lg border p-3 transition-colors hover:border-primary">
            <p className="flex items-center gap-2 font-medium">
              <ShoppingBag className="size-4 text-primary" /> Shopee Otomatis
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Tidak perlu HP menyala. Server yang mengecek. Khusus QRIS ShopeePay.</p>
          </a>
          <a href="#hp" className="rounded-lg border p-3 transition-colors hover:border-primary">
            <p className="flex items-center gap-2 font-medium">
              <Smartphone className="size-4 text-primary" /> Pakai HP + Aplikasi
            </p>
            <p className="mt-1 text-xs text-muted-foreground">HP membaca notifikasi uang masuk. Bisa DANA Bisnis, ShopeePay, GoPay.</p>
          </a>
        </div>
      </Section>

      <Section id="kamus" icon={BookOpen} title="Kamus kata sulit" desc="Kalau ketemu kata aneh, lihat di sini.">
        <dl className="grid gap-2 sm:grid-cols-2">
          {WORDS.map(([word, meaning]) => (
            <div key={word} className="rounded-lg border p-3">
              <dt className="text-sm font-semibold">{word}</dt>
              <dd className="mt-0.5 text-sm text-muted-foreground">{meaning}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="mulai" icon={Sparkles} title="4 langkah mulai" desc="Ini peta besarnya. Detail tiap langkah ada di bawah.">
        <Steps
          items={[
            <>
              <b>Aktifkan lisensi</b> (tiket masuk).{' '}
              <a href="#lisensi" className="text-primary underline">
                Caranya
              </a>
            </>,
            <>
              <b>Pasang QRIS</b> milik kamu.{' '}
              <a href="#qris" className="text-primary underline">
                Caranya
              </a>
            </>,
            <>
              <b>Sambungkan robot pengecek</b>:{' '}
              <a href="#shopee" className="text-primary underline">
                Shopee Otomatis
              </a>{' '}
              atau{' '}
              <a href="#hp" className="text-primary underline">
                HP + aplikasi
              </a>
              .
            </>,
            <>
              <b>Coba buat tagihan</b> dan bayar sendiri sekali, untuk memastikan semuanya jalan.{' '}
              <a href="#invoice" className="text-primary underline">
                Caranya
              </a>
            </>,
          ]}
        />
        <Note>
          Di halaman <Go href="/dashboard/mypg">Beranda</Go> ada kotak kuning &ldquo;Lengkapi pengaturan&rdquo;. Kalau kotak itu sudah hilang, berarti
          semua langkah sudah beres.
        </Note>
      </Section>

      <Section id="lisensi" icon={KeyRound} title="Langkah 1: Aktifkan lisensi" desc="Tanpa lisensi, tagihan baru tidak bisa dibuat.">
        <Steps
          items={[
            <>
              Hubungi admin untuk membeli kode lisensi. Bentuknya seperti ini: <Code>MYPG-XXXX-XXXX-XXXX</Code>.
            </>,
            <>
              Buka <Go href="/dashboard/mypg/billing">Billing &amp; Lisensi</Go>.
            </>,
            <>
              Ketik kodenya di kolom <b>Kode Lisensi</b>, lalu klik <b>Aktifkan</b>.
            </>,
            <>
              Lihat tulisan <b>Aktif · sekian hari lagi</b>. Artinya kamu sudah boleh mulai.
            </>,
          ]}
        />
        <Note>
          Perpanjang lebih awal itu aman. Hari baru <b>ditambahkan</b> ke sisa hari, tidak hilang.
        </Note>
        <Note tone="warn">
          Kalau lisensi habis, tagihan <b>baru</b> ditolak. Tagihan lama yang sudah dibuat tetap dicek. Tempat latihan (Sandbox) tetap
          gratis. Beberapa lisensi juga punya <b>kuota</b> (batas total rupiah); sisanya bisa dilihat di Beranda.
        </Note>
      </Section>

      <Section id="qris" icon={QrCode} title="Langkah 2: Pasang QRIS kamu" desc="Ini QRIS yang akan di-scan pembeli.">
        <Steps
          items={[
            <>
              Siapkan <b>gambar QRIS statis</b> toko kamu. Biasanya bisa diunduh dari aplikasi DANA Bisnis / ShopeePay / GoPay (menu QRIS
              toko), atau foto stiker QRIS-nya dengan jelas.
            </>,
            <>
              Buka <Go href="/dashboard/mypg/devices">Perangkat &amp; QRIS</Go>, di kotak <b>QRIS Saya</b> klik <b>Tambah QRIS</b>.
            </>,
            <>
              Klik <b>Unggah Gambar QRIS</b> dan pilih gambarnya. Sistem membaca gambar itu sendiri. (Kalau kamu punya teks QRIS yang
              diawali <Code>000201</Code>, bisa juga ditempel manual.)
            </>,
            <>
              Isi <b>Nama</b> (bebas, misal &ldquo;ShopeePay Toko Utama&rdquo;) dan pilih <b>Aplikasi Penerima</b> yang benar: DANA Bisnis, ShopeePay,
              atau GoPay.
            </>,
            <>
              Simpan. QRIS yang bertanda <b>Dipakai</b> adalah yang muncul di tagihan baru.
            </>,
          ]}
        />
        <Note tone="warn">
          Mau pakai <b>Shopee Otomatis</b>? QRIS yang bertanda <b>Dipakai</b> harus yang <b>ShopeePay</b>. Kalau yang dipakai DANA/GoPay,
          robot Shopee tidak akan mengecek.
        </Note>
      </Section>

      <Section
        id="shopee"
        icon={ShoppingBag}
        title="Langkah 3a: Shopee Otomatis (tanpa HP)"
        desc="Cara paling santai. Server kami yang mengecek akun ShopeePay kamu, jadi HP boleh mati."
      >
        <p className="text-sm leading-relaxed">
          <b>Cara kerjanya:</b> kamu &ldquo;menitipkan kunci&rdquo; akun Shopee Partner ke server. Selama ada tagihan yang menunggu dibayar, server
          mengintip daftar uang masuk ShopeePay kamu setiap <b>5–10 detik</b>. Kalau ada uang masuk dengan jumlah yang sama persis dengan
          tagihan, tagihan langsung jadi <b>Lunas</b>.
        </p>

        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold">Yang perlu disiapkan dulu</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Akun ShopeePay untuk toko (bisa login di Shopee Partner) dan QRIS ShopeePay-nya.</li>
            <li>
              QRIS ShopeePay sudah dipasang dan bertanda <b>Dipakai</b> (lihat Langkah 2).
            </li>
            <li>Laptop/komputer dengan Chrome atau Firefox (hanya untuk sekali menyambungkan).</li>
            <li>HP dengan nomor akun Shopee itu, untuk menerima kode OTP.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Bagian A: Ambil &ldquo;sidik jari&rdquo; browser (device report)</p>
          <p className="text-sm text-muted-foreground">
            Shopee ingin tahu kamu login dari browser yang wajar. Jadi kita ambil &ldquo;kartu identitas&rdquo; browser kamu. Isinya data perangkat,
            bukan password.
          </p>
          <Steps items={SHOPEE_DEVICE_STEPS} />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Bagian B: Login dengan OTP</p>
          <Steps items={SHOPEE_LOGIN_STEPS} />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Bagian C: Tes!</p>
          <Steps
            items={[
              <>
                Buat satu tagihan kecil, misal Rp 1.000 (lihat{' '}
                <a href="#invoice" className="text-primary underline">
                  Langkah 4
                </a>
                ).
              </>,
              <>
                Bayar tagihan itu pakai HP lain, scan QRIS-nya, dan bayar <b>persis</b> sesuai total yang tertulis.
              </>,
              <>Tunggu sebentar (biasanya kurang dari 1 menit). Status tagihan berubah jadi Lunas sendiri.</>,
            ]}
          />
        </div>

        <Note tone="warn">
          Tagihan yang dicek Shopee Otomatis cuma berlaku <b>5 menit</b>. Jadi minta pembeli langsung bayar ya.
        </Note>
        <Note>
          Kalau tulisan berubah jadi <b className="text-amber-600">Perlu login ulang</b>, artinya &ldquo;kunci&rdquo;-nya sudah kedaluwarsa. Ulangi
          Bagian B (kirim OTP lagi). Kalau OTP tidak masuk, ulangi dari Bagian A. Kalau kamu menyalakan kabar Telegram, kamu juga akan
          dikabari saat perlu login ulang.
        </Note>
        <Note>
          Mau berhenti? Klik <b>Putuskan</b> di kotak Shopee Otomatis. Semua data login Shopee dihapus dari server. Data login disimpan
          terenkripsi (dikunci rapat).
        </Note>
        <Note>
          Boleh pakai Shopee Otomatis dan HP + aplikasi <b>bersamaan</b>. Jadi kalau satu bermasalah, yang lain jadi cadangan.
        </Note>
      </Section>

      <Section id="hp" icon={Smartphone} title="Langkah 3b: Pakai HP + aplikasi" desc="Cocok untuk DANA Bisnis, ShopeePay, dan GoPay.">
        <p className="text-sm leading-relaxed">
          <b>Cara kerjanya:</b> setiap ada uang masuk, HP kamu memunculkan notifikasi (&ldquo;Kamu menerima Rp 10.003&rdquo;). Aplikasi Autoko MyPG
          membaca notifikasi itu dan mengirimkannya ke kami. Lalu kami mencocokkan dengan tagihan.
        </p>
        <Steps items={HP_STEPS} />
        <Note tone="warn">
          HP harus <b>nyala, ada internet, dan aplikasi dompet digital-nya login</b> di HP itu juga. Kalau HP mati, pembayaran tidak
          terdeteksi sampai HP nyala lagi.
        </Note>
        <Note>
          Mau cek apakah notifikasi sampai? Lihat kotak <b>Notifikasi Masuk</b> di bawah halaman Perangkat &amp; QRIS. <b>Cocok</b> =
          berhasil, <b>Tidak ada invoice</b> = uang masuk tapi tidak ada tagihan seharga itu, <b>Nominal ganda</b> = ada 2 tagihan dengan
          total sama.
        </Note>
      </Section>

      <Section id="invoice" icon={FileText} title="Langkah 4: Buat tagihan & cek pembayaran" desc="Ini yang dikirim ke pembeli.">
        <Steps
          items={[
            <>
              Buka <Go href="/dashboard/mypg/orders">Transaksi</Go>, klik <b>Buat Invoice</b>.
            </>,
            <>
              Isi <b>Nama Produk</b> (misal &ldquo;Top up 100 diamond&rdquo;) dan <b>Nominal</b>. Nama pelanggan boleh dikosongkan.
            </>,
            <>
              Kamu akan dapat <b>Total yang harus dibayar</b> (bisa lebih beberapa rupiah karena kode unik) dan <b>Link Pembayaran</b>.
            </>,
            <>Kirim link itu ke pembeli. Di link itu ada QRIS dan totalnya.</>,
            <>Pembeli scan dan bayar. Status di daftar Transaksi berubah sendiri jadi Lunas.</>,
          ]}
        />
        <Note tone="warn">
          Pembeli harus membayar <b>persis sama</b> dengan total, termasuk angka kecil di belakangnya. Rp 10.003 ya Rp 10.003, bukan Rp
          10.000. Kalau beda, robot tidak bisa mengenali.
        </Note>
        <Note>
          Pembeli sudah bayar tapi tidak terdeteksi? Kamu bisa menandai tagihan itu <b>lunas manual</b> dari halaman Transaksi.
        </Note>
      </Section>

      <Section id="pengaturan" icon={Settings} title="Pengaturan" desc="Semua ada di menu Pengaturan MyPG.">
        <ul className="space-y-3 text-sm leading-relaxed">
          <li>
            <b>Batas Waktu Pembayaran:</b> berapa menit pembeli boleh bayar sebelum tagihan hangus. Paling sedikit 5 menit, paling lama 7
            hari. (Khusus Shopee Otomatis selalu maksimal 5 menit.)
          </li>
          <li>
            <b>Kode Unik Maksimal:</b> paling banyak berapa rupiah yang boleh ditambahkan ke total. Kalau diisi 0 (mati), totalnya sama
            persis dengan harga, tapi hanya boleh ada <b>satu</b> tagihan menunggu untuk tiap harga.
          </li>
          <li>
            <b>Halaman Pembayaran:</b> ganti nama toko yang terlihat pembeli, dan isi link &ldquo;Kembali ke toko&rdquo; (misal link bot Telegram kamu).
          </li>
          <li>
            <b>Webhook:</b> pilih apakah website/bot kamu juga dikabari saat tagihan ditandai lunas manual atau kedaluwarsa.
          </li>
        </ul>
        <p className="text-sm">
          Buka <Go href="/dashboard/mypg/settings">Pengaturan MyPG</Go>, ubah, lalu jangan lupa klik <b>Simpan</b>.
        </p>
      </Section>

      <Section id="telegram" icon={BellRing} title="Dapat kabar lewat Telegram" desc="HP kamu bunyi tiap ada yang bayar.">
        <Steps
          items={[
            <>
              Buka <Go href="/dashboard/mypg/settings">Pengaturan MyPG</Go>, nyalakan tombol <b>Notifikasi Telegram</b>.
            </>,
            <>
              Paling gampang: pilih <b>bot bawaan</b>. Buka bot itu di Telegram dan tekan <b>Start</b>.
            </>,
            <>
              Cari tahu <b>Chat ID</b> kamu: chat ke <Code>@userinfobot</Code> di Telegram, dia akan membalas dengan angka ID kamu. Tempel
              angka itu ke kolom Chat ID.
            </>,
            <>
              Pilih kabar yang kamu mau: pembayaran diterima, uang masuk tanpa tagihan, atau tagihan kedaluwarsa. Klik <b>Simpan</b>, lalu
              coba tombol tes.
            </>,
          ]}
        />
        <Note>
          Mau kabarnya masuk ke grup? Masukkan bot ke grup itu; ID grup diawali <Code>-100</Code>. Untuk channel, jadikan bot admin lalu isi{' '}
          <Code>@username</Code> channel.
        </Note>
      </Section>

      <Section
        id="developer"
        icon={Code2}
        title="Untuk programmer (bot/website)"
        desc="Lewati bagian ini kalau kamu tidak membuat bot atau website."
      >
        <Steps
          items={[
            <>
              Latihan dulu di <Go href="/dashboard/mypg/sandbox">Sandbox</Go>. Di sana ada API Key dan Webhook khusus latihan. Tidak pakai
              uang asli dan tidak butuh lisensi.
            </>,
            <>
              Kalau sudah lancar, buka <Go href="/dashboard/mypg/integration">Integrasi API</Go>, buat proyek, lalu buat <b>API Key</b>{' '}
              (diawali <Code>mp_live_</Code>) dan isi alamat <b>Webhook</b> kamu.
            </>,
            <>
              Baca cara memanggilnya di{' '}
              <Link href="/docs/mypg" target="_blank" className="font-medium text-primary underline underline-offset-2">
                Dokumentasi API MyPG
              </Link>
              .
            </>,
          ]}
        />
        <Note tone="warn">API Key itu seperti kunci rumah. Jangan ditaruh di tempat yang bisa dilihat orang lain.</Note>
      </Section>

      <Section id="masalah" icon={CircleHelp} title="Kalau ada masalah" desc="Klik pertanyaannya untuk melihat jawaban.">
        <Faq
          items={[
            [
              'OTP Shopee tidak masuk ke HP saya.',
              <>
                Biasanya karena device report salah atau sudah lama. Klik <b>Ganti device report</b>, ulangi Bagian A dari awal (pastikan
                halaman Shopee di-refresh dengan F5 setelah centang Preserve log), lalu kirim OTP lagi. Tunggu sebentar sebelum minta OTP
                berkali-kali.
              </>,
            ],
            [
              'Di kotak Shopee tertulis "Fitur ini belum diaktifkan di server".',
              <>Fitur Shopee Otomatis belum dinyalakan oleh admin. Hubungi admin lewat menu Bantuan.</>,
            ],
            [
              'Shopee sudah Terhubung tapi tagihan tidak jadi Lunas.',
              <>
                Cek 3 hal: (1) QRIS yang <b>Dipakai</b> adalah ShopeePay, (2) pembeli membayar <b>persis</b> sesuai total, (3) pembeli
                membayar sebelum 5 menit habis. Lihat juga tulisan <i>Error terakhir</i> di kotak Shopee.
              </>,
            ],
            [
              'HP saya tertulis Offline.',
              <>
                Pastikan HP nyala dan ada internet, aplikasi Autoko MyPG terbuka, izin notifikasi diberikan, dan mode hemat baterai untuk
                aplikasi ini dimatikan. HP dianggap online kalau mengirim kabar dalam 15 menit terakhir.
              </>,
            ],
            [
              'Uang sudah masuk tapi tertulis "Tidak ada invoice".',
              <>
                Jumlah uang tidak sama dengan total tagihan mana pun (misal pembeli lupa angka kode unik), atau tagihannya sudah
                kedaluwarsa. Cek uangnya di aplikasi dompet, lalu tandai tagihan lunas manual bila memang benar.
              </>,
            ],
            [
              'Tidak bisa membuat tagihan baru.',
              <>
                Cek <Go href="/dashboard/mypg/billing">Billing &amp; Lisensi</Go>: mungkin lisensi habis atau kuota sudah terpakai semua.
                Cek juga apakah sudah ada QRIS yang Dipakai.
              </>,
            ],
            [
              'Apakah uang saya aman?',
              <>
                Ya. Uang langsung masuk ke dompet digital kamu sendiri. MyPG tidak bisa menarik atau memindahkan uang kamu; kami hanya
                melihat daftar uang masuk untuk mencocokkan tagihan.
              </>,
            ],
          ]}
        />
        <p className="text-sm text-muted-foreground">
          Masih bingung? Tanya admin lewat menu <Go href="/dashboard/support">Bantuan / Support</Go>, atau lihat juga{' '}
          <Go href="/dashboard/mypg/guides">Tata Cara</Go>.
        </p>
      </Section>

      <p className="flex items-center justify-center gap-2 pb-4 text-xs text-muted-foreground">
        <CreditCard className="size-3.5" /> Selamat berjualan!
      </p>
    </>
  );
}
