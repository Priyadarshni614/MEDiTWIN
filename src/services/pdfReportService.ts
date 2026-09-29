/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { PatientProfile, Medication, DoctorPatientRelationship } from '../models/types';
import { MedicationSafetyReport } from '../models/safetyTypes';

export interface ReportGenerationOptions {
  patient: PatientProfile;
  medications: Medication[];
  safetyReport?: MedicationSafetyReport | null;
  relationship?: DoctorPatientRelationship | null;
  reportTitle?: string;
}

export class PdfReportService {
  /**
   * Generates a clean, professional, multi-page clinical PDF report.
   */
  generateMedicationReport(options: ReportGenerationOptions): jsPDF {
    const { patient, medications, safetyReport, relationship, reportTitle } = options;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const reportId = `RPT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const generatedDateStr = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Helper: Check page overflow and add new page
    const ensureSpace = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 18) {
        doc.addPage();
        y = margin;
        renderPageHeader();
      }
    };

    // Helper: Draw header banner on subsequent pages
    const renderPageHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('MEDiTWIN AI — OFFICIAL CLINICAL MEDICATION REPORT', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient: ${patient.fullName || 'Not provided'} | ID: ${patient.connectionCode || 'PT-ID'}`, pageWidth - margin, y, { align: 'right' });
      y += 4;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    // ----------------------------------------------------
    // PAGE 1: TITLE & COVER HEADER
    // ----------------------------------------------------
    // Top Accent Bar
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(margin, y, contentWidth, 2, 'F');
    y += 6;

    // Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(reportTitle || 'Official Medication Twin & Safety Report', margin, y);
    y += 5;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Personalized Pharmacological Profile & Verified Multi-Drug Safety Analysis', margin, y);
    y += 5;

