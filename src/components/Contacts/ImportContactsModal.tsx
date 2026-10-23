import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Building2,
  Home,
  UserCheck
} from 'lucide-react';
import {
  importContactsFromSpreadsheet,
  downloadContactsExcelTemplate
} from '../../services/excelDataService';
import { triggerHapticFeedback } from '../../services/nativeMobile';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    agents: number;
    tenants: number;
    owners: number;
    customers: number;
    total: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setErrorMessage('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setImportSummary(null);
    triggerHapticFeedback('light');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    triggerHapticFeedback('medium');

    try {
      const res = await importContactsFromSpreadsheet(file);
      if (res.totalImported === 0) {
        setErrorMessage('No valid contacts found in the uploaded file. Please ensure columns match the template.');
      } else {
        setImportSummary({
          agents: res.agentsImported,
          tenants: res.tenantsImported,
          owners: res.ownersImported,
          customers: res.customersImported,
          total: res.totalImported
        });
        triggerHapticFeedback('success');
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import contacts.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setErrorMessage(null);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] text-slate-900">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">Import Contacts (Excel / CSV)</h2>
              <p className="text-[11px] text-slate-500">Bulk upload agents, tenants, owners & clients</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Template Download Prompt */}
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-2 shadow-2xs">
            <div className="min-w-0">
              <span className="text-xs font-black text-blue-950 block">Need the standard spreadsheet format?</span>
              <span className="text-[11px] text-blue-700">Pre-formatted sheets for Agents, Tenants, Owners & Clients</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                downloadContactsExcelTemplate();
              }}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Success Summary */}
          {importSummary && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Successfully Imported {importSummary.total} Contacts!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-xl bg-white border border-emerald-200 text-center">
                  <div className="font-black text-purple-700 text-base">{importSummary.agents}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Agents</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200 text-center">
                  <div className="font-black text-blue-700 text-base">{importSummary.tenants}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Tenants</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200 text-center">
                  <div className="font-black text-emerald-700 text-base">{importSummary.owners}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Owners</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200 text-center">
                  <div className="font-black text-slate-700 text-base">{importSummary.customers}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Clients</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dropzone */}
          {!importSummary && (
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-600 mb-3">
                <Upload className="w-6 h-6 stroke-[2.2]" />
              </div>

              {file ? (
                <div>
                  <span className="font-black text-slate-900 text-sm block truncate max-w-xs">{file.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    {(file.size / 1024).toFixed(1)} KB • Ready to Import
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-black text-slate-800 text-sm block">Choose or drop Excel file here</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">Supports .xlsx, .xls and .csv</span>
                </div>
              )}
            </div>
          )}

          {/* Info Features */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
            <div className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Smart Import Features:</div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Auto-detects sheets: <strong>Real_Estate_Agents</strong>, <strong>Tenants</strong>, <strong>Owners</strong>, and <strong>Direct_Clients</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Uses phone number as primary key to prevent duplicate agents</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Preserves all phone formatting (AU mobile/landline)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
          >
            {importSummary ? 'Done' : 'Cancel'}
          </button>

          {!importSummary && (
            <button
              type="button"
              disabled={!file || isProcessing}
              onClick={handleExecuteImport}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Import Contacts</span>
                </>
              )}
            </button>
          )}

          {importSummary && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
            >
              Import Another File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
