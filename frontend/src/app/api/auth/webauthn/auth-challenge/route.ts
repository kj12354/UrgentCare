/**
 * WebAuthn Authentication — Challenge Generation
 * POST /api/auth/webauthn/auth-challenge
 *
 * STEP 1 OF 2 in the passkey authentication ceremony.
 *
 * HOW WEBAUTHN AUTHENTICATION WORKS:
 * 1. (This route) Server generates a random challenge and (optionally) lists
 *    allowed credentials for the user.
 * 2. Browser passes options to navigator.credentials.get().
 * 3. User's device presents registered passkeys — user selects one and verifies
 *    with biometric (Touch ID, Face ID) or PIN.
 * 4. Device signs the challenge with the credential's private key.
 * 5. (auth-verify route) Browser sends the signed response to our server.
 * 6. Server verifies the signature against the stored public key.
 * 7. If valid, server creates a NextAuth session.
 *
 * TWO MODES:
 * A. With email: user provides their email first, we look up their credentials
 *    and provide allowCredentials (targeted authentication — faster UX).
 * B. Without email: passkeys are "discoverable" — the browser shows all registered
 *    passkeys for this domain and the user picks one.
 *
 * WHY a separate challenge per authentication:
 * The challenge is a cryptographic nonce (number used once). If we reused challenges,
 * an attacker could record a valid authentication response and replay it.
 * Each challenge is random (128 bits of entropy from the WebAuthn library) and
 * expires after 60 seconds.
 *
 * THIS ROUTE IS PUBLIC (no session required):
 * The user is unauthenticated at this point — they're trying to log in.
 * The authentication happens in auth-verify after they complete biometric.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/audit';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Auth endpoint rate limiting — same as password login: 5 per 15 minutes.
  // WHY: Without this, an attacker could probe whether a user has registered any
  // passkeys by watching which credential IDs are returned.
  const limit = rateLimit(`webauthn-auth-challenge:${ip}`, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many authentication attempts. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  // Optional: user can provide their email for targeted authentication.
  // If not provided, we use discoverable credentials (passkey mode).
  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional for this endpoint — ignore parse errors
  }

  let allowCredentials: { id: Buffer; type: 'public-key'; transports?: AuthenticatorTransport[] }[] = [];

  if (body.email) {
    // Look up the user and their registered passkeys.
    // WHY not error if user not found: revealing "no account with this email"
    // is a user enumeration vulnerability. We silently return an empty credential
    // list — the auth ceremony will fail gracefully without leaking account existence.
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { authenticators: true },
    });

    if (user?.authenticators.length) {
      allowCredentials = user.authenticators.map((auth) => ({
        id: Buffer.from(auth.credentialID, 'base64url'),
        type: 'public-key' as const,
        transports: auth.transports
          ? (JSON.parse(auth.transports) as AuthenticatorTransport[])
          : undefined,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    // If we know the user's credentials, provide them for a targeted authentication.
    // If empty, browser shows all passkeys registered for this domain (discoverable).
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    userVerification: 'required', // Require biometric/PIN — not just device presence
    timeout: 60000, // 60 seconds to complete biometric verification
  });

  // Store the challenge in an httpOnly cookie (same reasoning as register-challenge).
  // Also store the email (if provided) so auth-verify can look up the user.
  const response = NextResponse.json({ options });

  response.cookies.set('webauthn-auth-challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60, // 60 seconds — matches the timeout above
    path: '/api/auth/webauthn',
  });

  if (body.email) {
    // Store email for the verify step so it can look up the user.
    // WHY store separately (not in the challenge cookie): keeps concerns separate
    // and avoids putting PII inside a crypto-bearing cookie.
    response.cookies.set('webauthn-auth-email', body.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60,
      path: '/api/auth/webauthn',
    });
  }

  return response;
}
