/**
 * Next.js Configuration
 *
 * Security decisions documented below. Two layers of security headers are used:
 *
 * LAYER 1 (this file): next.config.js headers() — applies to all routes at the
 *   Next.js server level, including statically generated pages and server-side responses.
 *
 * LAYER 2 (middleware.ts): Edge middleware — applies to all routes at the Edge CDN level.
 *   Runs before the request hits the Next.js server. Handles authentication redirects.
 *
 * WHY BOTH: Belt-and-suspenders. In some deployment configurations (e.g., standalone
 * mode behind a reverse proxy), middleware may not run for certain response types.
 * Having headers in both places ensures complete coverage.
 *
 * @type {import('next').NextConfig}
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },

  /**
   * Image Remote Patterns
   *
   * SECURITY CHANGE: Previously set to `hostname: '**'` which allowed any HTTPS source.
   * WHY this was dangerous: An attacker could craft URLs pointing to malicious images
   * from any domain. Next.js's image optimization proxy would fetch and serve them,
   * potentially being used as an open redirect or SSRF vector.
   *
   * We now restrict to specific trusted domains:
   * 1. Our AWS S3 bucket — for patient documents and uploaded images
   * 2. Supabase storage — in case any assets are stored there
   *
   * PRODUCTION TODO: Replace 'us-east-1' and bucket name with actual values from env vars.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        // WHY wildcard for region: S3 bucket URLs vary by region.
        // This still restricts to AWS S3 only — no arbitrary domains.
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  /**
   * HTTP Security Headers
   *
   * Applied to all routes at the server level. These match the headers set in
   * middleware.ts for complete coverage.
   *
   * For detailed explanations of each header, see middleware.ts comments.
   */
  async headers() {
    return [
      {
        // Apply to ALL routes — pages, API routes, and static files served by Next.js
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            // max-age=31536000 = 1 year in seconds.
            // WHY 1 year: HSTS preload list requires a minimum of 1 year.
            // Once set, browsers remember this for a year even without the header.
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            // microphone=(self): required for voice recording feature
            // camera=(): explicitly deny — no video features in this EMR
            // geolocation=(): no location tracking
            // payment=(): no payment APIs
            value: 'camera=(), microphone=(self), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            // Note: 'unsafe-inline' and 'unsafe-eval' in script-src are required by
            // Next.js's runtime and Tailwind CSS. To remove them, implement nonce-based
            // CSP (Next.js supports this in next.config.js via the nonce option in
            // experimental, but it requires significant additional configuration).
            value: [
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
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
