/**
 * HIPAA-Compliant Field-Level Encryption
 *
 * WHY THIS EXISTS:
 * HIPAA §164.312(a)(2)(iv) requires PHI to be encrypted "at rest." While S3 documents
 * already use AES-256 server-side encryption, database fields (transcript, soapNote,
 * patient phone numbers, etc.) are stored in plaintext by default. If the database
 * is ever compromised — via SQL injection, stolen backup, or cloud provider breach —
 * unencrypted PHI is immediately readable. This module ensures that even if an attacker
 * obtains the raw database, PHI fields are meaningless without the application-layer key.
 *
 * ALGORITHM: AES-256-GCM
 * WHY AES-256-GCM over AES-256-CBC:
 * GCM is an "authenticated encryption" mode. It provides BOTH:
 *   1. Confidentiality (no one can read the data without the key)
 *   2. Integrity (any tampering with the ciphertext is detected and rejected)
 * CBC only provides confidentiality — a tampered ciphertext decrypts to garbage silently.
 * AES-256-GCM is NIST-approved (SP 800-38D) and used in TLS 1.3.
 *
 * KEY MANAGEMENT:
 * The encryption key is loaded from ENCRYPTION_KEY environment variable.
 * This must be a 64-character hex string (= 32 bytes = 256 bits).
 * Generate a new key: `openssl rand -hex 32`
 *
 * KEY ROTATION STRATEGY:
 * When rotating keys, add a key version prefix to ciphertext (e.g., "v1.<iv>.<ct>.<tag>").
 * Decrypt with old key, re-encrypt with new key in a migration job. This module uses
 * a simplified approach (no versioning) — add versioning before production if needed.
 *
 * STORAGE FORMAT: `<iv_hex>.<ciphertext_hex>.<authTag_hex>`
 * Each component is hex-encoded and separated by dots.
 * - IV (Initialization Vector): 12 bytes, randomly generated per encryption.
 *   WHY random IV: if the same IV+key pair encrypts the same plaintext twice,
 *   the ciphertexts would be identical, leaking information (pattern analysis).
 *   A fresh random IV ensures each encryption is unique.
 * - Auth Tag: 16 bytes, produced by GCM to detect tampering.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// AES-256-GCM requires a 256-bit (32-byte) key.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;       // 96-bit IV is the GCM standard — do NOT use 16 bytes
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Returns the raw encryption key as a Buffer.
 * Validates that the ENCRYPTION_KEY env var is correctly set.
 *
 * WHY validate at call time (not module load): In Next.js, module-level code runs
 * during build. We want env var errors to surface at runtime so the build doesn't fail
 * in CI environments that don't have the production key.
 */
function getKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    // In development without a key, use a deterministic test key.
    // This is ONLY acceptable for local development — never production.
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[SECURITY] ENCRYPTION_KEY not set. Using insecure dev key. ' +
        'Set ENCRYPTION_KEY=<openssl rand -hex 32> for production.'
      );
      return Buffer.from('0'.repeat(64), 'hex'); // 32 zero bytes — dev only
    }
    throw new Error(
      '[SECURITY] ENCRYPTION_KEY environment variable is required for PHI encryption. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  if (hexKey.length !== 64) {
    throw new Error(
      `[SECURITY] ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Got ${hexKey.length} characters.`
    );
  }
  return Buffer.from(hexKey, 'hex');
}

/**
 * Encrypts a PHI field value using AES-256-GCM.
 *
 * @param plaintext - The plaintext PHI string to encrypt (e.g., patient phone number)
 * @returns Encrypted string in format: `<iv_hex>.<ciphertext_hex>.<authTag_hex>`
 *
 * WHY we return a string (not bytes): Prisma String fields store text.
 * Hex-encoding the binary output makes it safe to store in any text column.
 */
export function encryptPHI(plaintext: string): string {
  const key = getKey();

  // Generate a cryptographically random IV for every encryption.
  // WHY: Reusing an IV with the same key is catastrophic for GCM security —
  // it allows an attacker to recover the authentication key.
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt the plaintext
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // GCM produces an authentication tag after finalization.
  // This tag verifies that neither the ciphertext nor the IV was tampered with.
  const authTag = cipher.getAuthTag();

  // Store as dot-separated hex segments for easy parsing and human readability in logs.
  return `${iv.toString('hex')}.${encrypted.toString('hex')}.${authTag.toString('hex')}`;
}

/**
 * Decrypts a PHI field value encrypted by encryptPHI().
 *
 * @param ciphertext - Encrypted string in format: `<iv_hex>.<ciphertext_hex>.<authTag_hex>`
 * @returns Decrypted plaintext string
 * @throws Error if ciphertext is malformed OR if the authentication tag is invalid
 *         (indicating tampering or wrong key)
 *
 * WHY we throw on auth tag failure: Silently returning wrong data is more dangerous
 * than throwing an error. If a medical transcript is corrupted or tampered with,
 * a clinician must NOT see wrong patient data — they must see an error.
 */
export function decryptPHI(ciphertext: string): string {
  const key = getKey();

  const parts = ciphertext.split('.');
  if (parts.length !== 3) {
    throw new Error(
      '[SECURITY] Invalid encrypted PHI format. Expected <iv>.<ciphertext>.<authTag>. ' +
      'The field may be unencrypted plaintext from before encryption was enabled.'
    );
  }

  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Set the expected authentication tag BEFORE decrypting.
  // WHY: GCM verifies the tag during final() — if the tag doesn't match
  // (wrong key, tampered data, or IV reuse), final() throws an error.
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(), // Throws if auth tag verification fails
    ]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error(
      '[SECURITY] PHI decryption failed: authentication tag mismatch. ' +
      'The data may have been tampered with, or the wrong encryption key is configured.'
    );
  }
}

/**
 * Checks whether a string looks like it was encrypted by encryptPHI().
 * Useful for gracefully handling fields that were stored before encryption was enabled.
 *
 * @param value - String to check
 * @returns true if the string appears to be encrypted ciphertext
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  // Check that all three parts are valid hex strings of reasonable length
  return parts.every((p) => /^[0-9a-f]+$/i.test(p) && p.length >= 24);
}

/**
 * Safe decrypt: returns the original value if it's not encrypted (legacy data),
 * or decrypts it if it is. This allows a gradual migration where old plaintext
 * records are read as-is until they're re-saved with encryption.
 */
export function safeDecryptPHI(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!isEncrypted(value)) return value; // Legacy plaintext — return as-is
  return decryptPHI(value);
}
