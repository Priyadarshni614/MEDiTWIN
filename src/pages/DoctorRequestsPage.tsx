/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { DoctorPatientRelationship } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import { demoService } from '../services/demoService';
import { 
  UserPlus, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  ShieldCheck, 
  ArrowRight, 
  Search,
  Users,
  FolderOpen
} from 'lucide-react';

export const DoctorRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [relationships, setRelationships] = useState<DoctorPatientRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'ARCHIVED'>('PENDING');

  const isDemoDoctor = user?.email?.toLowerCase().includes('joel') || user?.email?.toLowerCase().includes('demo');

  useEffect(() => {
    if (!user) return;
    const loadRequests = async () => {
      setLoading(true);
      try {
        const list = await authorizationService.getRelationshipsForDoctor(user.id);
        setRelationships(list);
      } catch (err) {
        console.error('Error loading doctor requests:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [user]);

  const pendingList = relationships.filter(r => r.status === 'PENDING');
  const activeList = relationships.filter(r => r.status === 'ACTIVE');
  const archivedList = relationships.filter(r => r.status === 'DECLINED' || r.status === 'REVOKED');

  const getFilteredList = () => {
    switch (filter) {
      case 'PENDING':
        return pendingList;
      case 'ACTIVE':
        return activeList;
      case 'ARCHIVED':
        return archivedList;
      default:
        return relationships;
    }
  };

  const filteredItems = getFilteredList();

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/doctor/connect')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Connect New Patient</span>
          </button>
        </div>

        {/* Demo Doctor Banner */}
        {isDemoDoctor && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-semibold">Demo Clinician Mode Active</span>
            <span className="text-[11px] text-amber-700">Dr. Joel Miller</span>
          </div>
        )}

        {/* Section Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Relationship Dispatch Registry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Connection Requests
            </h1>
            <p className="text-xs text-slate-500">
              Track outgoing clinical connection requests and authorization statuses.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active ({activeList.length})
            </button>
            <button
              onClick={() => setFilter('ARCHIVED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'ARCHIVED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Archived ({archivedList.length})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <span className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading connection requests...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No {filter.toLowerCase()} requests
              </h3>
              <p className="mt-1.5 text-xs text-slate-500">
                {filter === 'PENDING' 
                  ? 'You have no pending requests awaiting patient authorization.' 
                  : `No records found in this category.`}
              </p>
              {filter === 'PENDING' && (
                <button
                  onClick={() => navigate('/doctor/connect')}
                  className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Send Connection Request
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isPending = item.status === 'PENDING';
              const isActive = item.status === 'ACTIVE';
              const isRevoked = item.status === 'REVOKED';
              const isDeclined = item.status === 'DECLINED';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-sm shrink-0 mt-0.5">
                      {item.patientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {item.patientName}
                        </h4>
                        
                        {isPending && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting Patient Approval</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active Authorized</span>
                          </span>
                        )}
                        {isRevoked && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                            <UserX className="w-3 h-3" />
                            <span>Access Revoked</span>
                          </span>
                        )}
                        {isDeclined && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Request Declined</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {item.patientConnectionCode}
                        </span>
                        <span>Requested: {new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.authorizedAt && (
                          <span>• Authorized: {new Date(item.authorizedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0 w-full sm:w-auto justify-end">
                    {isActive && (
                      <button
                        onClick={() => navigate(`/doctor/patient-view?patientId=${item.patientId}`)}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Open Patient Chart</span>
                      </button>
                    )}
                    {isPending && (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                        Waiting for patient login
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
