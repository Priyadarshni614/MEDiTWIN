/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthUser, PatientProfile, DoctorProfile } from '../models/types';
import { authService } from '../services/authService';
import { dataService, generatePatientConnectionCode } from '../services/localStorageDataService';
import { LoginParams, SignUpParams } from '../services/authInterface';

export interface AuthContextType {
  user: AuthUser | null;
  patientProfile: PatientProfile | null;
  doctorProfile: DoctorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  login: (params: LoginParams) => Promise<AuthUser>;
  signUp: (params: SignUpParams) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  savePatientProfile: (data: Omit<PatientProfile, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveDoctorProfile: (data: Omit<DoctorProfile, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load profile for authenticated user
  const loadProfileForUser = useCallback(async (authUser: AuthUser | null) => {
    if (!authUser) {
      setPatientProfile(null);
      setDoctorProfile(null);
      setHasCompletedOnboarding(false);
      return;
    }

    try {
      if (authUser.role === 'PATIENT') {
        const pProfile = await dataService.getPatientProfile(authUser.id);
        setPatientProfile(pProfile);
        setDoctorProfile(null);
        setHasCompletedOnboarding(!!(pProfile && pProfile.fullName && pProfile.age));
      } else if (authUser.role === 'DOCTOR') {
        const dProfile = await dataService.getDoctorProfile(authUser.id);
        setDoctorProfile(dProfile);
        setPatientProfile(null);
        setHasCompletedOnboarding(!!(dProfile && dProfile.fullName && dProfile.organization));
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }, []);

  // Initialize and subscribe to auth state changes
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      if (currentUser) {
        await loadProfileForUser(currentUser);
      } else {
        setPatientProfile(null);
        setDoctorProfile(null);
        setHasCompletedOnboarding(false);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadProfileForUser]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfileForUser(user);
    }
  }, [user, loadProfileForUser]);

  const login = async (params: LoginParams): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const authUser = await authService.login(params);
      setUser(authUser);
      await loadProfileForUser(authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: SignUpParams): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const authUser = await authService.signUp(params);
      setUser(authUser);
      // New sign-up starts with empty profile
      setPatientProfile(null);
      setDoctorProfile(null);
      setHasCompletedOnboarding(false);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setPatientProfile(null);
      setDoctorProfile(null);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    try {
      await authService.deleteAccount(user.id);
      setUser(null);
      setPatientProfile(null);
      setDoctorProfile(null);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const savePatientProfile = async (
    data: Omit<PatientProfile, 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (!user) throw new Error('Cannot save profile: No authenticated user');
    if (user.role !== 'PATIENT') throw new Error('Role mismatch: Only patients can save patient profile');

    const now = new Date().toISOString();
    const connectionCode =
      (data as { connectionCode?: string }).connectionCode ||
      patientProfile?.connectionCode ||
      generatePatientConnectionCode(data.fullName);

    const fullProfile: PatientProfile = {
      ...data,
      connectionCode,
      userId: user.id,
      createdAt: patientProfile?.createdAt || now,
      updatedAt: now,
    };

    await dataService.savePatientProfile(fullProfile);
    setPatientProfile(fullProfile);
    setHasCompletedOnboarding(true);
  };

  const saveDoctorProfile = async (
    data: Omit<DoctorProfile, 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (!user) throw new Error('Cannot save profile: No authenticated user');
    if (user.role !== 'DOCTOR') throw new Error('Role mismatch: Only doctors can save doctor profile');

    const now = new Date().toISOString();
    const fullProfile: DoctorProfile = {
      ...data,
      userId: user.id,
      createdAt: doctorProfile?.createdAt || now,
      updatedAt: now,
    };

    await dataService.saveDoctorProfile(fullProfile);
    setDoctorProfile(fullProfile);
    setHasCompletedOnboarding(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patientProfile,
        doctorProfile,
        isAuthenticated: !!user,
        isLoading,
        hasCompletedOnboarding,
        login,
        signUp,
        logout,
        refreshProfile,
        deleteAccount,
        savePatientProfile,
        saveDoctorProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
