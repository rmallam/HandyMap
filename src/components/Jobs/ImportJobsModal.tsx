import React, { useState, useRef } from 'react';
import { Job } from '../../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Tag,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  parseSpreadsheetFile,
  downloadSampleExcelTemplate,
  downloadSampleCsvTemplate
} from '../../services/excelImporter';

interface ImportJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportJobs: (newJobs: Job[]) => Promise<void> | void;
}

export const ImportJobsModal: React.FC<ImportJobsModalProps> = ({
  isOpen,
  onClose,
  onImportJobs
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedJobs, setParsedJobs] = useState<Job[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    // Check file extension
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setErrorMessage('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setIsParsing(true);

    try {
      const result = await parseSpreadsheetFile(selectedFile);
      setParsedJobs(result.jobs);
      if (result.jobs.length === 0) {
        setErrorMessage('No valid jobs found in the uploaded file.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse file.');
      setParsedJobs([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePreviewRow = (index: number) => {
    setParsedJobs(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (parsedJobs.length === 0) return;
    setIsImporting(true);
    try {
      await onImportJobs(parsedJobs);
      setSuccessCount(parsedJobs.length);
      setTimeout(() => {
        setSuccessCount(null);
        setFile(null);
        setParsedJobs([]);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving imported jobs.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedJobs([]);
    setErrorMessage(null);
    setSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[32px] sm:rounded-3xl max-w-3xl w-full shadow-2xl border-t sm:border border-slate-200/90 overflow-hidden max-h-[92dvh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Import Jobs from Excel / CSV</span>
                <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                  .xlsx / .csv
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Bulk upload existing leads, agency work orders, and service jobs into HandyMap.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-900">
          {/* Success Banner */}
          {successCount !== null && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-in zoom-in-95">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Successfully Imported {successCount} Jobs!</h4>
                <p className="text-xs text-emerald-700">
                  All records have been saved to your database and synced to the interactive map.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Upload Area & Template Downloads */}
          {!file && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Upload className="w-7 h-7 stroke-[2]" />
                </div>

                <h3 className="text-sm font-bold text-slate-800">
                  Click to browse or drag & drop spreadsheet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports Microsoft Excel (<strong className="text-slate-700">.xlsx, .xls</strong>) and CSV (<strong className="text-slate-700">.csv</strong>) files with custom headers.
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 text-[11px] font-semibold text-slate-700">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Auto-detects addresses, suburbs & real estate agencies</span>
                </div>
              </div>

              {/* Sample Templates Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download Ready-Made Spreadsheet Templates</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Includes sample Australian handyman work orders with real estate agency fields.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleCsvTemplate}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isParsing && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">Analyzing spreadsheet and mapping columns...</p>
            </div>
          )}

          {/* Preview Table of Parsed Jobs */}
          {file && !isParsing && parsedJobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                    {parsedJobs.length}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Previewing Imported Jobs
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      From file: <strong className="text-slate-700">{file.name}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                >
                  Choose different file
                </button>
              </div>

              {/* Scrollable Preview List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
                {parsedJobs.map((job, idx) => (
                  <div key={job.id} className="p-3 hover:bg-slate-50 transition flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                          {job.jobNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 line-clamp-1">{job.title}</h4>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          job.status === 'urgent'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : job.status === 'in_progress'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{job.address} ({job.suburb})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{job.category}</span>
                        </div>
                        {job.clientName && (
                          <div className="text-slate-500">
                            Client: <strong className="text-slate-700">{job.clientName}</strong>
                          </div>
                        )}
                        {job.clientPhone && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{job.clientPhone}</span>
                          </div>
                        )}
                      </div>

                      {job.isAgencyJob && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md w-fit">
                          <Building2 className="w-3 h-3 text-purple-600" />
                          <span>Agency: {job.realEstateAgency}</span>
                          {job.workOrderNumber && <span>({job.workOrderNumber})</span>}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePreviewRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove row from import"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedJobs.length === 0 || isImporting}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing {parsedJobs.length} Jobs...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Import {parsedJobs.length} Jobs to HandyMap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
