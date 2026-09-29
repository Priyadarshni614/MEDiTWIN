/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRouter } from '../../services/router';
import {
  LayoutDashboard,
  UserCheck,
  Dna,
  ScanLine,
  ShieldAlert,
  Sliders,
  FileSpreadsheet,
  QrCode,
  Users,
  Stethoscope,
  UserPlus,
  Clock,
  Settings,
} from 'lucide-react';

export const RoleNavTabs: React.FC = () => {
  const { user, isAuthenticated, hasCompletedOnboarding } = useAuth();
  const { currentPath, navigate } = useRouter();

  if (!isAuthenticated || !hasCompletedOnboarding) return null;

  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';

  const patientTabs = [
    { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/patient/profile', icon: UserCheck },
    { name: 'Care Team', path: '/patient/care-team', icon: Stethoscope },
    { name: 'Medication Twin', path: '/patient/twin', icon: Dna },
    { name: 'Prescription Scanner', path: '/patient/scanner', icon: ScanLine },
    { name: 'Analysis', path: '/patient/analysis', icon: ShieldAlert },
    { name: 'Simulator', path: '/patient/simulator', icon: Sliders },
    { name: 'Reports', path: '/patient/reports', icon: FileSpreadsheet },
    { name: 'Emergency Passport', path: '/patient/passport', icon: QrCode },
    { name: 'Settings', path: '/patient/settings', icon: Settings },
  ];

  const doctorTabs = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'My Patients', path: '/doctor/patients', icon: Users },
    { name: 'Connect Patient', path: '/doctor/connect', icon: UserPlus },
    { name: 'Requests', path: '/doctor/requests', icon: Clock },
    { name: 'Clinical Analysis', path: '/doctor/analysis', icon: ShieldAlert },
    { name: 'Simulator', path: '/doctor/simulator', icon: Sliders },
    { name: 'Reports', path: '/doctor/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/doctor/settings', icon: Settings },
  ];

  const tabs = isPatient ? patientTabs : isDoctor ? doctorTabs : [];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Module Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPath === tab.path;
            return (
              <button
                key={tab.path}
                id={`tab-${tab.path.replace(/\//g, '-')}`}
                onClick={() => navigate(tab.path)}
                className={`flex items-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-xs border border-sky-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-500'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