    // Meta Badge Block (Date, Report ID, Confidentiality)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Report ID: ${reportId}`, margin + 4, y + 5);
    doc.text(`Generated: ${generatedDateStr}`, margin + 65, y + 5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('CONFIDENTIAL MEDICAL RECORD', pageWidth - margin - 4, y + 5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Synthesized directly from verified patient profile and active Medication Twin records.', margin + 4, y + 9);
    y += 16;

    // ----------------------------------------------------
    // SECTION 1: PATIENT PROFILE & DEMOGRAPHICS
    // ----------------------------------------------------
    ensureSpace(32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Patient Demographic & Clinical Factors', margin, y);
    y += 4;

    // Patient info card box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

    const col1 = margin + 4;
    const col2 = margin + 65;
    const col3 = margin + 125;
    let cardY = y + 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('PATIENT FULL NAME', col1, cardY);
    doc.text('AGE / GENDER', col2, cardY);
    doc.text('WEIGHT', col3, cardY);
    cardY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(patient.fullName || 'Not provided', col1, cardY);
    const ageGender = `${patient.age ? `${patient.age} yrs` : 'Not provided'} / ${patient.gender ? patient.gender.toUpperCase() : 'Not provided'}`;
    doc.text(ageGender, col2, cardY);
    doc.text(patient.weight || 'Not provided', col3, cardY);
    cardY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('CONNECTION CODE', col1, cardY);
    doc.text('BLOOD TYPE', col2, cardY);
    doc.text('EMERGENCY CONTACT', col3, cardY);
    cardY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(patient.connectionCode || 'Not provided', col1, cardY);
    doc.text('Not provided', col2, cardY); // blood type not in model
    const emContact = patient.emergencyContact?.name
      ? `${patient.emergencyContact.name} (${patient.emergencyContact.phone || 'No phone'})`
      : 'Not provided';
    doc.text(emContact, col3, cardY);

    y += 28;

    // ----------------------------------------------------
    // SECTION 2: ALLERGIES & CHRONIC CONDITIONS
    // ----------------------------------------------------
    ensureSpace(26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Documented Allergies & Chronic Conditions', margin, y);
    y += 4;

    const allergies = Array.isArray(patient.allergies) && patient.allergies.length > 0 ? patient.allergies : [];
    const conditions = Array.isArray(patient.chronicConditions) && patient.chronicConditions.length > 0 ? patient.chronicConditions : [];

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    // Left: Allergies
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28); // rose-700
    doc.text('RECORDED MEDICATION ALLERGIES:', margin + 4, y + 5);
    doc.setFont('helvetica', allergies.length ? 'bold' : 'normal');
    doc.setTextColor(allergies.length ? 153 : 100, allergies.length ? 27 : 116, allergies.length ? 27 : 139);
    doc.text(allergies.length ? allergies.join(', ') : 'No documented medication allergies', margin + 4, y + 10);

    // Right: Conditions
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('RECORDED CHRONIC CONDITIONS:', margin + 95, y + 5);
    doc.setFont('helvetica', conditions.length ? 'bold' : 'normal');
    doc.setTextColor(conditions.length ? 15 : 100, conditions.length ? 23 : 116, conditions.length ? 42 : 139);
    doc.text(conditions.length ? conditions.join(', ') : 'No chronic conditions recorded', margin + 95, y + 10);

    y += 22;

    // ----------------------------------------------------
    // SECTION 3: CARE TEAM / AUTHORIZED PHYSICIAN
    // ----------------------------------------------------
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Authorized Clinical Care Team', margin, y);
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    if (relationship && relationship.status === 'ACTIVE') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 148, 136); // teal-600
      doc.text(`Active Provider: Dr. ${relationship.doctorName} (${relationship.doctorRole})`, margin + 4, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Organization: ${relationship.doctorOrganization || 'Clinical Practice'} | Authorized: ${new Date(relationship.authorizedAt || relationship.createdAt).toLocaleDateString()}`, margin + 4, y + 8.5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('No active healthcare provider authorized at time of report generation.', margin + 4, y + 6.5);
    }
    y += 15;

    // ----------------------------------------------------
    // SECTION 4: ACTIVE MEDICATION TWIN LIST
    // ----------------------------------------------------
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`4. Current Active Medication Twin List (${medications.length} Drugs)`, margin, y);
    y += 4;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Official active medications recorded in patient’s profile. Excludes temporary What-If simulation scenarios.', margin, y);
    y += 4;

    if (medications.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('No active medications currently registered in this patient’s Medication Twin.', margin + 4, y + 7);
      y += 16;
    } else {
      // Table Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('#', margin + 2, y + 4.2);
      doc.text('Medication & Brand Name', margin + 8, y + 4.2);
      doc.text('Strength / Dose', margin + 65, y + 4.2);
      doc.text('Frequency & Route', margin + 105, y + 4.2);
      doc.text('Prescriber / Source', margin + 145, y + 4.2);
      y += 6;

      medications.forEach((med, idx) => {
        ensureSpace(10);
        const rowBg = idx % 2 === 0 ? 255 : 248;
        doc.setFillColor(rowBg, rowBg, idx % 2 === 0 ? 255 : 252);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 8, pageWidth - margin, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(String(idx + 1), margin + 2, y + 5);

        // Name
        const medTitle = med.brandName ? `${med.name} (${med.brandName})` : med.name;
        doc.text(medTitle.substring(0, 35), margin + 8, y + 5);

        // Strength / Dose
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const strengthDose = `${med.strength || 'Not provided'} / ${med.dosage || 'Not provided'}`;
        doc.text(strengthDose.substring(0, 24), margin + 65, y + 5);

        // Frequency & Route
        const freqRoute = `${med.frequency || 'Not provided'} • ${med.route || 'Not provided'}`;
        doc.text(freqRoute.substring(0, 25), margin + 105, y + 5);

        // Prescriber
        const prescriber = med.prescribedBy || (med.source === 'PRESCRIPTION_OCR' ? 'Prescription OCR' : 'Patient Recorded');
        doc.text(prescriber.substring(0, 20), margin + 145, y + 5);

        y += 8;
      });
      y += 6;
    }

    // ----------------------------------------------------
    // SECTION 5: SAFETY ANALYSIS FINDINGS (PHASE 4)
    // ----------------------------------------------------
    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Verified Medication Safety Findings (Phase 4 Analysis)', margin, y);
    y += 4;

    const findings = safetyReport?.findings || [];
    const verifiedFindings = findings.filter((f) => f.verificationState === 'VERIFIED');
    const unverifiedChecks = findings.filter((f) => f.verificationState === 'UNABLE_TO_VERIFY');

    // Score & Summary Bar
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const scoreText = safetyReport?.scoreBreakdown?.isCalculable
      ? `Prototype Score: ${safetyReport.scoreBreakdown.score}/100 (${safetyReport.scoreBreakdown.ratingLabel || 'Evaluated'})`
      : 'Prototype Score: Unavailable';
    doc.text(scoreText, margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Verified Clinical Findings: ${verifiedFindings.length} | Incomplete / Unverified Checks: ${unverifiedChecks.length}`, margin + 4, y + 9);
    doc.text(`Analysis Date: ${safetyReport?.analyzedAt ? new Date(safetyReport.analyzedAt).toLocaleDateString() : 'Not conducted'}`, pageWidth - margin - 4, y + 7, { align: 'right' });
    y += 16;

    if (verifiedFindings.length === 0) {
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text('No verified clinical contraindications or high-risk interactions identified.', margin + 4, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Absence of flagged interactions does not guarantee absolute safety. Always confirm with your clinician.', margin + 4, y + 9.5);
      y += 16;
    } else {
      verifiedFindings.forEach((finding, idx) => {
        ensureSpace(24);

        // Finding card
        const isContra = finding.severity === 'contraindicated';
        const isHigh = finding.severity === 'high';
        const cardBg = isContra ? [254, 242, 242] : isHigh ? [255, 247, 237] : [248, 250, 252];
        const cardBorder = isContra ? [254, 202, 202] : isHigh ? [254, 215, 170] : [226, 232, 240];

        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
        doc.setLineWidth(0.3);

        const cardStartY = y;
        // Estimate height
        const explLines = doc.splitTextToSize(finding.explanation || 'No detailed explanation provided.', contentWidth - 8);
        const signLines = doc.splitTextToSize(`Clinical Significance: ${finding.clinicalSignificance || 'Clinical caution indicated.'}`, contentWidth - 8);
        const recLines = doc.splitTextToSize(`Guidance: ${finding.recommendationNote || 'Discuss with doctor or pharmacist.'}`, contentWidth - 8);
        
        const cardHeight = 16 + (explLines.length * 3.5) + (signLines.length * 3.5) + (recLines.length * 3.5) + 6;
        ensureSpace(cardHeight + 4);

        doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'FD');
        let itemY = y + 4.5;

        // Title and severity badge
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(isContra ? 153 : isHigh ? 194 : 30, isContra ? 27 : isHigh ? 65 : 41, isContra ? 27 : isHigh ? 12 : 59);
        doc.text(`[${(finding.severity || 'CAUTION').toUpperCase()}] ${finding.title}`, margin + 4, itemY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Category: ${finding.category}`, pageWidth - margin - 4, itemY, { align: 'right' });
        itemY += 4.5;

        // Involved Medications
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Involved: ${(finding.involvedMedications || []).join(' + ')}`, margin + 4, itemY);
        itemY += 4;

        // Explanation
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(explLines, margin + 4, itemY);
        itemY += explLines.length * 3.5;

        // Clinical Significance
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(signLines, margin + 4, itemY);
        itemY += signLines.length * 3.5;

        // Recommendation
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(recLines, margin + 4, itemY);
        itemY += recLines.length * 3.5;

        // Source Reference (Only source references actually stored with the findings)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Evidence Source: ${finding.sourceReference || 'Clinical Knowledge Reference'}`, margin + 4, itemY + 1);

        y += cardHeight + 4;
      });
    }

    // ----------------------------------------------------
    // SECTION 6: UNVERIFIED CHECKS NOTE (if any)
    // ----------------------------------------------------
    if (unverifiedChecks.length > 0) {
      ensureSpace(16);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Information Gap Notice: ${unverifiedChecks.length} safety check(s) could not be verified`, margin + 4, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Certain drug interaction and dosing rules require verified active ingredient, organ function, or duration records. Do not assume unverified items are risk-free.', margin + 4, y + 8.5);
      y += 16;
    }

    // ----------------------------------------------------
    // SECTION 7: OFFICIAL CLINICAL & LEGAL DISCLAIMER
    // ----------------------------------------------------
    ensureSpace(28);
    doc.setFillColor(254, 252, 232); // yellow-50
    doc.setDrawColor(254, 240, 138); // yellow-200
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(133, 77, 14); // yellow-800
    doc.text('IMPORTANT CLINICAL & LEGAL ADVISORY', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 63, 18);
    const disclaimerLines = doc.splitTextToSize(
      'This report is an informational compilation generated by MEDiTWIN AI based solely on patient-provided records, optical prescription extractions, and documented clinical knowledge rules. It is NOT a medical prescription, medical order, or clinical recommendation. It does not replace the professional clinical judgment of a licensed physician, clinical pharmacist, or healthcare provider. Healthcare professionals must independently evaluate all medications, dosages, and contraindications prior to administering treatment. Temporary What-If simulation scenarios are excluded from this official record.',
      contentWidth - 8
    );
    doc.text(disclaimerLines, margin + 4, y + 9);
    y += 28;

    // ----------------------------------------------------
    // FOOTER ON ALL PAGES
    // ----------------------------------------------------
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('MEDiTWIN AI • Personalized Medication Safety Intelligence • Confidential Document', margin, pageHeight - 8);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    return doc;
  }
}

export const pdfReportService = new PdfReportService();
