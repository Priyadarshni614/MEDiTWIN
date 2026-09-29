/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, StoredUserCredential, User } from '../models/types';
import { AuthSession, IAuthService, LoginParams, SignUpParams } from './authInterface';
import { generateSalt, hashPassword, verifyPassword } from '../utils/crypto';
import { dataService } from './localStorageDataService';

export class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authentication Service adhering to IAuthService.
 * Uses Web Crypto SHA-256 with unique cryptographic salt per user.
 * ZERO plaintext password storage.
 * Easily interchangeable with Firebase Auth.
 */
export class LocalAuthService implements IAuthService {
  private static readonly CREDENTIALS_KEY = 'meditwin_auth_credentials';
  private static readonly SESSION_KEY = 'meditwin_auth_session';

  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Listen for storage events across tabs if necessary
    window.addEventListener('storage', (e) => {
      if (e.key === LocalAuthService.SESSION_KEY) {
        this.notifyAuthStateChange();
      }
    });
  }

  // Retrieve all stored credentials
  private getStoredCredentials(): Record<string, StoredUserCredential> {
    const raw = localStorage.getItem(LocalAuthService.CREDENTIALS_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  // Save stored credentials
  private saveStoredCredentials(creds: Record<string, StoredUserCredential>): void {
    localStorage.setItem(LocalAuthService.CREDENTIALS_KEY, JSON.stringify(creds));
  }

  // Get current active session
  async getCurrentSession(): Promise<AuthSession | null> {
    const raw = localStorage.getItem(LocalAuthService.SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as AuthSession;
      // Check expiration (e.g. 7 days)
      if (new Date(session.expiresAt) < new Date()) {
        await this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getCurrentSession();
    return session ? session.user : null;
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength: minimum 8 characters, at least 1 letter and 1 number
  private validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number.' };
    }
    return { valid: true };
  }

  async signUp(params: SignUpParams): Promise<AuthUser> {
    const { name, email, password, confirmPassword, role } = params;

    // 1. Required fields
    if (!name?.trim()) {
      throw new AuthenticationError('Full Name is required.', 'auth/missing-name');
    }
    if (!email?.trim()) {
      throw new AuthenticationError('Email address is required.', 'auth/missing-email');
    }
    if (!password) {
      throw new AuthenticationError('Password is required.', 'auth/missing-password');
    }
    if (!role || (role !== 'PATIENT' && role !== 'DOCTOR')) {
      throw new AuthenticationError('Please select a valid role (Patient or Doctor).', 'auth/invalid-role');
    }

    // 2. Email format validation
    const normalizedEmail = email.trim().toLowerCase();
    if (!this.isValidEmail(normalizedEmail)) {
      throw new AuthenticationError('Please enter a valid email address.', 'auth/invalid-email');
    }

    // 3. Password match validation
    if (password !== confirmPassword) {
      throw new AuthenticationError('Passwords do not match.', 'auth/password-mismatch');
    }

    // 4. Password strength validation
    const strengthCheck = this.validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      throw new AuthenticationError(strengthCheck.message || 'Password does not meet requirements.', 'auth/weak-password');
    }

    // 5. Duplicate account check
    const credentials = this.getStoredCredentials();
    const existing = Object.values(credentials).find(
      (c) => c.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      throw new AuthenticationError(
        'An account with this email address already exists. Please login instead.',
        'auth/email-already-in-use'
      );
    }

    // 6. Cryptographic Salt & Hash (Web Crypto API)
    const salt = generateSalt(16);
    const passwordHash = await hashPassword(password, salt);

    // 7. Generate User ID
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const storedUserCredential: StoredUserCredential = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role,
      passwordHash,
      salt,
      createdAt: now,
    };

    // Save credential record securely
    credentials[userId] = storedUserCredential;
    this.saveStoredCredentials(credentials);

    // Also persist User document in data service
    const userDoc: User = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role,
      createdAt: now,
    };
    await dataService.saveUser(userDoc);

    const authUser: AuthUser = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role,
    };

    // 8. Establish Authenticated Session
    const sessionToken = 'tok_' + generateSalt(24);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const session: AuthSession = {
      token: sessionToken,
      user: authUser,
      createdAt: now,
      expiresAt,
    };

    localStorage.setItem(LocalAuthService.SESSION_KEY, JSON.stringify(session));
    this.notifyAuthStateChange();

    return authUser;
  }

  async login(params: LoginParams): Promise<AuthUser> {
    const { email, password } = params;

    if (!email?.trim()) {
      throw new AuthenticationError('Please enter your email address.', 'auth/missing-email');
    }
    if (!password) {
      throw new AuthenticationError('Please enter your password.', 'auth/missing-password');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const credentials = this.getStoredCredentials();

    // Find account by email
    const cred = Object.values(credentials).find(
      (c) => c.email.toLowerCase() === normalizedEmail
    );

    if (!cred) {
      throw new AuthenticationError('No account found with this email address. Please check your email or sign up.', 'auth/user-not-found');
    }

    // Verify cryptographic password hash
    const isValid = await verifyPassword(password, cred.salt, cred.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid password. Please verify your credentials and try again.', 'auth/wrong-password');
    }

    const authUser: AuthUser = {
      id: cred.id,
      name: cred.name,
      email: cred.email,
      role: cred.role,
    };

    // Establish persistent authenticated session
    const sessionToken = 'tok_' + generateSalt(24);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const session: AuthSession = {
      token: sessionToken,
      user: authUser,
      createdAt: now,
      expiresAt,
    };

    localStorage.setItem(LocalAuthService.SESSION_KEY, JSON.stringify(session));
    this.notifyAuthStateChange();

    return authUser;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(LocalAuthService.SESSION_KEY);
    this.notifyAuthStateChange();
  }

  async deleteAccount(userId: string): Promise<void> {
    if (!userId) return;
    const credentials = this.getStoredCredentials();
    const cred = credentials[userId];
    const role = cred?.role || 'PATIENT';

    // Remove credential record
    delete credentials[userId];
    this.saveStoredCredentials(credentials);

    // Remove all associated user data
    await dataService.deleteUserData(userId, role);

    // Terminate session
    await this.logout();
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately invoke with current state
    this.getCurrentUser().then(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyAuthStateChange(): Promise<void> {
    const user = await this.getCurrentUser();
    this.listeners.forEach((callback) => callback(user));
  }
}

export const authService = new LocalAuthService();
