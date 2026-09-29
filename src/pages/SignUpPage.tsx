/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../services/router';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../models/types';
import { 
  HeartHandshake, 
  Stethoscope, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck 
} from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const { navigate } = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation checks
    if (!name.trim()) {
      setFormError('Please provide your Full Name.');
      return;
    }
    if (!email.trim()) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumber) {
      setFormError('Password must be at least 8 characters with both letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdUser = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
      });

      // Redirect to role-specific onboarding immediately upon creation
      if (createdUser.role === 'DOCTOR') {
        navigate('/doctor/onboarding');
      } else {
        navigate('/patient/onboarding');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-100 text-sky-600 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join MediTwin AI for personalized medication safety intelligence
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Registration Issue: </span>
              {formError}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="role-select-patient"
                onClick={() => setRole('PATIENT')}
                className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  role === 'PATIENT'
                    ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20 text-sky-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${role === 'PATIENT' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Patient</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Personal safety &amp; twin</div>
                </div>
              </button>

              <button
                type="button"
                id="role-select-doctor"
                onClick={() => setRole('DOCTOR')}
                className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  role === 'DOCTOR'
                    ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20 text-teal-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${role === 'DOCTOR' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Doctor</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Clinical decision tool</div>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'DOCTOR' ? 'e.g., Dr. Marcus Vance' : 'e.g., Sarah Jenkins'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Strength Checklist */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span className={hasMinLength ? 'text-teal-700 font-medium' : 'text-slate-500'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasLetter && hasNumber ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span className={hasLetter && hasNumber ? 'text-teal-700 font-medium' : 'text-slate-500'}>
                  Contains letters and numbers
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all text-slate-900 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                }`}
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-[11px] text-rose-600">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="signup-submit-btn"
            disabled={isSubmitting}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create {role === 'DOCTOR' ? 'Doctor' : 'Patient'} Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <button
            id="signup-goto-login-btn"
            onClick={() => navigate('/login')}
            className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
          >
            Sign In here
          </button>
        </div>

      </div>
    </div>
  );
};
