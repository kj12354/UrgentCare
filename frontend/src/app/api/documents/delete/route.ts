/**
 * API Route: Delete Document
 * DELETE /api/documents/delete
 *
 * SECURITY REQUIREMENTS:
 * - Authentication: Required (no anonymous deletions)
 * - RBAC: canModifyEncounters() — only ADMIN and DOCTOR can delete documents.
 *   WHY stricter than upload: Deletion is IRREVERSIBLE. Nurses can upload documents
 *   (clinical necessity) but should not be able to permanently destroy records.
 *   Permanent deletion of medical records may also violate record retention laws.
 * - Audit: Logged with full details (HIPAA requires audit trail for PHI deletion)
 * - Rate limiting: 30/min per IP
 *
 * HIPAA NOTE on record deletion:
 * HIPAA does not generally grant patients the right to have their records destroyed
 * (unlike GDPR). Medical records must be retained for at least 6 years (45 CFR §164.530(j)).
 * In production, consider implementing soft-delete (mark as deleted, retain S3 object)
 * rather than hard delete to maintain compliance with retention requirements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, canModifyEncounters, type Role } from '@/lib/auth';
import { deleteFileFromS3 } from '@/lib/s3-upload';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`doc-delete:${ip}`, RATE_LIMITS.DOCUMENTS.limit, RATE_LIMITS.DOCUMENTS.windowMs);
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

  // Stricter RBAC for deletion: only ADMIN and DOCTOR.
  // WHY: Deletion of PHI is a high-risk, irreversible operation. Limiting it to the
  // two most privileged roles reduces the blast radius of a compromised account.
  if (!canModifyEncounters(session.user.role as Role)) {
    logAudit({
      userId: session.user.id,
      action: AuditAction.DOC_DELETE,
      entity: AuditEntity.DOCUMENT,
      ip,
      details: { denied: true, reason: 'Insufficient role for deletion', role: session.user.role },
    });
    return NextResponse.json(
      { error: 'Only administrators and doctors can delete documents' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Missing required field: key' },
        { status: 400 }
      );
    }

    // Validate the S3 key format to prevent path traversal or arbitrary bucket access.
    // WHY: Without this check, a malicious key like "../other-bucket/file" or
    // "../../config" could potentially be used for SSRF or path traversal attacks
    // depending on the S3 client implementation. We enforce that keys start with
    // known prefixes only.
    const allowedPrefixes = ['documents/', 'audio/'];
    const isValidKey = allowedPrefixes.some((prefix) => key.startsWith(prefix));
    if (!isValidKey) {
      logAudit({
        userId: session.user.id,
        action: AuditAction.DOC_DELETE,
        entity: AuditEntity.DOCUMENT,
        ip,
        details: { denied: true, reason: 'Invalid S3 key prefix', key },
      });
      return NextResponse.json(
        { error: 'Invalid document key' },
        { status: 400 }
      );
    }

    await deleteFileFromS3(key);

    // Log AFTER successful deletion — we record what was actually destroyed.
    logAudit({
      userId: session.user.id,
      action: AuditAction.DOC_DELETE,
      entity: AuditEntity.DOCUMENT,
      entityId: key,
      ip,
      details: { key, userRole: session.user.role },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);

    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
