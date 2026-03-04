/**
 * API Route: Transcribe Audio
 * POST /api/transcribe
 *
 * SECURITY REQUIREMENTS:
 * - Authentication: Required — audio recordings contain spoken PHI
 * - RBAC: canAccessPatientData() — ADMIN, DOCTOR, NURSE only
 * - Audit: Logged as TRANSCRIBE (sends PHI to external API — important to track)
 * - Rate limiting: 20/hour (AI rate limit — each call costs money and sends PHI to OpenAI)
 *
 * IMPORTANT — THIRD-PARTY DATA PROCESSING:
 * This endpoint sends audio containing spoken PHI to OpenAI's Whisper API.
 * HIPAA requires a Business Associate Agreement (BAA) with any vendor that processes PHI.
 * Before using in production, ensure OpenAI has signed a BAA for your account.
 * OpenAI offers BAAs for healthcare organizations using their API.
 * Reference: https://openai.com/security (Business Associate Agreements section)
 *
 * DATA MINIMIZATION:
 * Only the audio file and minimal context are sent to OpenAI. Patient names, DOBs,
 * and other identifying fields are NOT included in the transcription request.
 * The patient context (chief complaint) helps accuracy but does NOT include direct identifiers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, canAccessPatientData, type Role } from '@/lib/auth';
import { transcribeAudio, transcribeMedicalAudio } from '@/lib/whisper';
import { logAudit, AuditAction, AuditEntity, getClientIp } from '@/lib/audit';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Strict rate limit for AI endpoints — each transcription costs money.
  // 20 transcriptions per hour is generous for clinical use without enabling abuse.
  const limit = rateLimit(`transcribe:${ip}`, RATE_LIMITS.AI.limit, RATE_LIMITS.AI.windowMs);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded for transcription. Please wait before submitting more audio.',
        retryAfter: limit.retryAfter,
      },
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
      action: AuditAction.TRANSCRIBE,
      entity: AuditEntity.ENCOUNTER,
      ip,
      details: { denied: true, reason: 'Insufficient role', role: session.user.role },
    });
    return NextResponse.json(
      { error: 'Insufficient permissions to transcribe audio' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const patientContext = formData.get('patientContext');
    const encounterId = formData.get('encounterId') as string | null;
    const patientId = formData.get('patientId') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Blob for the Whisper API
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    let result;
    if (patientContext) {
      const context = JSON.parse(patientContext as string);
      result = await transcribeMedicalAudio(audioBlob, context);
    } else {
      result = await transcribeAudio(audioBlob);
    }

    // Log after successful transcription — the PHI has been sent to OpenAI.
    // We log the encounter/patient IDs so auditors can see which records were
    // involved in AI processing. We do NOT log the transcript content itself
    // (that's PHI — we don't want PHI in audit logs).
    logAudit({
      userId: session.user.id,
      action: AuditAction.TRANSCRIBE,
      entity: AuditEntity.ENCOUNTER,
      entityId: encounterId || undefined,
      ip,
      details: {
        patientId: patientId || null,
        encounterId: encounterId || null,
        audioDurationSeconds: result.duration,
        language: result.language,
        userRole: session.user.role,
        // Note: transcript text not logged here (it IS PHI)
      },
    });

    return NextResponse.json({
      transcript: result.text,
      duration: result.duration,
      language: result.language,
      segments: result.segments,
    });
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
