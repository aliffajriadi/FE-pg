import { fetchApi } from './client';
import type { ApiResponse, Store, User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export type RegisterStatus =
  | { status: 'pending'; expiresAt: string }
  | { status: 'expired' }
  | { status: 'verified'; phone?: string }
  | { status: 'done'; token: string; user: User };

export const authApi = {
  login: (payload: LoginPayload) =>
    fetchApi<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerStart: (mode: 'register' | 'login' | 'reset' = 'register') =>
    fetchApi<ApiResponse<{ token: string; code: string; waLink: string; botNumber: string; expiresAt: string }>>('/auth/register/start', {
      method: 'POST',
      body: JSON.stringify({ purpose: mode }),
    }),

  registerStatus: (token: string) =>
    fetchApi<ApiResponse<RegisterStatus>>('/auth/register/status', { method: 'POST', body: JSON.stringify({ token }) }),

  /** Bukti pemilik nomor akun yang sedang login (ubah password, langkah 1 ganti nomor). */
  verifyOwnPhoneStart: () =>
    fetchApi<ApiResponse<{ token: string; code: string; waLink: string; botNumber: string; expiresAt: string }>>(
      '/auth/register/change/start',
      {
        method: 'POST',
      },
    ),

  phoneStart: (oldToken?: string) =>
    fetchApi<ApiResponse<{ token: string; code: string; waLink: string; botNumber: string; expiresAt: string }>>(
      '/auth/register/phone/start',
      {
        method: 'POST',
        body: JSON.stringify({ oldToken }),
      },
    ),

  phoneConfirm: (token: string) =>
    fetchApi<ApiResponse<{ phone: string }>>('/auth/register/phone/confirm', { method: 'POST', body: JSON.stringify({ token }) }),

  resetPassword: (token: string, password: string) =>
    fetchApi<ApiResponse<{ token: string; user: User }>>('/auth/register/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  completeProfile: (payload: { name: string; email: string; password: string }) =>
    fetchApi<ApiResponse<null>>('/auth/complete-profile', { method: 'PATCH', body: JSON.stringify(payload) }),

  getMe: () => fetchApi<ApiResponse<{ user: User; store: Store | null; qris?: { id: number; name: string }[] }>>('/auth/me'),
};
