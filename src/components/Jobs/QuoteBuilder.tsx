import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Job, JobQuote, QuoteItem, HandymanProfile } from '../../types';
import { formatCurrency, buildWhatsAppQuoteText, buildWhatsAppLink } from '../../utils/helpers';
import { generateQuotePDF } from '../../services/pdfGenerator';
import {
  Plus,
  Trash2,
  Download,
  Check,
  Send,
  PenTool,
  RotateCcw,
  Layers,
  FileCheck2,
  MessageSquare,
  Building2,
  CreditCard
} from 'lucide-react';

interface QuoteBuilderProps {
  job: Job;
  profile: HandymanProfile;
  onUpdateJob: (updatedJob: Job) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  job,
  profile,
  onUpdateJob
}) => {
  // Existing quote or default template
  const initialQuote: JobQuote = job.quote || {
    id: `q-${Date.now()}`,
    quoteNumber: `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
    hourlyLaborRate: profile.defaultHourlyRate,
    estimatedLaborHours: Math.max(1, Math.round((job.estimatedDurationMinutes || 60) / 60 * 10) / 10),
    taxRatePercent: profile.taxRatePercent,
    discountAmount: 0,
    items: [
      {
        id: `qi-1`,
        type: 'labor',
        description: `${job.title} - Scope & Installation`,
        quantity: 1,
        unitPrice: profile.defaultHourlyRate * Math.max(1, Math.round((job.estimatedDurationMinutes || 60) / 60)),
        total: profile.defaultHourlyRate * Math.max(1, Math.round((job.estimatedDurationMinutes || 60) / 60))
      }
    ],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    notes: 'Estimate valid for 14 days. Work begins upon acceptance.',
    status: 'draft'
  };

  const [quote, setQuote] = useState<JobQuote>(initialQuote);
  const [signeeName, setSigneeName] = useState(quote.clientSignatureName || job.clientName);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!quote.clientSignature);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Recalculate totals whenever items, tax, or discount change
  useEffect(() => {
    const subtotal = quote.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = (subtotal * (quote.taxRatePercent / 100));
    const totalAmount = Math.max(0, subtotal + taxAmount - (quote.discountAmount || 0));

    setQuote(prev => ({
      ...prev,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    }));
  }, [quote.items, quote.taxRatePercent, quote.discountAmount]);

  // Handle WhatsApp 1-Click Quote Send
  const handleSendWhatsAppQuote = () => {
    const message = buildWhatsAppQuoteText(
      { ...job, quote },
      profile
    );
    const phoneToUse = job.isAgencyJob && job.realEstateAgentPhone ? job.realEstateAgentPhone : job.clientPhone;
    const url = buildWhatsAppLink(phoneToUse, message);
    window.open(url, '_blank');
  };

  // Handle canvas drawing for on-site signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e40af'; // Crisp navy ink
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
    setQuote(prev => ({
      ...prev,
      clientSignature: undefined,
      clientSignatureName: undefined,
      signedAt: undefined
    }));
  };

  // Add Line Item
  const handleAddItem = (type: 'labor' | 'material' | 'fee') => {
    const newItem: QuoteItem = {
      id: `qi-${Date.now()}`,
      type,
      description: type === 'labor' ? 'Additional Labor' : type === 'material' ? 'Materials & Parts' : 'Travel / Disposal Fee',
      quantity: 1,
      unitPrice: type === 'labor' ? profile.defaultHourlyRate : 25,
      total: type === 'labor' ? profile.defaultHourlyRate : 25
    };

    setQuote(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Update item field
  const handleUpdateItem = (id: string, updates: Partial<QuoteItem>) => {
    setQuote(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.total = Math.round((updated.quantity * updated.unitPrice) * 100) / 100;
        return updated;
      })
    }));
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setQuote(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Save changes
  const saveQuoteChanges = (newStatus?: 'draft' | 'sent' | 'accepted' | 'declined', jobStatusUpdate?: any) => {
    let sigUrl = quote.clientSignature;
    if (hasSignature && canvasRef.current) {
      sigUrl = canvasRef.current.toDataURL('image/png');
    }

    const updatedQuote: JobQuote = {
      ...quote,
      status: newStatus || quote.status,
      clientSignature: sigUrl,
      clientSignatureName: signeeName,
      signedAt: newStatus === 'accepted' ? new Date().toISOString() : quote.signedAt
    };

    const updatedJob: Job = {
      ...job,
      status: jobStatusUpdate || (newStatus === 'accepted' ? 'in_progress' : newStatus === 'sent' ? 'quoted' : job.status),
      quote: updatedQuote,
      updatedAt: new Date().toISOString()
    };

    onUpdateJob(updatedJob);
    setQuote(updatedQuote);
  };

  // Handle Accept with celebration
  const handleAcceptQuote = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    saveQuoteChanges('accepted', 'in_progress');
  };

  return (
    <div className="flex flex-col gap-6 text-slate-900">
      {/* Handyman Business Banner & ABN Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 border border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm text-white">{profile.businessName}</h4>
              {profile.abn && (
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md">
                  ABN: {profile.abn}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {profile.name} • Rate: {formatCurrency(profile.defaultHourlyRate, profile.currencySymbol)}/hr • GST: {profile.taxRatePercent}%
            </p>
          </div>
        </div>

        {/* WhatsApp & PDF Direct Action Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSendWhatsAppQuote}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            title="Send formatted itemized quote on WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
            <span>Send WhatsApp Quote</span>
          </button>

          <button
            onClick={() => generateQuotePDF(job, profile)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition border border-white/20 shadow-sm active:scale-95"
            title="Export clean PDF with ABN and bank deposit details"
          >
            <Download className="w-3.5 h-3.5 text-blue-300" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Quote Status & Meta Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 text-sm">
              {quote.quoteNumber}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                quote.status === 'accepted'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : quote.status === 'sent'
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {quote.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Client: <strong className="text-slate-700">{job.clientName}</strong> • {job.address}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {quote.status !== 'accepted' && (
            <button
              onClick={handleAcceptQuote}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Start</span>
            </button>
          )}
        </div>
      </div>


      {/* Itemized Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Line Items & Scope Breakdown
          </h3>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAddItem('labor')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" /> Labor
            </button>
            <button
              onClick={() => handleAddItem('material')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" /> Material
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex flex-col gap-2.5">
          {quote.items.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  {index + 1}
                </span>

                <select
                  value={item.type}
                  onChange={e => handleUpdateItem(item.id, { type: e.target.value as any })}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs font-semibold uppercase shrink-0 shadow-sm"
                >
                  <option value="labor">Labor</option>
                  <option value="material">Material</option>
                  <option value="fee">Fee</option>
                </select>

                <input
                  type="text"
                  value={item.description}
                  onChange={e => handleUpdateItem(item.id, { description: e.target.value })}
                  placeholder="Item description..."
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 flex-1 min-w-[140px] focus:border-blue-500 outline-none shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={item.quantity}
                    onChange={e => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center text-slate-900 font-medium shadow-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500">Rate:</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={item.unitPrice}
                    onChange={e => handleUpdateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-900 font-medium shadow-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="w-20 text-right font-bold text-slate-900">
                  {formatCurrency(item.total, profile.currencySymbol)}
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={quote.items.length <= 1}
                  className="p-1 text-slate-400 hover:text-red-600 transition disabled:opacity-30"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Calculation Summary Box */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 flex flex-col justify-between gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Estimate Notes & Payment Terms
              </label>
              <textarea
                rows={2}
                value={quote.notes}
                onChange={e => setQuote(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 resize-none focus:border-blue-500 outline-none"
                placeholder="Terms, exclusions, warranty details..."
              />
            </div>

            {/* EFT Direct Deposit Snapshot */}
            {profile.bsb && profile.accountNumber && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-600">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong className="text-slate-800">EFT Info:</strong> BSB: <code className="font-mono text-slate-900 font-bold">{profile.bsb}</code> • Acc: <code className="font-mono text-slate-900 font-bold">{profile.accountNumber}</code> • {profile.bankName || 'Direct Deposit'}
                </span>
              </div>
            )}
          </div>

          <div className="sm:w-64 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="text-slate-900 font-bold">{formatCurrency(quote.subtotal, profile.currencySymbol)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>GST ({quote.taxRatePercent}%):</span>
              <span className="text-slate-900">{formatCurrency(quote.taxAmount, profile.currencySymbol)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Discount ($):</span>
              <input
                type="number"
                min="0"
                value={quote.discountAmount}
                onChange={e => setQuote(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-right text-emerald-700 font-bold text-xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">Grand Total:</span>
              <span className="font-black text-blue-700 text-base">
                {formatCurrency(quote.totalAmount, profile.currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Signature Pad */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Customer On-Site Signoff
            </h3>
          </div>

          <button
            onClick={clearSignature}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Clear Signature
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mb-3">
          Customer signs with finger or stylus to confirm and authorize scope on site.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Authorized Signee Name
            </label>
            <input
              type="text"
              value={signeeName}
              onChange={e => setSigneeName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none"
              placeholder="e.g. Marcus Vance"
            />
          </div>
        </div>

        {/* HTML5 Canvas Signature Area */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 overflow-hidden h-36 touch-none">
          <canvas
            ref={canvasRef}
            width={500}
            height={144}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair"
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
              ✍️ Sign on screen here
            </div>
          )}
        </div>
      </div>

      {/* Save & Workflow Transition CTA */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => saveQuoteChanges('draft', 'quote_requested')}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
        >
          Save as Draft
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => saveQuoteChanges('sent', 'quoted')}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mark as Quoted / Sent</span>
          </button>

          <button
            onClick={handleAcceptQuote}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Accept & Convert to Job</span>
          </button>
        </div>
      </div>
    </div>
  );
};
