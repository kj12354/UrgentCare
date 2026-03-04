/**
 * API Route: Generate SOAP Note
 * POST /api/soap/generate
 *
 * SECURITY REQUIREMENTS:
 * - Authentication: Required — SOAP notes are detailed medical PHI
 * - RBAC: canModifyEncounters() — only DOCTOR and ADMIN can generate/modify SOAP notes.
 *   WHY stricter: SOAP notes become part of the permanent medical record. Only licensed
 *   clinicians (doctors) should be generating structured medical documentation.
 *   Nurses may transcribe but shouldn't create the final clinical note autonomously.
 * - Audit: Logged as SOAP_GENERATE (sends PHI to Anthropic Claude API)
 * - Rate limiting: 20/hour (AI rate limit — Claude API has per-request cost)
 *
 * IMPORTANT — THIRD-PARTY DATA PROCESSING:
 * This endpoint sends patient transcript and context to Anthropic's Claude API.
 * HIPAA requires a BAA with any vendor processing PHI. Ensure Anthropic has signed
 * a BAA for your organization before production use.
 *
 * DATA MINIMIZATION:
 * Only clinical context (age, gender, chief complaint, allergies) is sent — not
 * patient name, DOB, SSN, or contact information. This limits PHI exposure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, canModifyEncounters, type Role } from '@/lib/auth';
import { generateSOAPNote } from '@/lib/claude';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`soap-generate:${ip}`, RATE_LIMITS.AI.limit, RATE_LIMITS.AI.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded for SOAP note generation. Please wait before trying again.',
        retryAfter: limit.retryAfter,
      },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // SOAP note generation is restricted to DOCTOR and ADMIN only.
  // WHY: A SOAP note is a structured clinical document that becomes part of the
  // medical record. Generating one via AI requires clinical judgment to review
  // and sign off — that responsibility belongs to licensed providers.
  if (!canModifyEncounters(session.user.role as Role)) {
    logAudit({
      userId: session.user.id,
      action: AuditAction.SOAP_GENERATE,
      entity: AuditEntity.ENCOUNTER,
      ip,
      details: { denied: true, reason: 'Insufficient role', role: session.user.role },
    });
    return NextResponse.json(
      { error: 'Only doctors and administrators can generate SOAP notes' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { transcript, chiefComplaint, patientContext, encounterId, patientId } = body;

    if (!transcript || !chiefComplaint) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript and chiefComplaint' },
        { status: 400 }
      );
    }

    if (transcript.length < 10) {
      return NextResponse.json(
        { error: 'Transcript is too short to generate a meaningful SOAP note' },
        { status: 400 }
      );
    }

    // Generate SOAP note using Claude (PHI is sent to Anthropic at this point)
    const soapNote = await generateSOAPNote(transcript, chiefComplaint, patientContext);

    // Audit log after generation — we record that PHI was processed by external AI.
    // The encounterId lets auditors trace which clinical record the note belongs to.
    logAudit({
      userId: session.user.id,
      action: AuditAction.SOAP_GENERATE,
      entity: AuditEntity.ENCOUNTER,
      entityId: encounterId || undefined,
      ip,
      details: {
        patientId: patientId || null,
        encounterId: encounterId || null,
        transcriptLength: transcript.length,
        userRole: session.user.role,
        // Note: transcript and soapNote content NOT logged here (they are PHI)
      },
    });

    return NextResponse.json({
      success: true,
      soapNote,
      metadata: {
        transcriptLength: transcript.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in SOAP generation API:', error);

    return NextResponse.json(
      { error: 'Failed to generate SOAP note' },
      { status: 500 }
    );
  }
}
