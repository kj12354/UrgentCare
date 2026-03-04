/**
 * WebAuthn Registration — Challenge Generation
 * POST /api/auth/webauthn/register-challenge
 *
 * STEP 1 OF 2 in the passkey registration ceremony.
 *
 * HOW WEBAUTHN REGISTRATION WORKS:
 * 1. (This route) Server generates a random challenge and sends it to the browser
 *    along with configuration for the new credential.
 * 2. The browser passes these options to navigator.credentials.create().
 * 3. The user performs biometric verification (Touch ID, Face ID, Windows Hello PIN, etc.).
 * 4. The device's secure enclave generates an asymmetric key pair, signs the challenge
 *    with the private key, and returns the PUBLIC key + signature to the browser.
 * 5. (register-verify route) Browser sends the response to our server for verification.
 * 6. Server stores the public key in the Authenticator table.
 *
 * WHY WEBAUTHN OVER TOTP (Google Authenticator):
 * - WebAuthn is phishing-resistant: credentials are cryptographically bound to the
 *   relying party ID (e.g., "urgentcare.com"). They simply WON'T WORK on a fake domain.
 *   TOTP codes work on any domain — attackers can phish them in real-time.
 * - No shared secrets: TOTP relies on a shared HMAC key. WebAuthn uses public-key crypto.
 * - Better UX: Touch ID / Face ID is faster than reading a 6-digit code.
 * - FIDO2 Certification: WebAuthn is endorsed by NIST SP 800-63B as an AAL2/AAL3 authenticator.
 *
 * AUTHENTICATION REQUIREMENT:
 * This route requires an existing password session. WHY: Passkey registration is a
 * privileged operation — we must know WHO is registering the passkey before we store
 * a public key under their account. An unauthenticated registration would let anyone
 * register a passkey for any account.
 *
 * CHALLENGE STORAGE:
 * The challenge is stored in an httpOnly cookie (encrypted, short-lived).
 * WHY cookie (not server-side session): Edge Runtime / Vercel doesn't have persistent
 * server memory across requests. The challenge must travel to the verify endpoint,
 * and a signed cookie is the correct stateless mechanism for this.
 *
 * WHY NOT store challenge in localStorage: localStorage is accessible to JavaScript —
 * an XSS attack could steal the challenge and craft a malicious registration.
 * httpOnly cookies are inaccessible to JavaScript.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/audit';

// The Relying Party (RP) name shown to users in biometric prompts.
// e.g., "Sign in to UrgentCare EMR using Touch ID"
const RP_NAME = 'UrgentCare EMR';

// The RP ID must match the domain the app is served from.
// WHY this matters: WebAuthn credentials are bound to the RP ID.
// A credential registered for "urgentcare.com" will NOT work on "evil.com".
// This is the core phishing-resistance property of WebAuthn.
// In development, 'localhost' is a valid RP ID.
const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Rate limit passkey registration — it's an infrequent operation.
  // 5 attempts per 15 minutes prevents automated registration attacks.
  const limit = rateLimit(`webauthn-reg-challenge:${ip}`, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  // Must be authenticated to register a passkey.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'You must be logged in to register a passkey.' },
      { status: 401 }
    );
  }

  // Fetch existing authenticators for this user.
  // WHY: We pass existing credential IDs to generateRegistrationOptions() so the
  // browser won't register a credential that already exists on this device.
  // This prevents accidentally registering the same device twice.
  const existingAuthenticators = await prisma.authenticator.findMany({
    where: { userId: session.user.id },
    select: { credentialID: true, transports: true },
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    // userID must be a string — we use the database user ID (opaque CUID, not PII)
    userID: session.user.id,
    userName: session.user.email ?? session.user.name ?? session.user.id,
    userDisplayName: session.user.name ?? session.user.email ?? 'User',

    // Require user verification (biometric or PIN) — not just device presence.
    // WHY 'required': HIPAA requires strong authentication. 'preferred' would allow
    // some authenticators to skip biometric verification, weakening security.
    // 'required' ensures every login requires Touch ID / Face ID / PIN.
    authenticatorSelection: {
      userVerification: 'required',
      // 'preferred': prefer discoverable (resident key) credentials so users don't
      // need to type their email before biometric authentication.
      residentKey: 'preferred',
    },

    // Exclude credentials that already exist on this account.
    // WHY: Prevents duplicate registration of the same physical device.
    excludeCredentials: existingAuthenticators.map((auth) => ({
      id: Buffer.from(auth.credentialID, 'base64url'),
      type: 'public-key' as const,
      transports: auth.transports
        ? (JSON.parse(auth.transports) as AuthenticatorTransport[])
        : undefined,
    })),

    // Timeout: 60 seconds for the user to complete the biometric verification.
    // WHY 60s: Long enough for a user to find and pick up their phone (for FIDO2 cross-device),
    // but short enough to prevent hung registration ceremonies.
    timeout: 60000,
  });

  // Store the challenge in a short-lived, httpOnly, Secure cookie.
  // WHY httpOnly: prevents JavaScript (XSS) from reading the challenge.
  // WHY Secure: only transmitted over HTTPS.
  // WHY short TTL (5 min): the challenge is a one-time-use value — keeping it
  // alive longer than necessary increases the attack surface.
  const response = NextResponse.json({ options });
  response.cookies.set('webauthn-reg-challenge', options.challenge, {
    httpOnly: true,        // Not accessible to JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',   // Not sent on cross-origin requests (CSRF protection)
    maxAge: 5 * 60,       // 5 minutes — expire after the ceremony window
    path: '/api/auth/webauthn', // Scoped to WebAuthn routes only
  });

  return response;
}
