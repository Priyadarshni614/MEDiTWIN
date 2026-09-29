/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from './Navbar';
import { RoleNavTabs } from './RoleNavTabs';
import { Footer } from './Footer';
import { useRouter } from '../../services/router';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useRouter();
  const isEmergencyPassportView = pathname === '/passport/view';

  if (isEmergencyPassportView) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />
      <RoleNavTabs />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
};
