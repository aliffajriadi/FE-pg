import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const homePathFor = (role?: string) => (role === 'ADMIN' ? '/admin' : '/dashboard');

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const isAdminRoute = pathname.startsWith('/admin');
  const isMerchantRoute = pathname.startsWith('/dashboard');

  if (!token) {
    if (isAdminRoute || isMerchantRoute) return redirect('/login');
    if (pathname === '/') return redirect('/login');
    return NextResponse.next();
  }

  if (pathname === '/' || pathname.startsWith('/login')) return redirect(homePathFor(role));
  if (isAdminRoute && role !== 'ADMIN') return redirect('/dashboard');
  if (isMerchantRoute && role === 'ADMIN') return redirect('/admin');

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/dashboard/:path*'],
};
