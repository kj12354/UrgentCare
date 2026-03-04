/**
 * API Route: Download Document (Presigned URL Generation)
 * GET /api/documents/download
 *
 * SECURITY REQUIREMENTS:
 * - Authentication: Required — generating a presigned URL grants access to PHI.
 *   Even though the URL is time-limited, creating it represents PHI access.
 * - RBAC: canAccessPatientData() — ADMIN, DOCTOR, NURSE can download; STAFF cannot.
 * - Audit: Each download URL generation is logged (HIPAA §164.312(b))
 * - Presigned URL expiration: 15 minutes (reduced from 1 hour original)
 *
 * WHY presigned URLs (not proxying through the server):
 * Proxying large medical files (DICOM images, high-res scans) through the Next.js server
 * would consume significant memory and bandwidth. Presigned URLs allow the browser to
 * download directly from S3 while we maintain access control on URL generation.
 *
 * WHY 15 minutes (reduced from 1 hour):
 * A 1-hour URL can be forwarded via email or messaging apps, giving the recipient
 * access without authentication. 15 minutes is enough for a legitimate user to start
 * a download while reducing the window for unauthorized URL sharing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, canAccessPatientData, type Role } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/s3-upload';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

// Presigned URL valid for 15 minutes.
// WHY reduced from the original 1 hour: shorter window limits the damage if a URL
// is leaked (forwarded, logged by a proxy, cached by a browser extension, etc.).
const PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`doc-download:${ip}`, RATE_LIMITS.DOCUMENTS.limit, RATE_LIMITS.DOCUMENTS.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!canAccessPatientData(session.user.role as Role)) {
    logAudit({
      userId: session.user.id,
      action: AuditAction.DOC_DOWNLOAD,
      entity: AuditEntity.DOCUMENT,
      ip,
      details: { denied: true, reason: 'Insufficient role', role: session.user.role },
    });
    return NextResponse.json(
      { error: 'Insufficient permissions to download documents' },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing required parameter: key' },
        { status: 400 }
      );
    }

    // Validate S3 key prefix to prevent arbitrary object access.
    // WHY: An attacker could request a presigned URL for any S3 key they know,
    // including infrastructure objects. We restrict to document and audio prefixes only.
    const allowedPrefixes = ['documents/', 'audio/'];
    if (!allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
      return NextResponse.json(
        { error: 'Invalid document key' },
        { status: 400 }
      );
    }

    const url = await getPresignedDownloadUrl(key, PRESIGNED_URL_EXPIRY_SECONDS);

    // Log the download AFTER generating the URL — at this point, access has been granted.
    logAudit({
      userId: session.user.id,
      action: AuditAction.DOC_DOWNLOAD,
      entity: AuditEntity.DOCUMENT,
      entityId: key,
      ip,
      details: {
        key,
        expiresInSeconds: PRESIGNED_URL_EXPIRY_SECONDS,
        userRole: session.user.role,
      },
    });

    return NextResponse.json({
      success: true,
      url,
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error('Error generating download URL:', error);

    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
