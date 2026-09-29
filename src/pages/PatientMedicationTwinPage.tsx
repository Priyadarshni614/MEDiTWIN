/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { Medication, Prescription } from '../models/types';
import { medicationService } from '../services/medicationService';
import { prescriptionService } from '../services/prescriptionService';
import { demoService } from '../services/demoService';
import { AddMedicationModal } from '../components/medications/AddMedicationModal';
import { MedicationDetailsModal } from '../components/medications/MedicationDetailsModal';
import { DiscontinueMedicationModal } from '../components/medications/DiscontinueMedicationModal';
import { PrescriptionDetailsModal } from '../components/medications/PrescriptionDetailsModal';
import { 
  Dna, 
  Pill, 
  Plus, 
  Sparkles, 
  Clock, 
  History, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Stethoscope, 
  Edit3, 
  Eye, 
  Search, 
  Filter, 
  ArrowRight,
  Info,
  Layers,
  HeartPulse,
  Activity
} from 'lucide-react';

export const PatientMedicationTwinPage: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { navigate } = useRouter();

  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [historyMeds, setHistoryMeds] = useState<Medication[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'prescriptions'>('current');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [viewingMedication, setViewingMedication] = useState<Medication | null>(null);
  const [discontinuingMedication, setDiscontinuingMedication] = useState<Medication | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

  const isDemo = demoService.isDemoUser(user?.email);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const active = await medicationService.getActiveMedications(user.id);
      const history = await medicationService.getMedicationHistory(user.id);
      const rx = await prescriptionService.getPrescriptions(user.id);
      setActiveMeds(active);
      setHistoryMeds(history);
      setPrescriptions(rx);
    } catch (err) {
      console.error('Failed to load medication twin data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered lists based on search
  const filteredActive = activeMeds.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.brandName?.toLowerCase().includes(q) ||
      m.purpose?.toLowerCase().includes(q)
    );
  });

  const filteredHistory = historyMeds.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.purpose?.toLowerCase().includes(q)
    );
  });

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.fileName.toLowerCase().includes(q) ||
      p.doctorName?.toLowerCase().includes(q) ||
      p.extractedMedications.some((m) => m.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Demo Data Disclaimer Banner */}
        {isDemo && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Patient
              </span>
              <span className="font-semibold">DEMO DATA — NOT REAL MEDICAL INFORMATION</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Angelin Steve • Personalized Digital Medication Twin Live
            </span>
          </div>
        )}

        {/* Header & Quick Action Buttons */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
              <Dna className="w-3.5 h-3.5 text-sky-600" />
              <span>Personalized Digital Pharmacological Model</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your Personalized Medication Twin
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              An individual computational replica synthesizing your age, organ functions, chronic diagnoses, documented allergies, active prescription drugs, and historical therapies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="twin-add-med-btn"
              onClick={() => {
                setEditingMedication(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>
        </div>

        {/* Patient Profile Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Clinical Health Foundation
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Patient ID: {user?.id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {patientProfile?.fullName || user?.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Demographics</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block capitalize">
                {patientProfile?.age ? `${patientProfile.age} yrs • ${patientProfile.gender}` : 'Not provided'}
                {patientProfile?.weight ? ` • ${patientProfile.weight}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Active Drug Load</span>
              <span className="font-bold text-teal-700 text-sm mt-0.5 block">
                {activeMeds.length} {activeMeds.length === 1 ? 'Medication' : 'Medications'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Emergency Contact</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                {patientProfile?.emergencyContact?.name || 'None listed'}
              </span>
            </div>
          </div>

          {/* Chronic Conditions & Allergies Chips */}
          <div className="pt-2 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Registered Factors:</span>
            {patientProfile?.allergies?.map((allergy) => (
              <span
                key={allergy}
                className="px-2.5 py-1 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200 font-semibold flex items-center space-x-1"
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>Allergy: {allergy}</span>
              </span>
            ))}
            {patientProfile?.chronicConditions?.map((cond) => (
              <span
                key={cond}
                className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-900 border border-amber-200 font-semibold flex items-center space-x-1"
              >
                <Activity className="w-3 h-3 text-amber-600" />
                <span>Condition: {cond}</span>
              </span>
            ))}
            {(!patientProfile?.allergies?.length && !patientProfile?.chronicConditions?.length) && (
              <span className="text-xs text-slate-400 italic">No chronic conditions or allergies registered.</span>
            )}
          </div>
        </div>

        {/* Dynamic Medication Twin Architecture Visualization */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 rounded-2xl p-6 text-white shadow-sm overflow-hidden relative">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Dynamic Twin Synapse Representation
                </span>
              </div>
              <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-md text-sky-200 font-mono">
                Real-Time Synchronized
              </span>
            </div>

            {/* Architecture Node Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] uppercase font-bold text-sky-300 block">Layer 1</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Demographics</h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  {patientProfile?.age} yo {patientProfile?.gender}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] uppercase font-bold text-sky-300 block">Layer 2</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Diagnoses &amp; Allergies</h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  {patientProfile?.chronicConditions?.length || 0} conditions, {patientProfile?.allergies?.length || 0} allergies
                </p>
              </div>

              <div className="bg-teal-500/20 backdrop-blur-xs p-3.5 rounded-xl border border-teal-400/30">
                <span className="text-[10px] uppercase font-bold text-teal-300 block">Layer 3 (Core)</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Active Regimen</h4>
                <p className="text-[11px] text-teal-200 mt-1 font-semibold">
                  {activeMeds.length} active pharmacological agents
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] uppercase font-bold text-sky-300 block">Layer 4</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Discontinued History</h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  {historyMeds.length} historical therapies
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15">
                <span className="text-[10px] uppercase font-bold text-sky-300 block">Layer 5</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Prescriptions</h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  {prescriptions.length} uploaded records
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2">
            <button
              id="twin-tab-current"
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'current'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Current Medications ({activeMeds.length})</span>
            </button>

            <button
              id="twin-tab-history"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Medication History ({historyMeds.length})</span>
            </button>

            <button
              id="twin-tab-prescriptions"
              onClick={() => setActiveTab('prescriptions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'prescriptions'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Prescription Records ({prescriptions.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medications..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-500 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* TAB 1: CURRENT MEDICATIONS */}
        {activeTab === 'current' && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading medications...</div>
            ) : filteredActive.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    No active medications recorded
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {searchQuery
                      ? 'No medications match your search query.'
                      : 'Build your Personalized Digital Medication Twin by manually entering your current prescriptions.'}
                  </p>
                </div>
                {!searchQuery && (
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      onClick={() => {
                        setEditingMedication(null);
                        setIsAddModalOpen(true);
                      }}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add Medication Manually
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActive.map((med) => (
                  <div
                    key={med.id}
                    id={`med-card-${med.id}`}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Strength & Source */}
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {med.strength || 'Standard Strength'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {med.source === 'PRESCRIPTION_OCR' ? 'Prescription Scan' : 'Manual Entry'}
                        </span>
                      </div>

                      {/* Medicine Name */}
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {med.name}
                      </h3>
                      {med.genericName && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Generic: {med.genericName}
                        </p>
                      )}

                      {/* Dosage & Frequency details */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Dosage:</span>
                          <span className="font-semibold text-slate-800">{med.dosage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Frequency:</span>
                          <span className="font-semibold text-slate-800">{med.frequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Route:</span>
                          <span className="font-semibold text-slate-800">{med.route}</span>
                        </div>
                      </div>

                      {/* Purpose & Prescriber */}
                      <div className="mt-3 text-xs space-y-1">
                        {med.purpose && (
                          <p className="text-slate-600 line-clamp-1">
                            <span className="text-slate-400">For:</span> {med.purpose}
                          </p>
                        )}
                        {med.prescribedBy && (
                          <p className="text-slate-500 text-[11px] line-clamp-1 flex items-center space-x-1">
                            <Stethoscope className="w-3 h-3 text-teal-600" />
                            <span>{med.prescribedBy}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setViewingMedication(med)}
                        className="text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingMedication(med);
                            setIsAddModalOpen(true);
                          }}
                          className="text-teal-700 hover:text-teal-900 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDiscontinuingMedication(med)}
                          className="text-rose-600 hover:text-rose-800 font-semibold transition-colors cursor-pointer"
                        >
                          Discontinue
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEDICATION HISTORY (Discontinued Medications) */}
        {activeTab === 'history' && (
          <div>
            {filteredHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Discontinued Medications</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When you complete a course of medication or your doctor discontinues a drug, it is preserved here for historical safety reviews.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Historical Medication Archives ({filteredHistory.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Preserved for pharmacological audit &amp; interaction checks
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredHistory.map((med) => (
                    <div key={med.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-800">{med.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {med.strength}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            DISCONTINUED
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Dosage: {med.dosage} • {med.frequency} • {med.route}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                          <span>Started: {med.startDate || 'Unknown'}</span>
                          <span>•</span>
                          <span>Ended: {med.endDate || 'Recorded'}</span>
                          {med.purpose && (
                            <>
                              <span>•</span>
                              <span>Reason: {med.purpose}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setViewingMedication(med)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRESCRIPTION RECORDS */}
        {activeTab === 'prescriptions' && (
          <div>
            {filteredPrescriptions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Prescriptions Uploaded</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload a photo of your prescription slip or medication label to automatically extract medications into your Medication Twin.
                </p>
                <button
                  onClick={() => navigate('/patient/scanner')}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Upload Prescription Slip
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rx.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {rx.verificationStatus === 'VERIFIED' ? 'Verified & Added' : 'Pending Review'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rx.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100 mb-3 relative">
                        <img
                          src={rx.imageUrl}
                          alt={rx.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {rx.fileName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Prescriber: {rx.doctorName || 'Not identified'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Date: {rx.prescriptionDate || 'Undetected'}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-teal-800 font-semibold">
                        {rx.extractedMedications?.length || 0} medications extracted
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingPrescription(rx)}
                      className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      View Document &amp; Entries
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODALS */}
        <AddMedicationModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingMedication(null);
          }}
          patientId={user?.id || ''}
          medicationToEdit={editingMedication}
          onSaved={() => {
            loadData();
          }}
        />

        <MedicationDetailsModal
          isOpen={!!viewingMedication}
          onClose={() => setViewingMedication(null)}
          medication={viewingMedication}
          isReadOnly={false}
          onEdit={(med) => {
            setViewingMedication(null);
            setEditingMedication(med);
            setIsAddModalOpen(true);
          }}
          onDiscontinue={(med) => {
            setViewingMedication(null);
            setDiscontinuingMedication(med);
          }}
        />

        <DiscontinueMedicationModal
          isOpen={!!discontinuingMedication}
          onClose={() => setDiscontinuingMedication(null)}
          patientId={user?.id || ''}
          medication={discontinuingMedication}
          onDiscontinued={() => {
            loadData();
          }}
        />

        <PrescriptionDetailsModal
          isOpen={!!viewingPrescription}
          onClose={() => setViewingPrescription(null)}
          prescription={viewingPrescription}
        />

      </div>
    </div>
  );
};
