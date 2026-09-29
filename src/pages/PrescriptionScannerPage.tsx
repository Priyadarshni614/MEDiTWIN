/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { prescriptionService } from '../services/prescriptionService';
import { Prescription, ExtractedMedicationItem } from '../models/types';
import { 
  ScanLine, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Check, 
  RefreshCw, 
  Stethoscope, 
  Calendar,
  Building2,
  FileEdit,
  Eye
} from 'lucide-react';

// Demonstration prescriptions stored locally with real clinical orders for multimodal OCR testing
const DEMO_PRESCRIPTIONS = [
  {
    name: 'Metropolitan Geriatric Clinic Rx',
    path: '/samples/rx_geriatric_polypharmacy.png',
    description: 'Dr. Joel Steve Rx containing Metformin 500mg, Lisinopril 10mg, Atorvastatin 20mg.',
  },
  {
    name: 'St. Jude Outpatient Consultation Slip',
    path: '/samples/rx_clinical_consultation.png',
    description: 'Dr. Robert Smith Rx containing Amoxicillin + Clavulanic acid 500/125mg, Paracetamol 500mg.',
  },
];

export const PrescriptionScannerPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();

  // Upload & processing state
  const [selectedFile, setSelectedFile] = useState<{ fileName: string; imageUrl: string; mimeType: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'uploading' | 'analyzing' | 'structuring'>('analyzing');
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedMedicationItem[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [failureError, setFailureError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle user uploaded image file with client-side canvas optimization if needed
   */
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;

      // Optimize oversized images (> 1600px) on client canvas to prevent payload limits
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedUrl = canvas.toDataURL('image/jpeg', 0.92);
            setSelectedFile({
              fileName: file.name,
              imageUrl: optimizedUrl,
              mimeType: 'image/jpeg',
            });
            setFailureError(null);
            setCurrentPrescription(null);
            return;
          }
        }

        setSelectedFile({
          fileName: file.name,
          imageUrl: rawDataUrl,
          mimeType: file.type || 'image/jpeg',
        });
        setFailureError(null);
        setCurrentPrescription(null);
      };

      img.onerror = () => {
        setSelectedFile({
          fileName: file.name,
          imageUrl: rawDataUrl,
          mimeType: file.type || 'image/jpeg',
        });
        setFailureError(null);
        setCurrentPrescription(null);
      };

      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  /**
   * Load real demonstration prescription image as base64 data URL
   */
  const handleDemoSelect = async (sample: typeof DEMO_PRESCRIPTIONS[0]) => {
    try {
      const res = await fetch(sample.path);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile({
          fileName: `${sample.name}.png`,
          imageUrl: reader.result as string,
          mimeType: 'image/png',
        });
        setFailureError(null);
        setCurrentPrescription(null);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load demo prescription:', err);
    }
  };

  /**
   * Send actual image to multimodal Gemini OCR and process response
   */
  const handleProcessImage = async () => {
    if (!user || !selectedFile) return;

    setIsProcessing(true);
    setProcessingStage('uploading');
    setFailureError(null);

    const timer1 = setTimeout(() => setProcessingStage('analyzing'), 600);
    const timer2 = setTimeout(() => setProcessingStage('structuring'), 1800);

    try {
      const result = await prescriptionService.uploadAndProcess(user.id, selectedFile);

      if (
        result.extractionStatus === 'COMPLETED' &&
        Array.isArray(result.extractedMedications) &&
        result.extractedMedications.length > 0
      ) {
        // Successful extraction with at least one medication found
        setCurrentPrescription(result);
        setExtractedItems(result.extractedMedications);
        setDoctorName(result.doctorName || '');
        setClinicName(result.clinicName || '');
        setPrescriptionDate(result.prescriptionDate || new Date().toISOString().split('T')[0]);
        setFailureError(null);
      } else {
        // Extraction failed or returned 0 medications - DO NOT display review screen with 0 meds
        setCurrentPrescription(null);
        const errMsg =
          result.errorMessage ||
          'No legible medication orders could be extracted from this prescription. Please verify the image is clearly lit and legible, or enter medications manually.';
        setFailureError(errMsg);
        console.error('Prescription extraction failed:', errMsg);
      }
    } catch (err: any) {
      setCurrentPrescription(null);
      const errMsg = err?.message || 'Failed to extract medications from prescription image.';
      setFailureError(errMsg);
      console.error('Prescription extraction failed:', err);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
    }
  };

  /**
   * Allow user to transition directly to manual entry for the uploaded prescription document
   */
  const handleStartManualEntry = () => {
    if (!user || !selectedFile) return;

    const manualPrescription: Prescription = {
      id: `manual_rx_${Date.now()}`,
      patientId: user.id,
      fileName: selectedFile.fileName,
      imageUrl: selectedFile.imageUrl,
      uploadedAt: new Date().toISOString(),
      prescriptionDate: new Date().toISOString().split('T')[0],
      doctorName: '',
      extractedMedications: [],
      extractionStatus: 'COMPLETED',
      verificationStatus: 'NOT_REVIEWED',
    };

    setCurrentPrescription(manualPrescription);
    setDoctorName('');
    setClinicName('');
    setPrescriptionDate(new Date().toISOString().split('T')[0]);
    setFailureError(null);

    // Seed one empty medication row for easy entry
    setExtractedItems([
      {
        id: `manual_item_${Date.now()}`,
        name: '',
        strength: '',
        dosage: '1 tablet',
        dosageUnit: 'tablet',
        frequency: 'Once daily',
        route: 'Oral',
        duration: 'Ongoing',
        confidence: 'High',
        selected: true,
      },
    ]);
  };

  // Item verification handlers
  const handleItemChange = (idx: number, field: keyof ExtractedMedicationItem, value: any) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleToggleSelect = (idx: number) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], selected: !updated[idx].selected };
      return updated;
    });
  };

  const handleDeleteItem = (idx: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddManualItem = () => {
    const newItem: ExtractedMedicationItem = {
      id: `manual_${Date.now()}`,
      name: '',
      strength: '',
      dosage: '1 tablet',
      dosageUnit: 'tablet',
      frequency: 'Once daily',
      route: 'Oral',
      duration: 'Ongoing',
      confidence: 'High',
      selected: true,
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  // Check how many valid, named, selected items exist
  const selectedValidItems = extractedItems.filter(
    (item) => item.selected && typeof item.name === 'string' && item.name.trim().length > 0
  );
  const canConfirm = selectedValidItems.length > 0;

  const handleConfirmAndAdd = async () => {
    if (!user || !currentPrescription || !canConfirm) return;

    setIsSaving(true);
    try {
      await prescriptionService.confirmAndAddToTwin(
        user.id,
        currentPrescription.id,
        extractedItems,
        doctorName,
        prescriptionDate
      );

      setSuccessMessage(
        `Successfully added ${selectedValidItems.length} medication(s) to your Personalized Digital Medication Twin!`
      );
      setTimeout(() => {
        navigate('/patient/twin');
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to confirm medications.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/patient/twin')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Medication Twin</span>
          </button>
          <span className="text-xs text-slate-400 font-mono">
            Optical Prescription Parsing Engine
          </span>
        </div>

        {/* Page Title */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
            <span>Multimodal Vision OCR &amp; Structured Extraction</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Prescription Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Upload your prescription document, clinical order, or medication label. MEDiTWIN AI analyzes the image with multimodal Gemini vision to extract drug names, dosages, and administration schedules for patient verification.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-3 text-xs text-emerald-900 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="font-bold">{successMessage} Redirecting to your Medication Twin...</div>
          </div>
        )}

        {/* STEP 1: UPLOAD AREA (Visible when not actively reviewing an extracted prescription) */}
        {!currentPrescription && (
          <div className="space-y-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`bg-white rounded-2xl p-8 border-2 border-dashed transition-all text-center ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                    <img
                      src={selectedFile.imageUrl}
                      alt="Prescription preview"
                      className="w-full h-full object-contain bg-slate-900/5"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{selectedFile.fileName}</h3>
                    <p className="text-[11px] text-slate-500">Document ready for clinical multimodal extraction</p>
                  </div>

                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => {
                        setSelectedFile(null);
                        setFailureError(null);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Clear
                    </button>
                    <button
                      id="scanner-process-btn"
                      disabled={isProcessing}
                      onClick={handleProcessImage}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>
                            {processingStage === 'uploading' && 'Preparing image bytes...'}
                            {processingStage === 'analyzing' && 'Analyzing image with Gemini Vision...'}
                            {processingStage === 'structuring' && 'Structuring medication objects...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Analyze &amp; Extract Medications</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Upload Prescription Document
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag &amp; drop your prescription image here, or browse files from your computer or camera.
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Select Image File
                  </button>
                  <p className="text-[10px] text-slate-400">
                    Supports JPG, PNG, WEBP (Max 25 MB)
                  </p>
                </div>
              )}
            </div>

            {/* Quick Demo Prescription Samples */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Test With Sample Prescription Slips
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Click any sample below to load a real prescription slip and test multimodal vision OCR extraction:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_PRESCRIPTIONS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDemoSelect(sample)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                        {sample.name}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Load Sample
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{sample.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Actionable Failure State Banner */}
            {failureError && (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-start space-x-3 text-xs text-rose-800">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-900">
                      Prescription Extraction Inconclusive (0 medications detected)
                    </h4>
                    <p className="mt-1 leading-relaxed text-rose-700">{failureError}</p>
                    <p className="mt-1 text-[11px] text-rose-600">
                      Possible causes: faint physician handwriting, blurred photo, or the image does not contain readable clinical medication orders.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {selectedFile && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleProcessImage}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>Retry Extraction</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFailureError(null);
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                  >
                    Upload Different Image
                  </button>
                  <button
                    type="button"
                    onClick={handleStartManualEntry}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Enter Medications Manually for this Image</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: OCR VERIFICATION SCREEN (Only rendered when there is a valid prescription being reviewed) */}
        {currentPrescription && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Required Verification Notice Banner */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-xs text-amber-950 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-900">
                  Patient Clinical Verification Required
                </h4>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Please verify the extracted information before adding it to your Medication Twin. You can edit any dosages, uncheck medications you do not wish to include, or add any items that were omitted.
                </p>
              </div>
            </div>

            {/* Document Header & Prescriber Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Extracted Prescription Details
                </span>
                <span className="text-[11px] text-slate-400">
                  Document: {currentPrescription.fileName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prescribing Doctor
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Robert Smith, MD"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinic / Medical Center
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="e.g. St. Jude Outpatient Clinic"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prescription Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={prescriptionDate}
                      onChange={(e) => setPrescriptionDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted Medications List & Editing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Extracted Medications ({extractedItems.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedValidItems.length} selected for synchronization with your Medication Twin
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddManualItem}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Missing Medication</span>
                </button>
              </div>

              {extractedItems.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                  <p className="text-xs text-slate-500">No medications currently listed.</p>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add Medication Manually
                  </button>
                </div>
              ) : (
                extractedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`bg-white rounded-2xl p-5 border transition-all ${
                      item.selected
                        ? 'border-indigo-200 shadow-xs'
                        : 'border-slate-200 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Top Bar: Selection Checkbox & Confidence Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSelect(idx)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Include in Medication Twin
                        </span>
                      </label>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.confidence === 'High'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.confidence === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {item.confidence || 'High'} Confidence OCR
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Unclear Handwriting Notice if applicable */}
                    {(item.isUnclear || item.confidence === 'Low') && (
                      <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-[11px] text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {item.unclearReason || 'Handwriting or dosage was ambiguous in the image. Please verify before adding.'}
                        </span>
                      </div>
                    )}

                    {/* Editable Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Amoxicillin + Clavulanic acid"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Generic Name
                        </label>
                        <input
                          type="text"
                          value={item.genericName || ''}
                          onChange={(e) => handleItemChange(idx, 'genericName', e.target.value)}
                          placeholder="e.g. Amoxicillin"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Strength
                        </label>
                        <input
                          type="text"
                          value={item.strength || ''}
                          onChange={(e) => handleItemChange(idx, 'strength', e.target.value)}
                          placeholder="e.g. 500/125 mg"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={item.dosage || ''}
                          onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 1 tablet"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Frequency
                        </label>
                        <input
                          type="text"
                          value={item.frequency || ''}
                          onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                          placeholder="e.g. Every 8 hours with food"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Route
                        </label>
                        <input
                          type="text"
                          value={item.route || ''}
                          onChange={(e) => handleItemChange(idx, 'route', e.target.value)}
                          placeholder="e.g. Oral"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={item.duration || ''}
                          onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                          placeholder="e.g. 7 days"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Purpose / Indication
                        </label>
                        <input
                          type="text"
                          value={item.purpose || ''}
                          onChange={(e) => handleItemChange(idx, 'purpose', e.target.value)}
                          placeholder="e.g. Bacterial infection"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Confirmation Action Bar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentPrescription(null);
                  setSelectedFile(null);
                  setFailureError(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel / Re-upload
              </button>

              <div className="flex flex-col sm:items-end w-full sm:w-auto">
                <button
                  id="scanner-confirm-btn"
                  disabled={isSaving || !canConfirm}
                  onClick={handleConfirmAndAdd}
                  title={!canConfirm ? 'Please select or add at least one medication with a valid name to confirm.' : undefined}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 ${
                    canConfirm && !isSaving
                      ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? 'Synchronizing with Twin...'
                      : `Confirm & Add (${selectedValidItems.length}) to Medication Twin`}
                  </span>
                </button>
                {!canConfirm && (
                  <span className="text-[11px] text-amber-600 mt-1">
                    Select at least one verified medication with a valid name before adding.
                  </span>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
