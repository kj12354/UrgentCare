/**
 * API Route: Suggest ICD-10 Codes
 * POST /api/soap/icd10
 *
 * SECURITY REQUIREMENTS:
 * - Authentication: Required — symptom descriptions and diagnoses are PHI
 * - RBAC: canAccessPatientData() — ADMIN, DOCTOR, NURSE can suggest codes;
 *   STAFF cannot (they handle billing and scheduling, not clinical coding).
 * - Audit: PHI_ACCESS (sends clinical data to Anthropic Claude API)
 * - Rate limiting: 20/hour per IP (AI endpoint cost control)
 *
 * WHY ICD-10 suggestions require auth:
 * The request payload contains patient symptoms and preliminary diagnoses — both PHI.
 * Additionally, each call to Claude API incurs a cost that must be controlled.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, canAccessPatientData, type Role } from '@/lib/auth';
import { suggestICD10Codes } from '@/lib/claude';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`icd10:${ip}`, RATE_LIMITS.AI.limit, RATE_LIMITS.AI.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before trying again.', retryAfter: limit.retryAfter },
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
      entity: AuditEntity.ENCOUNTER,
      ip,
      details: { denied: true, reason: 'Insufficient role for ICD-10', role: session.user.role },
    });
    return NextResponse.json(
      { error: 'Insufficient permissions for ICD-10 code suggestions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { symptoms, diagnosis, encounterId, patientId } = body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: symptoms (must be a non-empty array)' },
        { status: 400 }
      );
    }

    const codes = await suggestICD10Codes(symptoms, diagnosis);

    logAudit({
      userId: session.user.id,
      action: AuditAction.PHI_ACCESS,
      entity: AuditEntity.ENCOUNTER,
      entityId: encounterId || undefined,
      ip,
      details: {
        operation: 'icd10_suggest',
        patientId: patientId || null,
        encounterId: encounterId || null,
        symptomsCount: symptoms.length,
        suggestedCodesCount: codes.length,
        userRole: session.user.role,
      },
    });

    return NextResponse.json({
      success: true,
      codes,
      metadata: {
        symptomsCount: symptoms.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in ICD-10 suggestion API:', error);

    return NextResponse.json(
      { error: 'Failed to suggest ICD-10 codes' },
      { status: 500 }
    );
  }
}
