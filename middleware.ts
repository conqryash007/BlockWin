import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Injects x-subdomain header into API requests so server-side route handlers
 * can determine which subdomain the request originated from.
 * The host header from the browser carries the actual subdomain (e.g. site1.blockwin.space).
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const response = NextResponse.next();
  response.headers.set('x-subdomain', hostname);
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
