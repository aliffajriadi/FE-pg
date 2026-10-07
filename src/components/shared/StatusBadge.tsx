import { Badge } from '@/components/ui/badge';
import { getStatus, TONE_CLASS } from '@/lib/status';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const { label: defaultLabel, tone } = getStatus(status);
  return <Badge className={cn(TONE_CLASS[tone])}>{label ?? defaultLabel}</Badge>;
}

export function ToneBadge({ tone, children }: { tone: keyof typeof TONE_CLASS; children: React.ReactNode }) {
  return <Badge className={cn(TONE_CLASS[tone])}>{children}</Badge>;
}
