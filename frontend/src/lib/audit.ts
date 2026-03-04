/**
 * HIPAA Audit Logging
 *
 * WHY AUDIT LOGGING IS REQUIRED:
 * HIPAA §164.312(b) — "Implement hardware, software, and/or procedural mechanisms
 * that record and examine activity in information systems that contain or use
 * electronic protected health information (ePHI)."
 *
 * In plain English: every access to patient data must be logged. If a patient's
 * records are improperly accessed (e.g., a celebrity's medical records viewed by
 * an unauthorized nurse), the audit log is how you detect and prove it. Without
 * audit logs, a HIPAA violation may go undetected — and when discovered, you cannot
 * demonstrate what happened or who was responsible.
 *
 * The AuditLog table already exists in the Prisma schema. This module wires it up
 * so every API route that accesses PHI writes a record.
 *
 * DESIGN DECISIONS:
 * 1. Fire-and-forget: logAudit() does NOT await the database write from the caller's
 *    perspective. Audit logging should never block or fail a user request. If the
 *    audit write fails (e.g., DB outage), we log the error to stderr but let the
 *    request succeed. This is the standard HIPAA approach — imperfect logs are
 *    better than blocking medical care.
 *
 * 2. No PHI in audit logs: We log entity IDs (patient IDs, encounter IDs) but NOT
 *    the actual PHI content (names, diagnoses, transcripts). This way, the audit log
 *    itself doesn't become another PHI store requiring encryption. An auditor can
 *    correlate the ID to the patient record when needed.
 *
 * 3. IP address capture: We capture the requester's IP for forensics. WHY: If an
 *    account is compromised, the audit log's IP history helps identify the breach
 *    source (e.g., requests from an unusual country).
 */

import { prisma } from './prisma';

/**
 * Standardized action types for audit log entries.
 * Using an enum (rather than free-text strings) ensures consistent, queryable logs.
 *
 * WHY consistent action names: HIPAA auditors and automated tools need to filter
 * logs by action type (e.g., "show me all PHI deletions in the past 30 days").
 * Free-text strings make this impossible to query reliably.
 */
export const AuditAction = {
  // PHI read access
  PHI_ACCESS: 'PHI_ACCESS',

  // PHI created or modified
  PHI_MODIFY: 'PHI_MODIFY',

  // PHI deleted (irreversible)
  PHI_DELETE: 'PHI_DELETE',

  // Document operations
  DOC_UPLOAD: 'DOC_UPLOAD',
  DOC_DOWNLOAD: 'DOC_DOWNLOAD',
  DOC_DELETE: 'DOC_DELETE',

  // AI-assisted operations (these transmit PHI to third-party APIs)
  TRANSCRIBE: 'TRANSCRIBE',
  SOAP_GENERATE: 'SOAP_GENERATE',

  // Authentication events
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',

  // WebAuthn biometric events
  PASSKEY_REGISTER: 'PASSKEY_REGISTER',
  PASSKEY_LOGIN: 'PASSKEY_LOGIN',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

/**
 * Entity types that can appear in audit logs.
 * Pairs with the entityId to form a unique reference to the affected record.
 */
export const AuditEntity = {
  PATIENT: 'Patient',
  ENCOUNTER: 'Encounter',
  DOCUMENT: 'Document',
  USER: 'User',
  SESSION: 'Session',
} as const;

export type AuditEntityType = typeof AuditEntity[keyof typeof AuditEntity];

interface AuditLogParams {
  userId?: string | null;         // Who performed the action (null for unauthenticated)
  action: AuditActionType;        // What was done
  entity: AuditEntityType;        // What type of record was affected
  entityId?: string | null;       // Which specific record (patient ID, document key, etc.)
  ip?: string | null;             // Requester IP address
  details?: Record<string, unknown> | null; // Optional structured metadata (no PHI)
}

/**
 * Writes an audit log entry to the database.
 *
 * This function is designed to be called WITHOUT await from API routes.
 * It handles its own errors internally and never throws.
 *
 * Usage:
 * ```ts
 * // In an API route — do NOT await; let it run in background
 * logAudit({
 *   userId: session.user.id,
 *   action: AuditAction.DOC_DOWNLOAD,
 *   entity: AuditEntity.DOCUMENT,
 *   entityId: documentKey,
 *   ip: request.headers.get('x-forwarded-for'),
 *   details: { patientId, fileType: 'pdf' }
 * });
 * ```
 */
export function logAudit(params: AuditLogParams): void {
  // Intentionally not awaited — fire and forget.
  // We use .catch() to silently handle failures rather than crashing the request.
  prisma.auditLog
    .create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        ip: params.ip ?? null,
        // Serialize details as JSON string since AuditLog.details is a String? field.
        // WHY JSON string vs separate columns: flexibility — we can add new detail fields
        // without a schema migration. The audit log is append-only so query patterns
        // are predictable (audit reports scan by userId, action, entity).
        details: params.details ? JSON.stringify(params.details) : null,
      },
    })
    .catch((error) => {
      // Log the failure to stderr — this appears in server logs and monitoring tools
      // (CloudWatch, Datadog, etc.) without bubbling up to the user.
      // WHY NOT throw: Failing to write an audit log should never block medical care.
      console.error('[AUDIT] Failed to write audit log:', {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

/**
 * Extracts the client IP address from a Next.js request.
 *
 * WHY x-forwarded-for: When running behind a reverse proxy (Vercel, nginx, AWS ALB),
 * the actual client IP is in the X-Forwarded-For header, not the socket address.
 * We take the FIRST IP in the list — proxies append IPs left-to-right, so the
 * leftmost is the original client. An attacker can spoof this header, but it's still
 * useful for identifying legitimate users' locations.
 *
 * For production, configure your reverse proxy to strip client-supplied
 * X-Forwarded-For headers and set its own trusted value.
 */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
