import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = generateNonce();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const isDev = process.env.NODE_ENV === 'development';

  // In dev mode, webpack uses eval() for module loading and ws: for HMR
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDev
    ? `connect-src 'self' ${apiUrl} ws://localhost:3001`
    : `connect-src 'self' ${apiUrl}`;

  const cspDirectives = [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com`,
    `font-src 'self'`,
    connectSrc,
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ];

  const cspHeaderValue = cspDirectives.join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeaderValue);
  response.headers.set('x-nonce', nonce);

  return response;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
