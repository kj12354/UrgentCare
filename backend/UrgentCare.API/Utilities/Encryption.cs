using System.Security.Cryptography;
using System.Text;

namespace UrgentCare.API.Utilities;

/// <summary>
/// Field-Level Encryption for PHI
///
/// WHY THIS EXISTS:
/// HIPAA §164.312(a)(2)(iv) and §164.312(e)(2)(ii) require encryption of ePHI at rest
/// and in transit. While the database connection uses TLS (encryption in transit),
/// and the database server may encrypt the disk (encryption at rest at the storage layer),
/// these measures don't protect against:
///   - A compromised DBA who has database access
///   - A stolen database backup
///   - A SQL injection attack that dumps data
///
/// Field-level encryption (application-layer encryption) protects individual PHI fields
/// so that even with direct database access, sensitive values are unreadable without
/// the application's encryption key.
///
/// ALGORITHM: AES-256-GCM
/// WHY AES-256-GCM over AES-256-CBC:
///   - GCM provides "authenticated encryption" — both confidentiality AND integrity.
///   - If anyone tampers with the ciphertext (flipping bits, truncating), decryption FAILS.
///   - CBC only provides confidentiality. A tampered CBC ciphertext decrypts to garbage silently,
///     which is dangerous for medical data (wrong data is worse than no data).
///   - AES-256-GCM is used in TLS 1.3 and is NIST-approved (FIPS 140-2 compliant).
///
/// COMPATIBILITY:
/// This implementation uses the SAME format as the Next.js TypeScript implementation
/// (encryption.ts): `iv_hex.ciphertext_hex.authTag_hex`
/// WHY compatibility matters: both the frontend API routes and this backend service
/// may write PHI to the database. They must use the same key and format so either
/// side can decrypt what the other encrypted.
///
/// KEY MANAGEMENT:
/// The encryption key is loaded from the ENCRYPTION_KEY environment variable.
/// Format: 64 hex characters (= 32 bytes = 256 bits)
/// Generate: `openssl rand -hex 32`
///
/// IMPORTANT: Never commit the key to version control. Use environment variables,
/// Azure Key Vault, AWS Secrets Manager, or HashiCorp Vault for production.
/// Rotate keys annually or immediately upon suspected compromise.
/// </summary>
public static class Encryption
{
    private const int IvLength = 12;       // 96-bit IV — GCM standard (do NOT use 16 bytes)
    private const int AuthTagLength = 16;   // 128-bit authentication tag

    /// <summary>
    /// Encrypts a PHI field value using AES-256-GCM.
    ///
    /// Format: `{iv_hex}.{ciphertext_hex}.{authTag_hex}`
    /// All three components are hex-encoded and separated by dots.
    ///
    /// WHY random IV per encryption:
    /// If we reused an IV with the same key, and the same plaintext was encrypted twice,
    /// the ciphertexts would be identical — leaking that two records have the same value.
    /// A random IV ensures each encryption is unique and unpredictable.
    /// GCM with a reused IV is catastrophically broken — it allows recovery of the auth key.
    ///
    /// </summary>
    /// <param name="plaintext">The PHI value to encrypt</param>
    /// <param name="keyHex">64-character hex string (32 bytes). Defaults to ENCRYPTION_KEY env var.</param>
    /// <returns>Encrypted string in dot-separated hex format</returns>
    public static string EncryptField(string plaintext, string? keyHex = null)
    {
        var key = ParseKey(keyHex);

        // Generate a cryptographically random IV using .NET's secure RNG.
        // WHY RandomNumberGenerator (not Random): System.Random is NOT cryptographically
        // secure — its output is predictable if you know the seed. RandomNumberGenerator
        // uses OS entropy (hardware RNG on modern systems).
        var iv = new byte[IvLength];
        RandomNumberGenerator.Fill(iv);

        using var aes = new AesGcm(key, AuthTagLength);

        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plaintextBytes.Length];
        var authTag = new byte[AuthTagLength];

        // Encrypt and compute authentication tag in one operation.
        // The auth tag seals the ciphertext against tampering — if any byte of
        // the ciphertext or IV is modified, decryption will throw.
        aes.Encrypt(iv, plaintextBytes, ciphertext, authTag);

