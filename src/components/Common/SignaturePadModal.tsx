import React, { useRef, useState, useEffect } from 'react';
import { CustomerSignature } from '../../types';
import { PenTool, X, RotateCcw, Check, ShieldCheck } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  clientName: string;
  jobNumber: string;
  onClose: () => void;
  onSaveSignature: (signature: CustomerSignature) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  clientName,
  jobNumber,
  onClose,
  onSaveSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signeeName, setSigneeName] = useState(clientName || '');

  useEffect(() => {
    setSigneeName(clientName || '');
  }, [clientName]);

  // Set up canvas resolution
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a'; // Deep slate
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isOpen]);

  if (!isOpen) return null;

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature({
      dataUrl,
      signedBy: signeeName.trim() || clientName || 'Customer / Tenant',
      signedAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-[32px] sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Customer Sign-Off & Approval
              </h3>
              <p className="text-[11px] text-slate-500">
                Sign to confirm job completion for Job #{jobNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {/* Signee Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Signee Name (Client or Occupant) *
            </label>
            <input
              type="text"
              required
              value={signeeName}
              onChange={e => setSigneeName(e.target.value)}
              placeholder="Full name of person signing..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white outline-none"
            />
          </div>

          {/* Signature Canvas Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Draw Signature Below (Finger or Stylus)</span>
              </label>

              {hasSignature && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 cursor-crosshair touch-none bg-white"
              />

              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1 select-none">
                  <PenTool className="w-6 h-6 opacity-30" />
                  <span className="text-xs font-medium">Sign on the line above</span>
                </div>
              )}

              <div className="absolute bottom-6 left-6 right-6 border-b border-slate-200 pointer-events-none" />
            </div>
          </div>

          {/* Legal / Verification Disclaimer */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-start gap-2 text-[11px] text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              By signing, the customer confirms the handyman repair work for Job #{jobNumber} was inspected and completed satisfactorily.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!hasSignature || !signeeName.trim()}
            onClick={handleSave}
            className={`flex-2 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition ${
              hasSignature && signeeName.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Accept Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
