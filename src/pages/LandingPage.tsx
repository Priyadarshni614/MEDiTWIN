/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../services/router';
import { useAuth } from '../auth/AuthContext';
import { 
  Activity, 
  ArrowRight, 
  Dna, 
  ScanLine, 
  ShieldAlert, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck, 
  HeartPulse, 
  Pill, 
  Stethoscope,
  Sparkles,
  Lock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isAuthenticated, user, hasCompletedOnboarding } = useAuth();

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      navigate('/signup');
    } else if (!hasCompletedOnboarding) {
      navigate(user?.role === 'DOCTOR' ? '/doctor/onboarding' : '/patient/onboarding');
    } else {
      navigate(user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/60 via-white to-slate-50/50 py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            
            {/* Pill Eyebrow Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Next-Generation Clinical Decision Support</span>
            </div>

            {/* Product Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              MED<span className="text-sky-600">i</span>TWIN <span className="text-teal-600">AI</span>
            </h1>

            {/* Tagline */}
            <p className="mt-4 text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight">
              Personalized Medication Safety &amp; Polypharmacy Intelligence
            </p>

            {/* Secondary Tagline */}
            <p className="mt-2 text-base sm:text-lg font-medium text-sky-700">
              "Understand the complete medication picture before the next prescription."
            </p>

            {/* Description */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              MediTwin AI creates a personalized medication profile and helps identify potential medication-related risks by considering medicines together with patient-specific factors.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isAuthenticated ? (
                <>
                  <button
                    id="hero-btn-signup"
                    onClick={() => navigate('/signup')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-base shadow-sm shadow-sky-600/20 hover:shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    id="hero-btn-login"
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-300 shadow-xs transition-all flex items-center justify-center"
                  >
                    Login
                  </button>
                </>
              ) : (
                <button
                  id="hero-btn-go-dashboard"
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base shadow-sm shadow-teal-600/20 hover:shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Go to My {user?.role === 'DOCTOR' ? 'Doctor' : 'Patient'} Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Zero Plaintext Passwords</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-sky-600" />
                <span>Strict User Data Isolation</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <HeartPulse className="w-4 h-4 text-indigo-600" />
                <span>Role-Based Health Architecture</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Short Feature Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Four Core Pillars of Polypharmacy Intelligence
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Designed to solve multidrug complications by modeling human physiology against complex prescribing cascades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Personalized Medication Twin */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 hover:border-sky-300 transition-all hover:shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <Dna className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Personalized Medication Twin
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Creates an individualized digital replica of patient pharmacology incorporating age, chronic conditions, organ considerations, and allergies.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-sky-600">
                <span>Digital Patient Profiling</span>
              </div>
            </div>

            {/* 2. Prescription Intelligence */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 hover:border-teal-300 transition-all hover:shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Prescription Intelligence
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Transforms static prescriptions and physical bottle labels into synchronized digital records with schedule tracking and clinical dose verification.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-teal-600">
                <span>Prescription Digitization</span>
              </div>
            </div>

            {/* 3. Medication Risk Analysis */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 hover:border-amber-300 transition-all hover:shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Medication Risk Analysis
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Evaluates drug-drug interactions, duplicate therapeutic classes, anticholinergic burden, and contraindications before adverse events occur.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-amber-600">
                <span>Multi-Drug Interaction Engine</span>
              </div>
            </div>

            {/* 4. What-If Prescription Simulation */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-300 transition-all hover:shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                What-If Prescription Simulation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Allows clinicians and patients to simulate adding, discontinuing, or titrating a drug to project safety shifts before the prescription is issued.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-600">
                <span>Predictive Clinical Sandbox</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Two Stakeholder Tracks: Patient vs Doctor */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Patient Track */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-md border border-sky-100 mb-3">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>For Patients &amp; Caregivers</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Personal Medication Twin Portal</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Take ownership of your health with an easy-to-understand medication profile, emergency medication passport, and clear safety insights.
                </p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Personalized allergy and chronic condition registry</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Plain-language drug conflict warnings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Emergency QR Medication Passport (Module 2)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/signup')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl border border-sky-600 text-sky-600 font-semibold text-sm hover:bg-sky-50 transition-colors text-center"
              >
                Register as Patient
              </button>
            </div>

            {/* Doctor Track */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-md border border-teal-100 mb-3">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>For Clinicians &amp; Pharmacists</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Clinical Decision Support Portal</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Empowering primary care doctors, geriatricians, and clinical pharmacists to untangle polypharmacy complexity during visits.
                </p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Cross-specialty prescription reconciliation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>What-If Prescription Simulator for new treatments</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Comprehensive Clinical Auditing Reports (Module 2)</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/signup')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl border border-teal-600 text-teal-600 font-semibold text-sm hover:bg-teal-50 transition-colors text-center"
              >
                Register as Doctor / Clinician
              </button>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
