import { NextRequest, NextResponse } from 'next/server';

const V2_PATHS = ['/posts'];
const UAT_V1 = 'https://uat.gaubook.org/api/v1';
const PROD_V1 = 'https://app.gaubook.org/api/v1';
const PROD_V2 = 'https://app.gaubook.org/api/v2';

// These endpoints exist on UAT but not yet deployed to prod
const UAT_ONLY = ['/rescue'];

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

async function proxy(req: NextRequest, params: { path: string[] }, method: string) {
  const pathStr = '/' + params.path.join('/');

  const isV2 = V2_PATHS.some((p) => pathStr.startsWith(p));
  const isUatOnly = UAT_ONLY.some((p) => pathStr.startsWith(p));

  const base = isUatOnly ? UAT_V1 : isV2 ? PROD_V2 : PROD_V1;
  const url = new URL(base + pathStr);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

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

  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
