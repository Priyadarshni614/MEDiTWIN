/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, UserRole } from '../models/types';

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  createdAt: string;
  expiresAt: string;
}

export interface IAuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  getCurrentSession(): Promise<AuthSession | null>;
  signUp(params: SignUpParams): Promise<AuthUser>;
  login(params: LoginParams): Promise<AuthUser>;
  logout(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
