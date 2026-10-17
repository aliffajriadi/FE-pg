import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const homePathFor = (role?: string) => (role === 'ADMIN' ? '/admin' : role === 'SUBADMIN' ? '/subadmin' : '/dashboard');

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const isAdminRoute = pathname.startsWith('/admin');
  const isMerchantRoute = pathname.startsWith('/dashboard');
  const isSubadminRoute = pathname.startsWith('/subadmin');

  if (!token) {
    if (isAdminRoute || isMerchantRoute || isSubadminRoute) return redirect('/login');
    // Landing page sementara disembunyikan; aktifkan lagi dengan menghapus baris ini & redirect di app/page.tsx
    if (pathname === '/') return redirect('/login');
    return NextResponse.next();
  }

  if (pathname === '/' || pathname.startsWith('/login')) return redirect(homePathFor(role));
  if (isAdminRoute && role !== 'ADMIN') return redirect(homePathFor(role));
  if (isMerchantRoute && role !== 'MERCHANT') return redirect(homePathFor(role));
  if (isSubadminRoute && role !== 'SUBADMIN') return redirect(homePathFor(role));

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/dashboard/:path*', '/subadmin/:path*'],
};
