/**
 * WebAuthn Registration — Verification
 * POST /api/auth/webauthn/register-verify
 *
 * STEP 2 OF 2 in the passkey registration ceremony.
 *
 * After the user completes biometric verification on their device, the browser
 * sends a RegistrationResponseJSON to this endpoint. We verify:
 * 1. The challenge matches what we issued in register-challenge
 * 2. The origin matches our expected origin (prevents credential theft from other domains)
 * 3. The attestation is valid (the credential really came from a WebAuthn authenticator)
 *
 * On success, we store the public key in the Authenticator table.
 * The private key NEVER reaches our server — it stays in the device's secure enclave.
 *
 * SECURITY PROPERTIES VERIFIED HERE:
 * - Challenge freshness: the signed challenge must match what we issued (prevents replay)
 * - Origin binding: credential bound to our domain (prevents credential reuse on phishing sites)
 * - User verification: biometric/PIN was required (from authenticatorSelection in challenge)
 * - Counter: stored for future anti-cloning detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
// The expected origin must exactly match the origin in the client's response.
// For production: 'https://urgentcare.yourdomain.com'
// For development: 'http://localhost:3000'
const EXPECTED_ORIGIN = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'You must be logged in to register a passkey.' },
      { status: 401 }
    );
  }

  // Retrieve the challenge we stored in the cookie during register-challenge.
  // WHY cookie (not request body): the challenge must be server-controlled.
  // If we let the client send the challenge, they could craft a malicious registration.
  const expectedChallenge = request.cookies.get('webauthn-reg-challenge')?.value;
  if (!expectedChallenge) {
    return NextResponse.json(
      {
        error: 'Registration challenge not found or expired. Please restart registration.',
      },
      { status: 400 }
    );
  }

  let body: RegistrationResponseJSON;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // verifyRegistrationResponse performs all cryptographic verification:
    // - Parses and validates the CBOR-encoded attestation object
    // - Verifies the challenge signature
    // - Verifies the origin and RP ID binding
    // - Checks user verification flag
    // - Extracts the public key for storage
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      // requireUserVerification: true — enforce that the authenticator performed
      // biometric or PIN verification (not just device presence).
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      logAudit({
        userId: session.user.id,
        action: AuditAction.PASSKEY_REGISTER,
        entity: AuditEntity.USER,
        entityId: session.user.id,
        ip,
        details: { success: false, reason: 'Verification failed' },
      });
      return NextResponse.json(
        { error: 'Passkey registration failed. Please try again.' },
        { status: 400 }
      );
    }

    const {
      credentialPublicKey,  // v9 API: top-level fields, not nested under 'credential'
      credentialID,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo;

    // Store the new authenticator in the database.
    // The publicKey (COSE-encoded) is stored as bytes — it will be used in future
    // authentications to verify signatures.
    await prisma.authenticator.create({
      data: {
        userId: session.user.id,
        credentialID: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey),
        // Counter starts at the value from the first ceremony.
        counter: BigInt(counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: body.response.transports
          ? JSON.stringify(body.response.transports)
          : null,
      },
    });

    // Clear the challenge cookie — it's a one-time-use value.
    const response = NextResponse.json({
      success: true,
      message: 'Passkey registered successfully. You can now use biometric login.',
    });
    response.cookies.delete('webauthn-reg-challenge');

    logAudit({
      userId: session.user.id,
      action: AuditAction.PASSKEY_REGISTER,
      entity: AuditEntity.USER,
      entityId: session.user.id,
      ip,
      details: {
        success: true,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    });

    return response;
  } catch (error) {
    console.error('WebAuthn registration error:', error);

    logAudit({
      userId: session.user.id,
      action: AuditAction.PASSKEY_REGISTER,
      entity: AuditEntity.USER,
      entityId: session.user.id,
      ip,
      details: { success: false, error: 'Exception during verification' },
    });

    return NextResponse.json(
      { error: 'Passkey registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
