'use client';

/**
 * BiometricAuth Component
 *
 * Provides UI for WebAuthn passkey registration and authentication.
 *
 * WHY THIS COMPONENT EXISTS:
 * Password-based authentication is vulnerable to phishing, credential stuffing,
 * and database breaches. WebAuthn (FIDO2) passkeys eliminate these risks:
 *   - Phishing-resistant: credentials are cryptographically bound to our domain
 *   - No password to steal: only a public key is stored server-side
 *   - Biometric convenience: Touch ID / Face ID is faster than typing a password
 *   - NIST SP 800-63B AAL2/AAL3 compliant authentication
 *
 * USAGE:
 * 1. On the login page: renders a "Sign in with biometrics" button
 * 2. On the settings page (when logged in): renders "Register a passkey" button
 *
 * BROWSER SUPPORT:
 * WebAuthn is supported in all modern browsers (Chrome 67+, Firefox 60+, Safari 14+,
 * Edge 18+). On unsupported browsers, the component renders null and falls back to
 * password authentication. We check for browser support before showing the UI.
 *
 * DEVICE SUPPORT:
 * - macOS: Touch ID (if available), iCloud Keychain synced passkeys
 * - iOS/iPadOS: Face ID, Touch ID, iCloud Keychain
 * - Android: Fingerprint, face unlock, Google Password Manager
 * - Windows: Windows Hello (fingerprint, face, PIN), FIDO2 security keys
 * - All platforms: USB/NFC/BLE security keys (YubiKey, etc.)
 */

import { useState, useEffect } from 'react';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface BiometricAuthProps {
  /** Mode: 'register' = enroll a new passkey (requires active session)
   *        'login' = authenticate with an existing passkey */
  mode: 'register' | 'login';
  /** Called on successful authentication (login mode only) with user info */
  onSuccess?: (user: { userId: string; email: string; name: string | null; role: string }) => void;
  /** Called on successful passkey registration */
  onRegistered?: () => void;
  /** Optional: pre-fill email for targeted authentication (login mode) */
  email?: string;
  /** CSS class for the container div */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BiometricAuth({
  mode,
  onSuccess,
  onRegistered,
  email,
  className = '',
}: BiometricAuthProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check browser support on mount.
  // WHY check at runtime: server-side rendering doesn't have access to browser APIs.
  // navigator.credentials is undefined on the server — we must check client-side.
  useEffect(() => {
    setIsSupported(browserSupportsWebAuthn());
  }, []);

  // Don't render anything on unsupported browsers — fall back silently to passwords.
  if (!isSupported) return null;

  // ─── Registration Flow ──────────────────────────────────────────────────────

  async function handleRegister() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Get registration options (challenge) from our server.
      // The server knows who we are from the session cookie.
      const challengeRes = await fetch('/api/auth/webauthn/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!challengeRes.ok) {
        const data = await challengeRes.json();
        throw new Error(data.error ?? 'Failed to start passkey registration');
      }

      const { options }: { options: PublicKeyCredentialCreationOptionsJSON } =
        await challengeRes.json();

      // Step 2: Invoke the browser's WebAuthn API.
      // This shows the OS biometric prompt (Touch ID, Face ID, Windows Hello, etc.).
      // The browser generates a new key pair in the secure enclave and returns the
      // public key + attestation. The PRIVATE KEY NEVER LEAVES THE DEVICE.
      // v9 API: startRegistration takes the options object directly (not wrapped in {optionsJSON})
      const registrationResponse = await startRegistration(options);

      // Step 3: Send the browser's response to our server for verification and storage.
      const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error ?? 'Failed to complete passkey registration');
      }

      setSuccess('Passkey registered! You can now use biometrics to sign in.');
      onRegistered?.();
    } catch (err) {
      if (err instanceof Error) {
        // Handle user cancellation gracefully — not an error the user needs to see
        if (err.name === 'NotAllowedError') {
          setError('Biometric verification was cancelled. Please try again.');
        } else if (err.name === 'InvalidStateError') {
          setError('This device already has a passkey registered for your account.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Authentication Flow ────────────────────────────────────────────────────

  async function handleLogin() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Request an authentication challenge from the server.
      // Optionally provide email for targeted authentication (faster UX).
      const challengeRes = await fetch('/api/auth/webauthn/auth-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!challengeRes.ok) {
        const data = await challengeRes.json();
        throw new Error(data.error ?? 'Failed to start biometric login');
      }

      const { options }: { options: PublicKeyCredentialRequestOptionsJSON } =
        await challengeRes.json();

      // Step 2: Invoke the browser's WebAuthn authentication API.
      // If we provided allowCredentials (from the email lookup), the browser will
      // show only the relevant passkeys. Otherwise, it shows a discoverable credential
      // picker with all registered passkeys for this domain.
      // v9 API: startAuthentication takes the options object directly
      const authResponse = await startAuthentication(options);

      // Step 3: Send the signed response to our server for verification.
      const verifyRes = await fetch('/api/auth/webauthn/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error ?? 'Biometric authentication failed');
      }

      const userData = await verifyRes.json();
      setSuccess('Authentication successful!');
      onSuccess?.(userData);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Biometric verification was cancelled. Please try again.');
        } else if (err.name === 'SecurityError') {
          setError(
            'Security error during authentication. Ensure you are on the correct website.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const handleClick = mode === 'register' ? handleRegister : handleLogin;
  const buttonLabel = mode === 'register'
    ? (isLoading ? 'Setting up passkey...' : 'Register a Passkey')
    : (isLoading ? 'Verifying biometrics...' : 'Sign in with Biometrics');

  // Biometric icon — fingerprint SVG (works for Touch ID, Face ID, fingerprint)
  const BiometricIcon = () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Fingerprint icon */}
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 17c1 .5 2.5.85 4 1" />
      <path d="M22 12a10 10 0 0 1-.22 2" />
      <path d="M6 10a6 6 0 0 1 4.33-5.78" />
      <path d="M10.71 5.05A6 6 0 0 1 18 10" />
    </svg>
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={buttonLabel}
      >
        <BiometricIcon />
        <span>{buttonLabel}</span>
      </button>

      {/* Error message — shown when authentication or registration fails */}
      {error && (
        <div
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2"
          role="status"
        >
          {success}
        </div>
      )}

      {mode === 'register' && !error && !success && (
        <p className="text-xs text-gray-500 text-center">
          Works with Touch ID, Face ID, Windows Hello, and security keys.
        </p>
      )}
    </div>
  );
}

export default BiometricAuth;
