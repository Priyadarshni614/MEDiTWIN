/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './auth/AuthContext';
import { RouterProvider, useRouter } from './services/router';
import { RouteGuard } from './components/common/RouteGuard';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { PatientOnboardingPage } from './pages/PatientOnboardingPage';
import { DoctorOnboardingPage } from './pages/DoctorOnboardingPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { PatientCareTeamPage } from './pages/PatientCareTeamPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { DoctorConnectPage } from './pages/DoctorConnectPage';
import { DoctorRequestsPage } from './pages/DoctorRequestsPage';
import { DoctorPatientsPage } from './pages/DoctorPatientsPage';
import { DoctorPatientViewPage } from './pages/DoctorPatientViewPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { PatientMedicationTwinPage } from './pages/PatientMedicationTwinPage';
import { PrescriptionScannerPage } from './pages/PrescriptionScannerPage';
import { PatientAnalysisPage } from './pages/PatientAnalysisPage';
import { DoctorAnalysisPage } from './pages/DoctorAnalysisPage';
import { PatientSimulatorPage } from './pages/PatientSimulatorPage';
import { DoctorSimulatorPage } from './pages/DoctorSimulatorPage';
import { PatientPassportPage } from './pages/PatientPassportPage';
import { PatientReportsPage } from './pages/PatientReportsPage';
import { DoctorReportsPage } from './pages/DoctorReportsPage';
import { EmergencyPassportViewPage } from './pages/EmergencyPassportViewPage';
import { PatientSettingsPage } from './pages/PatientSettingsPage';
import { DoctorSettingsPage } from './pages/DoctorSettingsPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';

const AppContent: React.FC = () => {
  const { pathname } = useRouter();

  const renderCurrentView = () => {
    switch (pathname) {
      case '/':
        return <LandingPage />;
      case '/login':
        return <LoginPage />;
      case '/signup':
        return <SignUpPage />;
      case '/patient/onboarding':
        return <PatientOnboardingPage />;
      case '/doctor/onboarding':
        return <DoctorOnboardingPage />;
      case '/patient/dashboard':
        return <PatientDashboardPage />;
      case '/patient/profile':
        return <PatientProfilePage />;
      case '/patient/care-team':
        return <PatientCareTeamPage />;
      case '/patient/twin':
      case '/patient/medications':
        return <PatientMedicationTwinPage />;
      case '/patient/scanner':
        return <PrescriptionScannerPage />;
      case '/patient/analysis':
        return <PatientAnalysisPage />;
      case '/patient/simulator':
        return <PatientSimulatorPage />;
      case '/doctor/dashboard':
        return <DoctorDashboardPage />;
      case '/doctor/connect':
        return <DoctorConnectPage />;
      case '/doctor/requests':
        return <DoctorRequestsPage />;
      case '/doctor/patients':
        return <DoctorPatientsPage />;
      case '/doctor/patient-view':
      case '/doctor/patient-detail':
        return <DoctorPatientViewPage />;
      case '/doctor/analysis':
        return <DoctorAnalysisPage />;
      case '/doctor/simulator':
        return <DoctorSimulatorPage />;
      case '/access-denied':
        return <AccessDeniedPage />;
      
      // Phase 6 Modules
      case '/patient/passport':
        return <PatientPassportPage />;
      case '/patient/reports':
        return <PatientReportsPage />;
      case '/doctor/reports':
        return <DoctorReportsPage />;
      case '/passport/view':
        return <EmergencyPassportViewPage />;

      // Settings & Security
      case '/patient/settings':
        return <PatientSettingsPage />;
      case '/doctor/profile':
      case '/doctor/settings':
        return <DoctorSettingsPage />;

      default:
        return <LandingPage />;
    }
  };

  return (
    <RouteGuard>
      <AppLayout>
        {renderCurrentView()}
      </AppLayout>
    </RouteGuard>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterProvider>
  );
}
