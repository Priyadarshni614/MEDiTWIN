/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MedicationSafetyReport,
  MedicationSafetyFinding,
  VerifiedSeverity,
  IssueCategory,
} from '../../models/safetyTypes';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  HelpCircle,
  Clock,
  Pill,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  HeartPulse,
  Layers,
  ArrowRight,
  Sparkles,
  FileCheck2,
  FileQuestion,
  UserCheck,
} from 'lucide-react';

interface SafetyAnalysisViewProps {
  report: MedicationSafetyReport;
  userRole: 'PATIENT' | 'DOCTOR';
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
}

export const SafetyAnalysisView: React.FC<SafetyAnalysisViewProps> = ({
  report,
  userRole,
  onReanalyze,
  isReanalyzing = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  const { summary, findings, scoreBreakdown, patientContext, analyzedAt } = report;

  const verifiedFindings = findings.filter((f) => f.verificationState === 'VERIFIED');
  const unverifiedFindings = findings.filter((f) => f.verificationState === 'UNABLE_TO_VERIFY');

  const filteredVerified = verifiedFindings.filter((f) => {
    if (selectedCategory === 'ALL') return true;
    return f.category === selectedCategory;
  });

  const getSeverityBadge = (severity?: VerifiedSeverity) => {
    switch (severity) {
      case 'contraindicated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-700 text-white tracking-wide uppercase">
            <AlertOctagon className="w-3 h-3 mr-1" />
            Contraindicated
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
            High Severity
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            Moderate Severity
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <Info className="w-3 h-3 mr-1 text-sky-600" />
            Low Severity
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Verified Alert
          </span>
        );
    }
  };

  const getCategoryLabel = (category: IssueCategory) => {
    switch (category) {
      case 'DRUG_DRUG_INTERACTION':
        return 'Drug-Drug Interaction';
      case 'DUPLICATE_THERAPY':
        return 'Duplicate Therapy';
      case 'ALLERGY_CONTRAINDICATION':
        return 'Documented Allergy Conflict';
      case 'PATIENT_PRECAUTION':
        return 'Patient Condition / Age Precaution';
      case 'INCOMPLETE_MEDICATION_DATA':
        return 'Incomplete Medication Data';
      default:
        return category;
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'text-slate-500';
    if (score >= 90) return 'text-teal-600';
    if (score >= 75) return 'text-amber-500';
    if (score >= 50) return 'text-orange-600';
    return 'text-rose-600';
  };

  const formattedDate = new Date(analyzedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Role-Specific Banner Advice */}
      {userRole === 'PATIENT' ? (
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-sky-950 flex items-start space-x-3 text-xs leading-relaxed shadow-xs">
          <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sky-900 text-sm">
              Patient Guidance &amp; Safety Advisory
            </p>
            <p>
              This safety review is designed to help you and your healthcare team understand how your medications work together.
              <strong className="ml-1 text-sky-950">
                Never stop, start, or change any prescription medication on your own.
              </strong>{' '}
              If you have any questions or concerns about potential drug interactions or warnings shown below, please discuss them directly with your prescribing physician or clinical pharmacist.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-indigo-950 flex items-start space-x-3 text-xs leading-relaxed shadow-xs">
          <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-indigo-950 text-sm">
              Clinical Decision Support (Doctor / Clinician View)
            </p>
            <p>
              Findings are synthesized from documented FDA package inserts, 2023 AGS Beers Criteria, and peer-reviewed pharmacology monographs.
              This analysis supports, but does not replace, clinical judgment. Findings distinguish verified interactions from unverified checks where clinical lab or dosing parameters are missing.
            </p>
          </div>
        </div>
      )}

      {/* Authenticated Patient Profile Foundation Verification Banner */}
      <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-slate-900">Authenticated Patient Profile Verification:</span>
          <span>
            Age: <strong>{patientContext.age ? `${patientContext.age} yrs` : 'Not recorded'}</strong> • Allergies: <strong>{patientContext.allergies.length}</strong> • Chronic Conditions: <strong>{patientContext.chronicConditions.length}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Read strictly from profile • No inferred values
        </span>
      </div>

      {/* SECTION 1: ANALYSIS SUMMARY */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
              <span>Section A • Analysis Summary</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Medication Safety Synthesis
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Conducted: {formattedDate}</span>
              <span>•</span>
              <span>Patient Ref: {patientContext.age} yo ({patientContext.chronicConditions.length} conditions, {patientContext.allergies.length} allergies)</span>
            </div>
          </div>

          {onReanalyze && (
            <button
              onClick={onReanalyze}
              disabled={isReanalyzing}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
              <span>{isReanalyzing ? 'Re-analyzing...' : 'Re-run Analysis'}</span>
            </button>
          )}
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">
              Medications Reviewed
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {summary.totalMedicationsReviewed}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Active in Medication Twin
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${summary.potentialIssuesCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className="text-[11px] font-semibold block uppercase text-slate-700">
              Potential Issues Identified
            </span>
            <span className={`text-2xl font-black mt-1 block ${summary.potentialIssuesCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {summary.potentialIssuesCount}
            </span>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              {summary.potentialIssuesCount === 1 ? 'Verified clinical warning' : 'Verified clinical warnings'}
            </span>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-900 block uppercase">
              Checks Unable to Verify
            </span>
            <span className="text-2xl font-black text-amber-800 mt-1 block">
              {summary.unverifiedChecksCount}
            </span>
            <span className="text-[11px] text-amber-700 mt-0.5 block">
              Due to missing lab/dosing data
            </span>
          </div>

          {/* SECTION 3: MEDICATION SAFETY SCORE */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                  Safety Score
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-600 uppercase">
                  Prototype
                </span>
              </div>
              {scoreBreakdown.isCalculable ? (
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className={`text-3xl font-black tracking-tight ${getScoreColor(scoreBreakdown.score)}`}>
                    {scoreBreakdown.score}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-1 bg-slate-200 text-slate-700">
                    {scoreBreakdown.ratingLabel?.replace('_', ' ')}
                  </span>
                </div>
              ) : (
                <div className="mt-1">
                  <span className="text-sm font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded inline-block">
                    Score Unavailable
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCalculationDetails(!showCalculationDetails)}
              className="text-[11px] text-teal-700 hover:text-teal-900 font-bold inline-flex items-center space-x-1 mt-2 text-left cursor-pointer"
            >
              <span>{showCalculationDetails ? 'Hide calculation' : 'How score is calculated'}</span>
              {showCalculationDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Transparent Score Calculation Drawer */}
        {showCalculationDetails && (
          <div className="bg-slate-100 rounded-xl p-4 text-xs space-y-3 border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">
                Documented Safety Score Methodology &amp; Limitations
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Prototype Deductions Index
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {scoreBreakdown.calculationMethod}
            </p>

            {scoreBreakdown.isCalculable ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200 pb-1">
                  <span>Starting Baseline</span>
                  <span>100 pts</span>
                </div>
                {scoreBreakdown.deductions.length === 0 ? (
                  <p className="text-emerald-700 italic">No deductions applied. All evaluated checks optimal.</p>
                ) : (
                  scoreBreakdown.deductions.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700 text-xs py-0.5">
                      <span className="text-slate-600 truncate max-w-md">• {d.rule}</span>
                      <span className="font-bold text-rose-600 shrink-0">-{d.pointsDeducted} pts</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-300 pt-1.5 text-sm">
                  <span>Calculated Medication Safety Score</span>
                  <span className={getScoreColor(scoreBreakdown.score)}>{scoreBreakdown.score} / 100</span>
                </div>
              </div>
            ) : (
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                {scoreBreakdown.uncalculableReason}
              </p>
            )}

            {/* Prototype Indicator Disclaimer */}
            <div className="pt-2 text-[11px] text-slate-600 border-t border-slate-200 bg-white/60 p-2.5 rounded-lg leading-relaxed">
              <span className="font-bold text-slate-900 block mb-0.5">Scientific &amp; Regulatory Notice:</span>
              {scoreBreakdown.clinicalLimitationsDisclaimer}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: POTENTIAL MEDICATION ISSUES */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Section B • Potential Medication Issues</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Identified Findings ({verifiedFindings.length})
            </h3>
          </div>

          {/* Category Filter Pills */}
          {verifiedFindings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({verifiedFindings.length})
              </button>
              {summary.allergyConflictCount > 0 && (
                <button
                  onClick={() => setSelectedCategory('ALLERGY_CONTRAINDICATION')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'ALLERGY_CONTRAINDICATION'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Allergy ({summary.allergyConflictCount})
                </button>
              )}
              {summary.drugInteractionCount > 0 && (
                <button
                  onClick={() => setSelectedCategory('DRUG_DRUG_INTERACTION')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'DRUG_DRUG_INTERACTION'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Interactions ({summary.drugInteractionCount})
                </button>
              )}
              {summary.duplicateTherapyCount > 0 && (
                <button
                  onClick={() => setSelectedCategory('DUPLICATE_THERAPY')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'DUPLICATE_THERAPY'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  Duplicates ({summary.duplicateTherapyCount})
                </button>
              )}
              {summary.precautionCount > 0 && (
                <button
                  onClick={() => setSelectedCategory('PATIENT_PRECAUTION')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'PATIENT_PRECAUTION'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  Precautions ({summary.precautionCount})
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2C: NO ISSUES FOUND STATE */}
        {verifiedFindings.length === 0 ? (
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-emerald-950">
                No potential issues were identified by the checks completed.
              </h4>
              <p className="text-xs text-emerald-800 max-w-xl mx-auto leading-relaxed">
                This does not guarantee that the medication combination is safe. Some interactions or patient-specific risks may not be covered.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerified.map((finding) => (
              <div
                key={finding.id}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition-all space-y-4 shadow-2xs"
              >
                {/* Header row: title, category, severity */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {getCategoryLabel(finding.category)}
                      </span>
                      <span>•</span>
                      {getSeverityBadge(finding.severity)}
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      {finding.title}
                    </h4>
                  </div>

                  {/* Medication Tags with IDs for Transparency */}
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {finding.involvedMedicationDetails ? (
                      finding.involvedMedicationDetails.map((medDetail) => (
                        <span
                          key={medDetail.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs flex items-center space-x-1"
                        >
                          <Pill className="w-3 h-3 text-teal-600" />
                          <span>{medDetail.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({medDetail.id.slice(-6)})</span>
                        </span>
                      ))
                    ) : (
                      finding.involvedMedications.map((medName, mIdx) => (
                        <span
                          key={mIdx}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs flex items-center space-x-1"
                        >
                          <Pill className="w-3 h-3 text-teal-600" />
                          <span>{medName}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Verified Allergy Details Box */}
                {finding.allergyContext && (
                  <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-rose-900">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                      <span>Documented Allergy Match Details:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-rose-900 pt-0.5">
                      <div>
                        <span className="text-slate-500 block">Recorded Patient Allergy:</span>
                        <strong className="text-rose-950">{finding.allergyContext.recordedAllergyText}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Triggering Verified Active Ingredient:</span>
                        <strong className="text-rose-950">{finding.allergyContext.triggeringIngredient}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Duplicate Therapy Context Box */}
                {finding.duplicateContext && (
                  <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 text-xs text-purple-950 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-purple-900">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>Duplicate Therapy Verification Details:</span>
                    </div>
                    <div className="text-[11px] text-purple-900">
                      <div>
                        Standardized Active Ingredient: <strong>{finding.duplicateContext.standardizedIngredient}</strong>
                      </div>
                      {finding.duplicateContext.isSamePrescriptionRepeat && (
                        <div className="text-amber-800 font-semibold mt-1">
                          Note: Both entries originated from the same uploaded prescription order.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs mb-0.5">
                      Explanation:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {finding.explanation}
                    </p>
                  </div>

                  {/* Why it may matter */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">
                      Why it may matter (Clinical Significance):
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {finding.clinicalSignificance}
                    </p>
                  </div>

                  {/* Recommendation Note */}
                  <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 flex items-start space-x-2 text-sky-900">
                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[11px]">Recommended Next Step:</span>
                      <p className="text-xs text-sky-800">{finding.recommendationNote}</p>
                    </div>
                  </div>

                  {/* Documented Reference / Source with Verification Flag */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-200/60 mt-2">
                    <div className="flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">Source:</span>
                      <span className="italic">{finding.sourceReference}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {finding.isSourceVerified ? (
                        <span className="inline-flex items-center text-teal-700 font-semibold">
                          <FileCheck2 className="w-3 h-3 mr-0.5" />
                          Source Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-700 font-semibold">
                          <FileQuestion className="w-3 h-3 mr-0.5" />
                          Source Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2D: UNABLE TO VERIFY CHECKS */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Section D • Unable to Verify Checks ({unverifiedFindings.length})</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Checks Requiring Additional Information
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            When a safety check cannot be completed due to missing laboratory values, unrecorded demographics, or incomplete prescription labels, MEDiTWIN AI explicitly documents the gap rather than falsely claiming a clean or &quot;Safe&quot; status.
          </p>
        </div>

        {unverifiedFindings.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
            All evaluated checks had sufficient information to complete.
          </div>
        ) : (
          <div className="space-y-3">
            {unverifiedFindings.map((check) => (
              <div
                key={check.id}
                className="bg-amber-50/60 rounded-xl p-4 border border-amber-200 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-950 text-sm">{check.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                      Unable to Verify
                    </span>
                  </div>
                  {check.involvedMedications.length > 0 && (
                    <span className="text-[11px] font-semibold text-amber-900">
                      Medication: {check.involvedMedications.join(', ')}
                    </span>
                  )}
                </div>

                <p className="text-amber-900 leading-relaxed">
                  {check.explanation}
                </p>

                {check.missingInformation && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                    <span className="font-bold block text-[11px]">Information Missing:</span>
                    <span>{check.missingInformation}</span>
                  </div>
                )}

                <div className="text-[11px] text-amber-800 flex items-center justify-between pt-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold">Clinical Reason:</span>
                    <span>{check.clinicalSignificance}</span>
                  </div>
                  <span className="italic text-slate-500">{check.sourceReference}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
