'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Heading,
  Image as ImageIcon,
  ListOrdered,
  Loader2,
  Minus,
  Trash2,
  Type,
  Upload,
  Video,
} from 'lucide-react';
import { assetUrl } from '@/lib/api/client';
import { adminGuidesApi, type Guide, type GuideAudience, type GuideBlock } from '@/lib/api/guides';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { StatusTabs } from '@/components/shared/StatusTabs';
import { GuideContent, youtubeId } from '@/features/guides/GuideContent';
import { AUDIENCE_LABEL } from './AdminGuides';

type EditableBlock = GuideBlock & { _key: string };

const newKey = () => Math.random().toString(36).slice(2, 10);
const withKeys = (blocks: GuideBlock[]): EditableBlock[] => blocks.map((b) => ({ ...b, _key: newKey() }));
// Hapus _key (hanya untuk React) dan langkah kosong sebelum disimpan
const stripKeys = (blocks: EditableBlock[]): GuideBlock[] =>
  blocks.map((block) => {
    const b = { ...block } as Partial<EditableBlock>;
    delete b._key;
    return b.type === 'steps' ? { ...b, items: b.items!.filter((s) => s.trim()) } : b;
  }) as GuideBlock[];

const BLOCK_TYPES: { type: GuideBlock['type']; label: string; icon: typeof Type; make: () => GuideBlock }[] = [
  { type: 'heading', label: 'Judul', icon: Heading, make: () => ({ type: 'heading', text: '' }) },
  { type: 'text', label: 'Teks', icon: Type, make: () => ({ type: 'text', text: '' }) },
  { type: 'steps', label: 'Langkah', icon: ListOrdered, make: () => ({ type: 'steps', items: [''] }) },
  { type: 'image', label: 'Gambar', icon: ImageIcon, make: () => ({ type: 'image', url: '', caption: '' }) },
  { type: 'video', label: 'Video YouTube', icon: Video, make: () => ({ type: 'video', url: '', caption: '' }) },
  { type: 'callout', label: 'Catatan', icon: AlertTriangle, make: () => ({ type: 'callout', tone: 'info', text: '' }) },
  { type: 'divider', label: 'Garis', icon: Minus, make: () => ({ type: 'divider' }) },
];
const LABEL = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b.label])) as Record<GuideBlock['type'], string>;
const TONE_OPTIONS = [
  { value: 'info', label: 'Info (biru)' },
  { value: 'warning', label: 'Peringatan (kuning)' },
  { value: 'success', label: 'Tips (hijau)' },
];
const AUDIENCE_OPTIONS = (Object.keys(AUDIENCE_LABEL) as GuideAudience[]).map((value) => ({ value, label: AUDIENCE_LABEL[value] }));

const FORMAT_HINT = 'Format: **tebal**, *miring*, `kode`, [teks](https://link). Baris diawali "- " jadi poin, "1. " jadi daftar bernomor. Pisahkan paragraf dengan baris kosong.';

function ImageField({ block, onChange }: { block: Extract<GuideBlock, { type: 'image' }>; onChange: (b: GuideBlock) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const res = await adminGuidesApi.uploadImage(file);
      onChange({ ...block, url: res.data.url });
    } catch (error) {
      toast.error((error as Error).message || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {block.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetUrl(block.url)} alt="" className="max-h-56 rounded-lg border" />
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada gambar</p>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />} {block.url ? 'Ganti Gambar' : 'Unggah Gambar'}
        </Button>
        <p className="self-center text-xs text-muted-foreground">JPG, PNG, WEBP, atau GIF, maks 5MB.</p>
      </div>
      <Input
        placeholder="Atau tempel link gambar https://..."
        value={block.url.startsWith('/uploads/') ? '' : block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value.trim() })}
      />
      <Input placeholder="Keterangan gambar (opsional)" value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
    </div>
  );
}

function BlockFields({ block, onChange }: { block: GuideBlock; onChange: (b: GuideBlock) => void }) {
  switch (block.type) {
    case 'heading':
      return <Input placeholder="Judul bagian" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />;
    case 'text':
      return (
        <div className="space-y-1.5">
          <Textarea rows={5} placeholder="Tulis isi panduan..." value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
          <p className="text-xs text-muted-foreground">{FORMAT_HINT}</p>
        </div>
      );
    case 'steps':
      return (
        <div className="space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <Input
                placeholder={`Langkah ${i + 1}`}
                value={item}
                onChange={(e) => onChange({ ...block, items: block.items.map((x, j) => (j === i ? e.target.value : x)) })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Hapus langkah"
                disabled={block.items.length === 1}
                onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...block, items: [...block.items, ''] })}>
            Tambah Langkah
          </Button>
        </div>
      );
    case 'image':
      return <ImageField block={block} onChange={onChange} />;
    case 'video':
      return (
        <div className="space-y-2">
          <Input placeholder="https://youtu.be/... atau https://www.youtube.com/watch?v=..." value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value.trim() })} />
          {block.url && !youtubeId(block.url) && <p className="text-xs text-destructive">Link harus dari YouTube</p>}
          <Input placeholder="Keterangan video (opsional)" value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
        </div>
      );
    case 'callout':
      return (
        <div className="space-y-2">
          <SimpleSelect value={block.tone} onValueChange={(v) => onChange({ ...block, tone: (v || 'info') as typeof block.tone })} options={TONE_OPTIONS} />
          <Textarea rows={3} placeholder="Isi catatan..." value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
        </div>
      );
    case 'divider':
      return <p className="text-xs text-muted-foreground">Garis pemisah antar bagian.</p>;
  }
}

