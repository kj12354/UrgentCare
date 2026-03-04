/**
 * API Route: List Documents
 * GET /api/documents/list
 *
 * SECURITY REQUIREMENTS:
 * - Authentication: Required — document listing reveals that a patient has documents,
 *   which is itself PHI (the existence of a psychiatric record is PHI).
 * - RBAC: canAccessPatientData() — ADMIN, DOCTOR, NURSE can list; STAFF cannot.
 * - Audit: Every listing logged (HIPAA audit trail for PHI access)
 * - Rate limiting: 60/min (higher limit since listing is low-risk vs. download)
 *
 * WHY listing requires auth:
 * The list response includes S3 keys, timestamps, and file sizes. An attacker could
 * enumerate all patients' document counts and timestamps via the patientId parameter,
 * revealing which patients have medical records even without reading the contents.
 * This is "metadata disclosure" — still PHI under HIPAA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, canAccessPatientData, type Role } from '@/lib/auth';
import { listFiles } from '@/lib/s3-upload';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`doc-list:${ip}`, RATE_LIMITS.API.limit, RATE_LIMITS.API.windowMs);
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
      action: AuditAction.PHI_ACCESS,
      entity: AuditEntity.DOCUMENT,
      ip,
      details: { denied: true, reason: 'Insufficient role', role: session.user.role },
    });
    return NextResponse.json(
      { error: 'Insufficient permissions to access patient documents' },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const encounterId = searchParams.get('encounterId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: patientId' },
        { status: 400 }
      );
    }

    // Build S3 prefix — scoped to the specific patient (and optionally encounter).
    // WHY prefix scoping: ensures this route can only list documents belonging to
    // the requested patient, not arbitrary S3 keys.
    const prefix = encounterId
      ? `documents/${patientId}/${encounterId}/`
      : `documents/${patientId}/`;

    const files = await listFiles(prefix);

    const documents = files.map((file, index) => ({
      id: `${patientId}-${index}`,
      key: file.key,
      name: file.key.split('/').pop() || 'Unknown',
      type: getFileType(file.key),
      size: file.size,
      uploadedAt: file.lastModified,
      url: file.url,
    }));

    // Log PHI access — listing documents tells us the user viewed a patient's file list.
    logAudit({
      userId: session.user.id,
      action: AuditAction.PHI_ACCESS,
      entity: AuditEntity.PATIENT,
      entityId: patientId,
      ip,
      details: {
        operation: 'list_documents',
        encounterId: encounterId || null,
        documentCount: documents.length,
        userRole: session.user.role,
      },
    });

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error('Error listing documents:', error);

    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}

function getFileType(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();

  const typeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    mp4: 'video/mp4',
  };

  return typeMap[extension || ''] || 'application/octet-stream';
}
