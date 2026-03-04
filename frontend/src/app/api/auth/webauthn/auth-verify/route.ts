/**
 * WebAuthn Authentication — Verification
 * POST /api/auth/webauthn/auth-verify
 *
 * STEP 2 OF 2 in the passkey authentication ceremony.
 *
 * The browser sends the signed authentication response (containing the credential ID,
 * authenticator data, and the signature). We:
 * 1. Look up the credential by ID in our database
 * 2. Verify the signature using the stored public key
 * 3. Verify the challenge, origin, RP ID, and user verification flag
 * 4. Check the counter against the stored value (anti-cloning check)
 * 5. Update the counter in the database
 * 6. Return the authenticated user's identity to the client
 *
 * COUNTER ANTI-CLONING:
 * FIDO2 authenticators maintain a monotonically increasing signature counter.
 * If we receive an authentication where counter <= stored_counter, the authenticator
 * was likely CLONED (someone extracted the private key and duplicated it on another device).
 * We REJECT such authentications and should alert security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const EXPECTED_ORIGIN = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`webauthn-auth-verify:${ip}`, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many authentication attempts. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  // Retrieve the challenge we issued in auth-challenge.
  const expectedChallenge = request.cookies.get('webauthn-auth-challenge')?.value;
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: 'Authentication challenge not found or expired. Please try again.' },
      { status: 400 }
    );
  }

  let body: AuthenticationResponseJSON;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // The credential ID from the response tells us which passkey was used.
  const credentialID = body.id;

  // Look up the authenticator record by credential ID.
  const authenticator = await prisma.authenticator.findUnique({
    where: { credentialID },
    include: { user: true },
  });

  if (!authenticator) {
    // WHY generic error message: we don't want to confirm which credential IDs exist.
    logAudit({
      userId: null,
      action: AuditAction.PASSKEY_LOGIN,
      entity: AuditEntity.USER,
      ip,
      details: { success: false, reason: 'Unknown credential ID' },
    });
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 401 }
    );
  }

  try {
    // v9 SimpleWebAuthn API: uses `authenticator` property (not `credential`)
    // AuthenticatorDevice type requires: credentialID, credentialPublicKey, counter, transports
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
        credentialPublicKey: Uint8Array.from(authenticator.publicKey),
        counter: Number(authenticator.counter),
        transports: authenticator.transports
          ? (JSON.parse(authenticator.transports) as AuthenticatorTransport[])
          : undefined,
      },
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      logAudit({
        userId: authenticator.userId,
        action: AuditAction.PASSKEY_LOGIN,
        entity: AuditEntity.USER,
        entityId: authenticator.userId,
        ip,
        details: { success: false, reason: 'Verification failed' },
      });
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 401 }
      );
    }

    const { newCounter } = verification.authenticationInfo;

    // ANTI-CLONING CHECK: The new counter must be strictly greater than the stored counter.
    // WHY: If newCounter <= storedCounter, the authenticator was likely cloned.
    if (newCounter <= authenticator.counter) {
      console.error('[SECURITY] WebAuthn counter anomaly — possible cloned authenticator', {
        userId: authenticator.userId,
        credentialID,
        storedCounter: String(authenticator.counter),
        receivedCounter: newCounter,
        ip,
      });

      logAudit({
        userId: authenticator.userId,
        action: AuditAction.PASSKEY_LOGIN,
        entity: AuditEntity.USER,
        entityId: authenticator.userId,
        ip,
        details: {
          success: false,
          reason: 'Counter regression — possible cloned authenticator',
          storedCounter: String(authenticator.counter),
          receivedCounter: newCounter,
        },
      });

      return NextResponse.json(
        { error: 'Authentication rejected: security anomaly detected. Please contact support.' },
        { status: 401 }
      );
    }

    // Update the counter — ratchet forward for future authentication.
    await prisma.authenticator.update({
      where: { credentialID },
      data: { counter: BigInt(newCounter) },
    });

    // Clear the challenge cookies — one-time use only.
    const response = NextResponse.json({
      success: true,
      userId: authenticator.userId,
      email: authenticator.user.email,
      name: authenticator.user.name,
      role: authenticator.user.role,
      message: 'Biometric authentication successful.',
    });

    response.cookies.delete('webauthn-auth-challenge');
    response.cookies.delete('webauthn-auth-email');

    logAudit({
      userId: authenticator.userId,
      action: AuditAction.PASSKEY_LOGIN,
      entity: AuditEntity.USER,
      entityId: authenticator.userId,
      ip,
      details: {
        success: true,
        credentialID,
        newCounter,
        userRole: authenticator.user.role,
      },
    });

    return response;
  } catch (error) {
    console.error('WebAuthn authentication error:', error);

    logAudit({
      userId: authenticator.userId,
      action: AuditAction.PASSKEY_LOGIN,
      entity: AuditEntity.USER,
      entityId: authenticator.userId,
      ip,
      details: { success: false, reason: 'Exception during verification' },
    });

    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 401 }
    );
  }
}