function EditorForm({ guide }: { guide: Guide | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(guide?.title ?? '');
  const [summary, setSummary] = useState(guide?.summary ?? '');
  const [audience, setAudience] = useState<GuideAudience>(guide?.audience ?? 'ALL');
  const [sortOrder, setSortOrder] = useState(guide?.sortOrder ?? 0);
  const [isPublished, setIsPublished] = useState(guide?.isPublished ?? false);
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => withKeys(guide?.blocks ?? []));
  const [view, setView] = useState('edit');

  const update = (key: string, b: GuideBlock) => setBlocks((list) => list.map((x) => (x._key === key ? { ...b, _key: key } : x)));
  const move = (index: number, dir: -1 | 1) =>
    setBlocks((list) => {
      const next = [...list];
      [next[index], next[index + dir]] = [next[index + dir], next[index]];
      return next;
    });
  const add = (make: () => GuideBlock) => setBlocks((list) => [...list, { ...make(), _key: newKey() }]);

  const save = useApiMutation(
    () => {
      const body = { title, summary: summary.trim() || null, audience, sortOrder, isPublished, blocks: stripKeys(blocks) };
      return guide ? adminGuidesApi.update(guide.id, body) : adminGuidesApi.create(body);
    },
    {
      invalidate: [['admin-guides'], ['guides']],
      onSuccess: (res) => {
        queryClient.setQueryData(['admin-guide', res.data.id], { success: true, data: res.data });
        if (!guide) router.replace(`/admin/guides/${res.data.id}`);
      },
    }
  );

  return (
    <>
      <PageHeader title={guide ? 'Edit Panduan' : 'Panduan Baru'} description={guide ? guide.title : 'Susun panduan dari blok teks, langkah, gambar, dan video.'}>
        <Link href="/admin/guides" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft /> Kembali
        </Link>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !title.trim()}>
          {save.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Judul" htmlFor="guide-title">
            <Input id="guide-title" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Cara Menghubungkan HP ke MyPG" />
          </FormField>
          <FormField label="Pembaca" htmlFor="guide-audience" hint="Panduan MyPG hanya tampil di Panel MyPG untuk merchant dengan akses MyPG.">
            <SimpleSelect id="guide-audience" value={audience} onValueChange={(v) => setAudience((v || 'ALL') as GuideAudience)} options={AUDIENCE_OPTIONS} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Ringkasan (opsional)" htmlFor="guide-summary" hint="Tampil di daftar panduan.">
              <Input id="guide-summary" value={summary} maxLength={300} onChange={(e) => setSummary(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Urutan" htmlFor="guide-order" hint="Angka kecil tampil lebih dulu.">
            <Input id="guide-order" type="number" min={0} max={9999} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
          </FormField>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3 md:self-end">
            <div>
              <Label htmlFor="guide-published">Terbitkan</Label>
              <p className="text-xs text-muted-foreground">{isPublished ? 'Terlihat oleh merchant.' : 'Draf, belum terlihat merchant.'}</p>
            </div>
            <Switch id="guide-published" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </CardContent>
      </Card>

      <StatusTabs
        tabs={[
          { value: 'edit', label: `Konten (${blocks.length} blok)` },
          { value: 'preview', label: 'Pratinjau' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'preview' ? (
        <Card className="mx-auto w-full max-w-3xl">
          <CardContent className="space-y-6 py-2">
            <header className="space-y-2 border-b pb-5">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title || 'Tanpa judul'}</h1>
              {summary && <p className="text-muted-foreground">{summary}</p>}
            </header>
            <GuideContent blocks={stripKeys(blocks).filter((b) => b.type !== 'image' || b.url)} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <Card key={block._key} size="sm">
              <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle className="flex-1 text-sm">
                  {i + 1}. {LABEL[block.type]}
                </CardTitle>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Naikkan" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Turunkan" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-destructive"
                  aria-label="Hapus blok"
                  onClick={() => setBlocks((list) => list.filter((x) => x._key !== block._key))}
                >
                  <Trash2 />
                </Button>
              </CardHeader>
              <CardContent>
                <BlockFields block={block} onChange={(b) => update(block._key, b)} />
              </CardContent>
            </Card>
          ))}

          <Card className="border-dashed">
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">Tambah blok</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map(({ type, label, icon: Icon, make }) => (
                  <Button key={type} type="button" size="sm" variant="outline" onClick={() => add(make)}>
                    <Icon /> {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function GuideEditor({ id }: { id: number | null }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-guide', id],
    queryFn: () => adminGuidesApi.get(id!),
    select: (res) => res.data,
    enabled: id !== null,
  });

  if (id === null) return <EditorForm guide={null} />;
  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (error || !data) return <p className="text-sm text-destructive">Panduan tidak ditemukan.</p>;
  return <EditorForm key={data.id} guide={data} />;
}
