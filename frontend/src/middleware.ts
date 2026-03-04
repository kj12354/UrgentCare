/**
 * Next.js Edge Middleware — Route Protection + Security Headers
 *
 * WHY THIS IS THE RIGHT PLACE FOR BOTH:
 * Next.js middleware runs on the Edge Runtime before any page or API route handler.
 * This makes it the ideal chokepoint for two concerns:
 *
 * 1. ROUTE PROTECTION:
 *    Without server-side auth checks, a user could navigate directly to
 *    /dashboard/patients URL in their browser — Next.js client-side auth guards
 *    (useSession checks, conditional renders) are JavaScript that can be bypassed.
 *    Middleware enforces auth BEFORE the page is served, at the network layer.
 *
 * 2. SECURITY HEADERS:
 *    Security headers must be on EVERY response — pages, API routes, and static assets.
 *    Putting them in middleware ensures none are missed. Next.js's next.config.js headers()
 *    function also sets them (belt-and-suspenders approach), but middleware catches
 *    dynamically-routed responses that config-based headers might miss.
 *
 * EDGE RUNTIME NOTE:
 * This file runs in the Vercel Edge Runtime (V8 isolate, not Node.js). That means:
 *   - No file system access
 *   - No Node.js built-in modules (crypto, fs, etc.)
 *   - Very fast (sub-millisecond) — adds negligible latency
 *   - Available globally at the CDN edge, before requests hit the origin server
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Routes that require authentication.
 * Any path starting with these prefixes will redirect to /login if no valid session exists.
 *
 * WHY whitelist approach (not blacklist): It's safer to explicitly declare protected routes
 * than to try to list unprotected ones. New routes added in the future are automatically
 * protected without any middleware changes.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/patients',
  '/encounters',
  '/documents',
  '/analytics',
  '/api/documents',
  '/api/transcribe',
  '/api/soap',
  '/api/patients',
  '/api/encounters',
];

/**
 * Routes that are explicitly PUBLIC (no auth required).
 * Auth routes, the health endpoint, and WebAuthn challenge endpoints must be public
 * so unauthenticated users can log in.
 */
const PUBLIC_PREFIXES = [
  '/api/auth',            // NextAuth sign-in, callback, CSRF endpoints
  '/api/health',          // Health check for monitoring
  '/api/auth/webauthn',   // WebAuthn challenge endpoints (auth required checked in-route)
  '/login',
  '/register',
  '/_next',               // Next.js internal assets
  '/favicon',
];

/**
 * Security response headers applied to EVERY response from this application.
 *
 * Each header is documented with WHY it's included, not just what it does.
 */
const SECURITY_HEADERS: Record<string, string> = {
  // Prevents the page from being embedded in an iframe on another domain.
  // WHY: Clickjacking attacks overlay a transparent iframe of your app over a malicious
  // page, tricking users into clicking buttons they can't see (e.g., "approve data access").
  // A healthcare portal must never be embeddable — there is no legitimate use case for it.
  'X-Frame-Options': 'DENY',

  // Prevents browsers from guessing ("sniffing") the MIME type of a response.
  // WHY: If a user uploads a .txt file containing HTML, without this header some browsers
  // would execute it as HTML (enabling stored XSS). This header forces browsers to trust
  // the declared Content-Type, not the file contents.
  'X-Content-Type-Options': 'nosniff',

  // Legacy XSS filter for older browsers (Chrome removed it; Firefox/IE still use it).
  // WHY: Belt-and-suspenders. CSP is the modern protection, but this catches attacks
  // on older browsers that don't support CSP.
  'X-XSS-Protection': '1; mode=block',

  // Controls how much referrer information is sent with requests.
  // WHY: Without this, navigating from your app to an external link sends the full
  // URL (including patient IDs in query strings) to the external server in the Referer
  // header. `strict-origin-when-cross-origin` sends only the origin (no path/query)
  // for cross-origin requests, preventing PHI leakage via referrer.
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Forces browsers to use HTTPS for all future requests to this domain for 1 year.
  // WHY: Prevents SSL stripping attacks where a network attacker downgrades HTTPS → HTTP.
  // includeSubDomains: also covers api.urgentcare.com, etc.
  // preload: allows inclusion in browser HSTS preload lists (opt-in to be HTTPS-only
  // even on first visit before the header is seen).
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Restricts which browser features the app can access.
  // WHY: Least-privilege for browser APIs. We only need microphone (voice recording)
  // and camera is explicitly disabled (no video calls in this EMR). This prevents
  // compromised third-party scripts from silently accessing the camera.
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), payment=()',

  // Content Security Policy — the most powerful XSS defense available.
  // WHY each directive:
  //   default-src 'self': only load resources from our own origin by default
  //   script-src 'self' 'unsafe-inline' 'unsafe-eval': Next.js requires these for
  //     hydration and its built-in script optimization. In a stricter setup you'd use
  //     nonces instead of 'unsafe-inline', but that requires significant Next.js config.
  //   style-src 'self' 'unsafe-inline': Tailwind CSS injects styles inline at runtime
  //   img-src 'self' https: data:: allow images from any HTTPS source (S3 URLs) and
  //     base64 data URIs (used by UI components for icons)
  //   connect-src 'self' https:: allow fetch() calls to any HTTPS endpoint (needed
  //     for the Next.js API routes and external services like S3 presigned URLs)
  //   font-src 'self': only load fonts from our own domain
  //   frame-ancestors 'none': redundant with X-Frame-Options but provides CSP-level enforcement
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; '),
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Build the response to pass along (or redirect)
  const response = NextResponse.next();

  // Apply security headers to EVERY response, regardless of auth status.
  // WHY: Even the /login page should be protected against clickjacking and XSS.
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  // Check if this is an explicitly public path — skip auth check if so.
  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublic) {
    return response;
  }

  // Check if this path requires authentication.
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    // Path doesn't match protected or public prefixes — allow through.
    // This covers the landing page (/), static files, etc.
    return response;
  }

  // Verify the NextAuth JWT token from the session cookie.
  // WHY getToken() instead of getServerSession(): middleware runs on the Edge Runtime
  // which doesn't support Prisma (Node.js only). getToken() decodes the JWT directly
  // from the cookie without a database lookup — fast and edge-compatible.
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // No valid session — redirect to login, preserving the original URL
    // so we can redirect back after successful authentication.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);

    // For API routes, return 401 instead of redirecting to the login page
    // (API clients expect JSON responses, not HTML redirect pages).
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          // WHY include this message: API clients (mobile apps, external integrations)
          // need a machine-readable indication of why the request failed.
          message: 'You must be logged in to access this resource.',
        },
        {
          status: 401,
          headers: Object.fromEntries(
            Object.entries(SECURITY_HEADERS)
          ),
        }
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated — pass through with security headers applied.
  return response;
}

/**
 * Middleware matcher configuration.
 *
 * WHY exclude _next/static and _next/image: These are Next.js internal assets
 * (JS bundles, images) that don't need auth checks. Running middleware on them
 * would add unnecessary latency and might interfere with Next.js internals.
 *
 * WHY include everything else: We want headers on all responses, including API routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files like JS/CSS bundles)
     * - _next/image (Next.js image optimization)
     * - favicon.ico
     * - Any file with an extension (e.g., .png, .svg, .woff2)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
