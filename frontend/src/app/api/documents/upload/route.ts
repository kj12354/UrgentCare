/**
 * API Route: Upload Document
 * POST /api/documents/upload
 *
 * SECURITY REQUIREMENTS:
 * - Authentication: Any authenticated user with patient data access (ADMIN, DOCTOR, NURSE)
 * - RBAC: canAccessPatientData() — STAFF cannot upload PHI documents
 * - Audit: Every upload logged to AuditLog (HIPAA §164.312(b))
 * - Rate limiting: 30 uploads/min per IP to prevent storage abuse and API billing attacks
 * - File size: 10MB max (prevents DoS via large payload)
 *
 * WHY authentication on upload:
 * Without auth, any internet user could upload documents to any patientId, polluting
 * patient records or triggering large S3 storage bills. Worse, the uploaded file appears
 * in a patient's record and a clinician might act on malicious content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, canAccessPatientData, type Role } from '@/lib/auth';
import { uploadDocument, DocumentMetadata } from '@/lib/s3-upload';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Rate limit check: 30 document uploads per minute per IP.
  // WHY: S3 storage has costs and upload processing is computationally expensive.
  // Without this, a compromised account could flood storage with gigabytes of data.
  const limit = rateLimit(`doc-upload:${ip}`, RATE_LIMITS.DOCUMENTS.limit, RATE_LIMITS.DOCUMENTS.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  // Authentication check: verify a valid NextAuth session exists.
  // WHY getServerSession (not getToken from middleware): API routes run on Node.js,
  // not the Edge. getServerSession() validates the session against the database,
  // providing stronger guarantees than JWT-only validation.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    // Do NOT log this to AuditLog — unauthenticated requests have no userId to track.
    // They WILL appear in server access logs and the rate limiter.
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // RBAC check: STAFF role cannot upload documents (principle of least privilege).
  // WHY this split: Front desk STAFF handle scheduling and billing, not clinical records.
  // Only ADMIN, DOCTOR, NURSE roles have a clinical need to upload patient documents.
  if (!canAccessPatientData(session.user.role as Role)) {
    logAudit({
      userId: session.user.id,
      action: AuditAction.DOC_UPLOAD,
      entity: AuditEntity.DOCUMENT,
      ip,
      details: { denied: true, reason: 'Insufficient role', role: session.user.role },
    });
    return NextResponse.json(
      { error: 'Insufficient permissions to upload documents' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const encounterId = formData.get('encounterId') as string | null;
    const documentType = formData.get('documentType') as string;
    const description = formData.get('description') as string | null;

    // Validate required fields
    if (!file || !patientId) {
      return NextResponse.json(
        { error: 'Missing required fields: file and patientId' },
        { status: 400 }
      );
    }

    // File size validation: 10MB maximum.
    // WHY: Large files can exhaust server memory (multipart parsing holds the whole
    // file in memory) and create large S3 storage costs. 10MB covers all common
    // medical document types (PDFs, images, lab reports).
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Prepare metadata — use the authenticated user's ID, not a client-supplied value.
    // WHY override uploadedBy from session: clients should not self-report who they are.
    // The server knows the authenticated user from the session.
    const metadata: DocumentMetadata = {
      patientId,
      encounterId: encounterId || undefined,
      documentType: documentType || 'general',
      description: description || undefined,
      uploadedBy: session.user.id, // Authoritative — from server session
    };

    // Upload to S3 (encryption is applied in s3-upload.ts: ServerSideEncryption: "AES256")
    const result = await uploadDocument(file, metadata);

    // Write audit log AFTER successful upload.
    // WHY log after (not before): We want to log that PHI was actually stored,
    // not just that an attempt was made. Failed uploads don't create PHI.
    logAudit({
      userId: session.user.id,
      action: AuditAction.DOC_UPLOAD,
      entity: AuditEntity.DOCUMENT,
      entityId: result.key,
      ip,
      details: {
        patientId,
        encounterId: encounterId || null,
        documentType: documentType || 'general',
        fileSize: file.size,
        mimeType: file.type,
        userRole: session.user.role,
      },
    });

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.url,
      bucket: result.bucket,
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error uploading document:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload document',
        // WHY not expose error details: Internal error messages can reveal infrastructure
        // details (S3 bucket names, IAM errors, DB connection strings) useful to attackers.
      },
      { status: 500 }
    );
  }
}
