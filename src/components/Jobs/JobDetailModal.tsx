import React, { useState } from 'react';
import { Job, JobStatus, HandymanProfile, JobPhoto } from '../../types';
import { STATUS_CONFIG, formatDateTime, buildLiveNavigationUrl, buildSmsLink, buildWhatsAppLink } from '../../utils/helpers';
import { QuoteBuilder } from './QuoteBuilder';
import { TimeTracker } from './TimeTracker';
import {
  X,
  Phone,
  MessageSquare,
  Navigation2,
  FileText,
  Camera,
  Clock,
  MapPin,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Tag,
  Building2,
  UserCheck
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  profile: HandymanProfile;
  currentLocation: [number, number];
  onClose: () => void;
  onUpdateJob: (updatedJob: Job) => void;
  onDeleteJob: (jobId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  profile,
  currentLocation,
  onClose,
  onUpdateJob,
  onDeleteJob
}) => {
  if (!job) return null;

  const [activeTab, setActiveTab] = useState<'quote' | 'overview' | 'photos' | 'time'>('quote');
  const [newNote, setNewNote] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');
  const [photoTypeInput, setPhotoTypeInput] = useState<'assessment' | 'before' | 'after'>('assessment');

  const statusCfg = STATUS_CONFIG[job.status];
  // Direct live GPS navigation link (Google Maps / Apple Maps defaults to device location)
  const googleNavUrl = buildLiveNavigationUrl(job.coordinates, job.address);

  const handleStatusChange = (newStatus: JobStatus) => {
    const updatedJob: Job = {
      ...job,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    onUpdateJob(updatedJob);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedJob: Job = {
      ...job,
      internalNotes: [...job.internalNotes, `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${newNote.trim()}`],
      updatedAt: new Date().toISOString()
    };
    onUpdateJob(updatedJob);
    setNewNote('');
  };

  const handleAddPhoto = () => {
    if (!photoUrlInput.trim()) return;
    const newPhoto: JobPhoto = {
      id: `p-${Date.now()}`,
      url: photoUrlInput.trim(),
      caption: photoCaptionInput.trim() || 'Site photo',
      type: photoTypeInput,
      uploadedAt: new Date().toISOString()
    };
    const updatedJob: Job = {
      ...job,
      photos: [...job.photos, newPhoto],
      updatedAt: new Date().toISOString()
    };
    onUpdateJob(updatedJob);
    setPhotoUrlInput('');
    setPhotoCaptionInput('');
  };

  const handleDeletePhoto = (photoId: string) => {
    const updatedJob: Job = {
      ...job,
      photos: job.photos.filter(p => p.id !== photoId),
      updatedAt: new Date().toISOString()
    };
    onUpdateJob(updatedJob);
  };

  const quickSmsTemplates = [
    { label: 'On My Way', text: `Hi ${job.clientName}, Alex from Apex Handyman here. I am on my way to your location! Est. arrival in 15-20 minutes.` },
    { label: 'Quote Ready', text: `Hi ${job.clientName}, I have prepared your estimate for ${job.title}. Please review when convenient: $${job.quote?.totalAmount || ''}` },
    { label: 'Job Completed', text: `Hi ${job.clientName}, the repair work for ${job.title} is all done and tested. Thank you for choosing Apex Handyman!` }
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-t-[32px] sm:rounded-3xl w-full max-w-3xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden text-slate-900 pb-[env(safe-area-inset-bottom,0px)]">
        
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-start justify-between gap-4 bg-white shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {job.jobNumber}
              </span>

              {/* Status Picker Dropdown */}
              <select
                value={job.status}
                onChange={e => handleStatusChange(e.target.value as JobStatus)}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border cursor-pointer shadow-sm ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass} focus:outline-none`}
              >
                <option value="quote_requested">🟠 Needs Quote (Site Visit)</option>
                <option value="quoted">🟣 Quoted (Pending Approval)</option>
                <option value="in_progress">🟢 In Progress / Active</option>
                <option value="urgent">🔴 Urgent / Emergency</option>
                <option value="completed">⚪ Completed</option>
                <option value="invoiced">🔵 Invoiced & Paid</option>
              </select>

              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200/60">
                <Tag className="w-3 h-3 text-blue-600" /> {job.category}
              </span>

              {job.isAgencyJob && (
                <span className="text-xs font-bold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                  <Building2 className="w-3 h-3 text-purple-700" />
                  {job.realEstateAgency}
                  {job.workOrderNumber && <span className="font-mono opacity-80">({job.workOrderNumber})</span>}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              {job.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Quick Contact Banner */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
          <div>
            <p className="font-bold text-slate-900 text-sm">{job.clientName}</p>
            <div className="flex items-center gap-1 text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{job.address}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            <a
              href={`tel:${job.clientPhone}`}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold flex items-center gap-1.5 transition border border-slate-200 shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call</span>
            </a>

            <a
              href={buildWhatsAppLink(job.clientPhone, quickSmsTemplates[0].text)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-800 font-semibold flex items-center gap-1.5 transition border border-slate-200 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <a
              href={googleNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-amber-800 font-semibold flex items-center gap-1.5 transition border border-slate-200 shadow-sm"
            >
              <Navigation2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Directions</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 border-b border-slate-200 flex items-center gap-2 bg-white shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('quote')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'quote'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quote & Pricing
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Scope & Notes
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Photos ({job.photos.length})
          </button>

          <button
            onClick={() => setActiveTab('time')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'time'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Time Tracker
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === 'quote' && (
            <QuoteBuilder
              job={job}
              profile={profile}
              onUpdateJob={onUpdateJob}
            />
          )}

          {activeTab === 'overview' && (
            <div className="flex flex-col gap-5 text-slate-900">
              {/* Real Estate Agency B2B Work Order Info */}
              {job.isAgencyJob && (
                <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-purple-600 text-white">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-purple-900">
                          {job.realEstateAgency} Work Order
                        </h3>
                        <p className="text-[11px] text-purple-700 font-mono font-bold">
                          Order #{job.workOrderNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/80 text-xs">
                    {/* Property Manager Column */}
                    <div className="bg-white/90 p-3 rounded-xl border border-purple-100 flex flex-col justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-purple-600">Property Manager (Billing & Approval)</p>
                        <p className="font-bold text-slate-900 mt-0.5">{job.realEstateAgentName || 'Agency PM'}</p>
                        <p className="text-[11px] text-slate-500">{job.realEstateAgentPhone || 'No phone listed'}</p>
                      </div>
                      {job.realEstateAgentPhone && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <a
                            href={`tel:${job.realEstateAgentPhone}`}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                          >
                            <Phone className="w-3 h-3" /> Call PM
                          </a>
                          <a
                            href={buildSmsLink(
                              job.realEstateAgentPhone,
                              `Hi ${job.realEstateAgentName || 'Property Manager'}, Alex from ${profile.businessName} regarding ${job.workOrderNumber || job.title} at ${job.address}. Work status update:`
                            )}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 text-purple-900 font-bold text-[11px] border border-purple-200"
                          >
                            <MessageSquare className="w-3 h-3" /> SMS Update
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Tenant / Occupant Column */}
                    <div className="bg-white/90 p-3 rounded-xl border border-purple-100 flex flex-col justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-600">Tenant / On-Site Occupant (Access)</p>
                        <p className="font-bold text-slate-900 mt-0.5">{job.tenantName || job.clientName}</p>
                        <p className="text-[11px] text-slate-500">{job.tenantPhone || job.clientPhone}</p>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <a
                          href={`tel:${job.tenantPhone || job.clientPhone}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <Phone className="w-3 h-3" /> Call Tenant
                        </a>
                        <a
                          href={buildSmsLink(
                            job.tenantPhone || job.clientPhone,
                            `Hi ${job.tenantName || job.clientName}, Alex from ${profile.businessName} here. I am arriving for the repair work order (${job.title}) at ${job.address}.`
                          )}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] border border-slate-200"
                        >
                          <MessageSquare className="w-3 h-3" /> SMS Arrival
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scope Description */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Client Request Details
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {job.description}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Requested: {formatDateTime(job.quoteRequestedDate)}</span>
                  <span>Est. Visit Duration: {job.estimatedDurationMinutes} mins</span>
                </div>
              </div>

              {/* Quick SMS Presets */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Quick Client SMS Templates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {quickSmsTemplates.map((tpl, i) => (
                    <a
                      key={i}
                      href={buildSmsLink(job.clientPhone, tpl.text)}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-left flex flex-col justify-between gap-2 transition"
                    >
                      <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {tpl.label}
                      </span>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{tpl.text}</p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Internal Handyman Notes */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Internal Notes & Access Codes
                </h3>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add a private note or measurement..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {job.internalNotes.length === 0 ? (
                    <p className="text-xs text-slate-400">No notes yet.</p>
                  ) : (
                    job.internalNotes.map((note, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
                        {note}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delete Job Option */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this job?')) {
                      onDeleteJob(job.id);
                      onClose();
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Job
                </button>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="flex flex-col gap-5 text-slate-900">
              {/* Add Photo form */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Attach Site / Assessment Photo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2.5">
                  <select
                    value={photoTypeInput}
                    onChange={e => setPhotoTypeInput(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="assessment">Site Assessment</option>
                    <option value="before">Before Work</option>
                    <option value="after">After Completion</option>
                  </select>

                  <input
                    type="text"
                    value={photoUrlInput}
                    onChange={e => setPhotoUrlInput(e.target.value)}
                    placeholder="Image URL..."
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 sm:col-span-2 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={photoCaptionInput}
                    onChange={e => setPhotoCaptionInput(e.target.value)}
                    placeholder="Caption / description (e.g., Damaged valve fitting)..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddPhoto}
                    disabled={!photoUrlInput.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" /> Attach
                  </button>
                </div>
              </div>

              {/* Photos Gallery */}
              {job.photos.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No photos uploaded for this job yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.photos.map(photo => (
                    <div
                      key={photo.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden group shadow-sm"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-blue-600 block">
                            {photo.type}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 mt-0.5">{photo.caption}</p>
                        </div>

                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-red-600 transition"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'time' && (
            <TimeTracker job={job} onUpdateJob={onUpdateJob} />
          )}
        </div>
      </div>
    </div>
  );
};
