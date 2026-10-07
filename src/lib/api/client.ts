import { clearSession, getToken } from '@/lib/session';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000/api';

// Origin backend (tanpa /api), dipakai untuk file upload seperti /uploads/...
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function assetUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    // Token kedaluwarsa / tidak valid: hapus sesi dan kembali ke login
    if (response.status === 401 && token && typeof window !== 'undefined') {
      clearSession();
      // Navigasi penuh (bukan router) agar seluruh state/cache client ikut ter-reset
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.message || `Terjadi kesalahan (${response.status})`, response.status);
  }

  return response;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await request(endpoint, options);
  if (response.status === 204) return {} as T;
  return response.json();
}

export async function fetchBlob(endpoint: string): Promise<Blob> {
  const response = await request(endpoint);
  return response.blob();
}

export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value));
  }
  const str = query.toString();
  return str ? `?${str}` : '';
}