        // Return as dot-separated hex for safe storage in text columns.
        return $"{Convert.ToHexString(iv).ToLowerInvariant()}" +
               $".{Convert.ToHexString(ciphertext).ToLowerInvariant()}" +
               $".{Convert.ToHexString(authTag).ToLowerInvariant()}";
    }

    /// <summary>
    /// Decrypts a PHI field value encrypted by EncryptField().
    ///
    /// Throws if:
    /// - The format is invalid (not three dot-separated hex strings)
    /// - The authentication tag doesn't match (data tampered or wrong key)
    /// - The key is incorrect
    ///
    /// WHY we throw on failure (not return null):
    /// Silently returning null or empty string on decryption failure means a clinician
    /// sees no data where they expected data. This is safer than returning corrupted data,
    /// but still unacceptable for medical records. The caller should log the error,
    /// alert security, and return an appropriate error to the user.
    /// </summary>
    /// <param name="ciphertext">Encrypted string from EncryptField()</param>
    /// <param name="keyHex">64-character hex key. Defaults to ENCRYPTION_KEY env var.</param>
    /// <returns>Decrypted plaintext string</returns>
    public static string DecryptField(string ciphertext, string? keyHex = null)
    {
        var key = ParseKey(keyHex);

        var parts = ciphertext.Split('.');
        if (parts.Length != 3)
        {
            throw new ArgumentException(
                $"Invalid encrypted field format. Expected <iv>.<ciphertext>.<authTag>, " +
                $"got {parts.Length} part(s). The field may contain unencrypted legacy data."
            );
        }

        byte[] iv, encrypted, authTag;
        try
        {
            iv = Convert.FromHexString(parts[0]);
            encrypted = Convert.FromHexString(parts[1]);
            authTag = Convert.FromHexString(parts[2]);
        }
        catch (FormatException ex)
        {
            throw new ArgumentException("Invalid hex encoding in encrypted field.", ex);
        }

        using var aes = new AesGcm(key, AuthTagLength);
        var decrypted = new byte[encrypted.Length];

        try
        {
            // Decrypt and verify authentication tag simultaneously.
            // If the tag doesn't match, this throws CryptographicException.
            // WHY not catch and ignore: a failed tag means either:
            //   1. The data was tampered with (integrity violation)
            //   2. The wrong key is configured
            //   3. The data is corrupted
            // All three cases require human intervention, not silent failure.
            aes.Decrypt(iv, encrypted, authTag, decrypted);
        }
        catch (CryptographicException ex)
        {
            throw new CryptographicException(
                "PHI decryption failed: authentication tag verification failed. " +
                "The data may have been tampered with, or the wrong encryption key is configured. " +
                "Do not use this data — contact your security team.",
                ex
            );
        }

        return Encoding.UTF8.GetString(decrypted);
    }

    /// <summary>
    /// Checks if a string looks like it was encrypted by EncryptField().
    /// Used for graceful migration: fields stored before encryption was enabled
    /// can be detected and treated as plaintext.
    /// </summary>
    public static bool IsEncrypted(string? value)
    {
        if (string.IsNullOrEmpty(value)) return false;
        var parts = value.Split('.');
        if (parts.Length != 3) return false;
        // All parts should be non-empty hex strings of reasonable length
        return parts.All(p => p.Length >= 24 && IsHexString(p));
    }

    /// <summary>
    /// Safely decrypt a field that may be plaintext (legacy data) or encrypted.
    /// Returns the original value unchanged if it doesn't look encrypted.
    /// </summary>
    public static string? SafeDecryptField(string? value, string? keyHex = null)
    {
        if (string.IsNullOrEmpty(value)) return null;
        return IsEncrypted(value) ? DecryptField(value, keyHex) : value;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static byte[] ParseKey(string? keyHex)
    {
        keyHex ??= Environment.GetEnvironmentVariable("ENCRYPTION_KEY");

        if (string.IsNullOrEmpty(keyHex))
        {
            // In development without a key, use a fixed test key.
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                return new byte[32]; // 32 zero bytes — dev only, insecure
            }
            throw new InvalidOperationException(
                "ENCRYPTION_KEY environment variable is required for PHI encryption. " +
                "Generate one with: openssl rand -hex 32"
            );
        }

        if (keyHex.Length != 64)
        {
            throw new ArgumentException(
                $"ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Got {keyHex.Length}."
            );
        }

        try
        {
            return Convert.FromHexString(keyHex);
        }
        catch (FormatException ex)
        {
            throw new ArgumentException("ENCRYPTION_KEY is not valid hex.", ex);
        }
    }

    private static bool IsHexString(string s) =>
        s.All(c => (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'));
}
