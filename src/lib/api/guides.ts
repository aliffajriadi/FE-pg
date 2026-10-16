import { fetchApi } from './client';
import type { ApiResponse } from '@/types';

type Msg = ApiResponse<unknown>;

export type GuideAudience = 'ALL' | 'MYPG';
export type CalloutTone = 'info' | 'warning' | 'success';

export type GuideBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'image'; url: string; caption?: string | null }
  | { type: 'video'; url: string; caption?: string | null }
  | { type: 'callout'; tone: CalloutTone; text: string }
  | { type: 'divider' };

export interface GuideSummary {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  audience: GuideAudience;
  updatedAt: string;
}

export interface Guide extends GuideSummary {
  blocks: GuideBlock[];
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

export type GuideInput = Pick<Guide, 'title' | 'audience' | 'blocks' | 'isPublished' | 'sortOrder'> & { summary: string | null };

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const guidesApi = {
  list: (audience?: GuideAudience) =>
    fetchApi<ApiResponse<GuideSummary[]>>(`/guides${audience ? `?audience=${audience}` : ''}`),
  get: (slug: string) => fetchApi<ApiResponse<Guide>>(`/guides/${encodeURIComponent(slug)}`),
};

export const adminGuidesApi = {
  list: () => fetchApi<ApiResponse<(GuideSummary & { isPublished: boolean; sortOrder: number })[]>>('/admin/guides'),
  get: (id: number) => fetchApi<ApiResponse<Guide>>(`/admin/guides/${id}`),
  create: (body: GuideInput) => fetchApi<ApiResponse<Guide>>('/admin/guides', json('POST', body)),
  update: (id: number, body: Partial<GuideInput>) => fetchApi<ApiResponse<Guide>>(`/admin/guides/${id}`, json('PATCH', body)),
  remove: (id: number) => fetchApi<Msg>(`/admin/guides/${id}`, json('DELETE')),
  uploadImage: (file: File) => {
    const body = new FormData();
    body.append('image', file);
    return fetchApi<ApiResponse<{ url: string }>>('/admin/guides/upload', { method: 'POST', body });
  },
};
