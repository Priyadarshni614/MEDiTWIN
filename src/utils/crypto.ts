/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cryptographic security utilities for MediTwin AI.
 * Uses Web Crypto API to ensure passwords are NEVER stored in plaintext.
 */

// Generate a random cryptographically secure hex salt
export function generateSalt(byteLength = 16): string {
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Compute SHA-256 hash of password combined with salt
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify entered password against stored salt and hash
export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const calculatedHash = await hashPassword(password, salt);
  return calculatedHash === storedHash;
}
