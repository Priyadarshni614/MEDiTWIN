/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRouter } from '../../services/router';
import { 
  Activity, 
  LogOut, 
  Stethoscope, 
  HeartHandshake, 
  Menu, 
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/10">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  MED<span className="text-sky-600">i</span>TWIN <span className="text-teal-600 text-sm font-semibold tracking-wider uppercase ml-0.5 px-1.5 py-0.5 bg-teal-50 rounded-md border border-teal-200/60">AI</span>
                </span>
              </div>
              <span className="hidden sm:block text-[11px] font-medium text-slate-600 tracking-normal">
                Medication Safety & Polypharmacy Intelligence
              </span>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <button
                  id="nav-btn-landing"
                  onClick={() => navigate('/')}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    currentPath === '/' ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overview
                </button>
                <div className="h-4 w-px bg-slate-200" />
                <button
                  id="nav-btn-login"
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  id="nav-btn-signup"
                  onClick={() => navigate('/signup')}
                  className="text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg shadow-sm shadow-sky-600/20 transition-all hover:shadow"
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                {/* Role Badge */}
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-xs font-semibold tracking-wide uppercase bg-slate-50 border-slate-200">
                  {isDoctor ? (
                    <>
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-teal-700">Doctor Portal</span>
                    </>
                  ) : (
                    <>
                      <HeartHandshake className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-sky-700">Patient Portal</span>
                    </>
                  )}
                </div>

                {/* User Info Capsule */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium truncate max-w-[130px]">
                      {user?.email}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  id="nav-btn-logout"
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Logout from session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {!isAuthenticated ? (
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/'); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Overview
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Login
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                className="w-full text-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700"
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-sky-100 text-sky-800">
                  {user?.role}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={handleLogout}
                  className="text-left px-3 py-2 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
