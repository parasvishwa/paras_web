import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/profile', '/rescue/new', '/products/new'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get('gb_token')?.value;

  if (!token) {
    return redirectToLogin(req, pathname);
  }

  // Check JWT expiry without a library — parse the payload segment
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const res = redirectToLogin(req, pathname);
      res.cookies.delete('gb_token');
      return res;
    }
  } catch {
    // Malformed token — let the request through; the API will reject it
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest, next: string) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/profile', '/rescue/new', '/products/new'],
};

// Also export as middleware for backwards compatibility during Next.js migration
export { proxy as middleware };
