import { NextRequest, NextResponse } from 'next/server';

const V2_PATHS = ['/posts'];
const UAT_V1 = 'https://uat.gaubook.org/api/v1';
const PROD_V1 = 'https://app.gaubook.org/api/v1';
const PROD_V2 = 'https://app.gaubook.org/api/v2';
const LOCAL_V1 = 'http://localhost:5001/v1';

// These endpoints exist on UAT but not yet deployed to prod
const UAT_ONLY = ['/rescue'];

// Only proxy these path prefixes — anything else returns 404
const ALLOWED_PATH_PREFIXES = [
  '/auth/', '/user/', '/posts', '/explore/', '/products', '/rescue',
  '/reviews', '/notifications', '/orders', '/master-data/', '/expert-banners/',
];

const ALLOWED_ORIGINS = [
  'https://gaubook.org',
  'https://www.gaubook.org',
  'http://localhost:3002',
  'http://localhost:3000',
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'GET');
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'POST');
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'PUT');
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'PATCH');
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params, 'DELETE');
}
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function proxy(req: NextRequest, params: { path: string[] }, method: string) {
  const pathStr = '/' + params.path.join('/');

  // Reject paths not on the allowlist
  const allowed = ALLOWED_PATH_PREFIXES.some((p) => pathStr.startsWith(p));
  if (!allowed) {
    return new NextResponse('Not found', { status: 404 });
  }

  const isV2 = V2_PATHS.some((p) => pathStr.startsWith(p));
  const isUatOnly = UAT_ONLY.some((p) => pathStr.startsWith(p));
  const isDev = process.env.NODE_ENV === 'development';

  const base = isUatOnly ? UAT_V1 : isV2 ? PROD_V2 : isDev ? LOCAL_V1 : PROD_V1;
  const url = new URL(base + pathStr);
  // Only forward safe, known query params — never forward internal/privileged ones
  const ALLOWED_QUERY_PARAMS = new Set([
    'page', 'limit', 'status', 'type', 'role', 'search', 'state', 'district',
    'badge', 'lat', 'lng', 'radius', 'userId', 'vendorId', 'requestedRoleChange',
    'category', 'categoryId', 'subcategory', 'subcategoryId',
    'sortBy', 'sortOrder',
  ]);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (ALLOWED_QUERY_PARAMS.has(k)) url.searchParams.set(k, v);
  });

  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('multipart/form-data')) {
      body = await req.formData() as unknown as FormData;
    } else {
      headers['Content-Type'] = req.headers.get('content-type') || 'application/json';
      body = await req.text();
    }
  }

  const upstream = await fetch(url.toString(), { method, headers, body });
  const data = await upstream.text();

  const origin = req.headers.get('origin') ?? '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': corsOrigin,
    },
  });
}
