import { Fragment } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { assetUrl } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { CalloutTone, GuideBlock } from '@/lib/api/guides';

/**
 * Perender konten panduan. Teks memakai format ringan (tanpa HTML):
 * **tebal**, *miring*, `kode`, [teks](https://link), baris "- " untuk poin, "1. " untuk daftar bernomor.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${m.index}`;
    if (token.startsWith('**')) parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('`')) parts.push(<code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{token.slice(1, -1)}</code>);
    else if (token.startsWith('[')) {
      const label = token.slice(1, token.indexOf(']('));
      parts.push(
        <a key={key} href={m[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
          {label}
        </a>
      );
    } else parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = m.index! + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function withBreaks(lines: string[]) {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line)}
    </Fragment>
  ));
}

export function RichText({ text }: { text: string }) {
  const paragraphs = text.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  return (
    <>
      {paragraphs.map((p, i) => {
        const lines = p.split('\n').filter((l) => l.trim());
        if (!lines.length) return null;
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^\s*[-•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{withBreaks(lines)}</p>;
      })}
    </>
  );
}

const CALLOUT: Record<CalloutTone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200' },
  warning: { icon: AlertTriangle, className: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200' },
  success: { icon: CheckCircle2, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200' },
};

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    const id =
      host === 'youtu.be'
        ? u.pathname.slice(1)
        : u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || null;
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="pt-2 text-xl font-semibold tracking-tight">{block.text}</h2>;
    case 'text':
      return (
        <div className="space-y-3 leading-relaxed text-foreground/90">
          <RichText text={block.text} />
        </div>
      );
    case 'steps':
      return (
        <ol className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <div className="pt-0.5 leading-relaxed">{renderInline(item)}</div>
            </li>
          ))}
        </ol>
      );
    case 'image':
      return (
        <figure className="space-y-2">
          <a href={assetUrl(block.url)} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(block.url)} alt={block.caption || 'Gambar panduan'} className="max-h-[32rem] w-auto max-w-full rounded-lg border" loading="lazy" />
          </a>
          {block.caption && <figcaption className="text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    case 'video': {
      const id = youtubeId(block.url);
      if (!id) return null;
      return (
        <figure className="space-y-2">
          <div className="aspect-video overflow-hidden rounded-lg border bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={block.caption || 'Video panduan'}
              className="size-full"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          {block.caption && <figcaption className="text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    }
    case 'callout': {
      const { icon: Icon, className } = CALLOUT[block.tone] ?? CALLOUT.info;
      return (
        <div className={cn('flex gap-3 rounded-lg border p-4 text-sm', className)}>
          <Icon className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-2">
            <RichText text={block.text} />
          </div>
        </div>
      );
    }
    case 'divider':
      return <hr className="border-border" />;
    default:
      return null;
  }
}

export function GuideContent({ blocks }: { blocks: GuideBlock[] }) {
  if (!blocks.length) return <p className="text-sm text-muted-foreground">Panduan ini belum berisi konten.</p>;
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}
