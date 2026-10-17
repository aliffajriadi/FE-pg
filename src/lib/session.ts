import Cookies from 'js-cookie';
import type { UserRole } from '@/types';

// Token disimpan di cookie agar bisa dibaca oleh proxy (route protection).
// Cookie "role" hanya untuk redirect UX; otorisasi tetap dilakukan backend.
const OPTIONS = { sameSite: 'lax' as const };
const REMEMBER_DAYS = 1;

export function getToken() {
  return Cookies.get('token');
}

/**
 * remember = true: cookie bertahan 1 hari walau browser ditutup (sama dengan masa berlaku token 24 jam).
 * remember = false: cookie sesi, hilang saat browser ditutup.
 */
export function setSession(token: string, role: UserRole, remember = false) {
  const options = remember ? { ...OPTIONS, expires: REMEMBER_DAYS } : OPTIONS;
  Cookies.set('token', token, options);
  Cookies.set('role', role, options);
}

export function clearSession() {
  Cookies.remove('token');
  Cookies.remove('role');
}

export function homePathFor(role?: string) {
  return role === 'ADMIN' ? '/admin' : role === 'SUBADMIN' ? '/subadmin' : '/dashboard';
}
