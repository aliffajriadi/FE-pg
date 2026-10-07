import Cookies from 'js-cookie';
import type { UserRole } from '@/types';

// Token disimpan di cookie agar bisa dibaca oleh proxy (route protection).
// Cookie "role" hanya untuk redirect UX; otorisasi tetap dilakukan backend.
const OPTIONS = { expires: 1, sameSite: 'lax' as const };

export function getToken() {
  return Cookies.get('token');
}

export function setSession(token: string, role: UserRole) {
  Cookies.set('token', token, OPTIONS);
  Cookies.set('role', role, OPTIONS);
}

export function clearSession() {
  Cookies.remove('token');
  Cookies.remove('role');
}

export function homePathFor(role?: string) {
  return role === 'ADMIN' ? '/admin' : '/dashboard';
}
