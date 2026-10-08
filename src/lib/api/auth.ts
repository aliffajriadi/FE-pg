import { fetchApi } from './client';
import type { ApiResponse, Store, User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    fetchApi<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => fetchApi<ApiResponse<{ user: User; store: Store | null }>>('/auth/me'),
};
