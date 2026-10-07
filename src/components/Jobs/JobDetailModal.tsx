import React, { useState, useEffect } from 'react';
import { Job, JobStatus, HandymanProfile, JobPhoto, JobCategory, JobPriority, JobTask } from '../../types';
import { STATUS_CONFIG, formatDateTime, buildLiveNavigationUrl, buildSmsLink, buildWhatsAppLink } from '../../utils/helpers';
import { SUBURBS_LIST } from '../../data/mockJobs';
import { AddressAutocomplete, AddressResult } from '../Common/AddressAutocomplete';
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
  CheckCircle2,
  Circle,
  Pencil,
  Save,
  RotateCcw,
  Check,
  ListTodo,
  AlertCircle
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  profile: HandymanProfile;
  currentLocation: [number, number];
  onClose: () => void;
  onUpdateJob: (updatedJob: Job) => void;
  onDeleteJob: (jobId: string) => void;
}

const CATEGORIES: JobCategory[] = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'HVAC',
  'Roofing',
  'General Repair',
  'Assembly & Mounting',
  'Drywall & Masonry',
  'Door & Window'
];

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  profile,
  currentLocation,
  onClose,
  onUpdateJob,
  onDeleteJob
}) => {
  if (!job) return null;

  const [activeTab, setActiveTab] = useState<'quote' | 'overview' | 'photos' | 'time'>('overview');
  const [newNote, setNewNote] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');
  const [photoTypeInput, setPhotoTypeInput] = useState<'assessment' | 'before' | 'after'>('assessment');

  // Interactive Checklist & Task Management
  const [newTaskInput, setNewTaskInput] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Full Scope / Job Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(job.title);
  const [editDescription, setEditDescription] = useState(job.description);
  const [editCategory, setEditCategory] = useState<JobCategory>(job.category);
  const [editPriority, setEditPriority] = useState<JobPriority>(job.priority);
  const [editStatus, setEditStatus] = useState<JobStatus>(job.status);
  const [editClientName, setEditClientName] = useState(job.clientName);
  const [editClientPhone, setEditClientPhone] = useState(job.clientPhone);
  const [editClientEmail, setEditClientEmail] = useState(job.clientEmail);
  const [editAddress, setEditAddress] = useState(job.address);
  const [editSuburb, setEditSuburb] = useState(job.suburb || 'Point Cook');
  const [editCoordinates, setEditCoordinates] = useState<[number, number]>(job.coordinates);
  const [editDuration, setEditDuration] = useState(job.estimatedDurationMinutes);

  // Sync edit form when job prop changes
  useEffect(() => {
    setEditTitle(job.title);
    setEditDescription(job.description);
    setEditCategory(job.category);
    setEditPriority(job.priority);
    setEditStatus(job.status);
    setEditClientName(job.clientName);
    setEditClientPhone(job.clientPhone);
    setEditClientEmail(job.clientEmail);
    setEditAddress(job.address);
    setEditSuburb(job.suburb || 'Point Cook');
    setEditCoordinates(job.coordinates);
    setEditDuration(job.estimatedDurationMinutes);
  }, [job]);

  const statusCfg = STATUS_CONFIG[job.status];
  const googleNavUrl = buildLiveNavigationUrl(job.coordinates, job.address);

  // Tasks statistics
  const currentTasks = job.tasks || [];
  const completedTasksCount = currentTasks.filter(t => t.isCompleted).length;
  const totalTasksCount = currentTasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Toggle task done/pending
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.isCompleted;
        return {
          ...t,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return t;
    });

    onUpdateJob({
      ...job,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    });
  };

  // Add new checklist task
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskInput.trim()) return;

    const newTask: JobTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: newTaskInput.trim(),
      isCompleted: false
    };

    onUpdateJob({
      ...job,
      tasks: [...currentTasks, newTask],
      updatedAt: new Date().toISOString()
    });
    setNewTaskInput('');
  };

  // Delete checklist task
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = currentTasks.filter(t => t.id !== taskId);
    onUpdateJob({
      ...job,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    });
  };

  // Save inline task title edit
  const handleSaveEditTask = () => {
    if (!editingTaskId || !editingTaskTitle.trim()) {
      setEditingTaskId(null);
      return;
    }

    const updatedTasks = currentTasks.map(t =>
      t.id === editingTaskId ? { ...t, title: editingTaskTitle.trim() } : t
    );

    onUpdateJob({
      ...job,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    });
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  // Automatically extract checklist items from scope description bullet points
  const handleAutoExtractTasks = () => {
    const lines = job.description.split('\n').map(l => l.trim()).filter(Boolean);
    const extracted: JobTask[] = [];

    lines.forEach((line, idx) => {
      const clean = line.replace(/^[-*•\d.)]+\s*/, '').trim();
      if (clean.length > 2) {
        extracted.push({
          id: `task-ext-${Date.now()}-${idx}`,
          title: clean,
          isCompleted: false
        });
      }
    });

    if (extracted.length > 0) {
      onUpdateJob({
        ...job,
        tasks: [...currentTasks, ...extracted],
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Save entire job & scope edits
  const handleSaveAllJobEdits = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedJob: Job = {
      ...job,
      title: editTitle.trim() || job.title,
      description: editDescription.trim() || job.description,
      category: editCategory,
      priority: editPriority,
      status: editStatus,
      clientName: editClientName.trim() || job.clientName,
      clientPhone: editClientPhone.trim() || job.clientPhone,
      clientEmail: editClientEmail.trim() || job.clientEmail,
      address: editAddress.trim() || job.address,
      suburb: editSuburb || job.suburb,
      coordinates: editCoordinates || job.coordinates,
      estimatedDurationMinutes: Number(editDuration) || 45,
      updatedAt: new Date().toISOString()
    };
    onUpdateJob(updatedJob);
    setIsEditing(false);
  };

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
    { label: 'On My Way', text: `Hi ${job.clientName}, Alex from ${profile.businessName} here. I am on my way to your location! Est. arrival in 15-20 minutes.` },
    { label: 'Quote Ready', text: `Hi ${job.clientName}, I have prepared your estimate for ${job.title}. Please review when convenient: $${job.quote?.totalAmount || ''}` },
    { label: 'Job Completed', text: `Hi ${job.clientName}, the repair work for ${job.title} is all done and tested. Thank you for choosing ${profile.businessName}!` }
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border-t sm:border border-slate-200/90 rounded-t-[32px] sm:rounded-3xl w-full max-w-3xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden text-slate-900 pb-[env(safe-area-inset-bottom,0px)]">
        
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-start justify-between gap-4 bg-white shrink-0">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
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

              {job.isAgencyJob && job.realEstateAgency && (
                <span className="text-xs font-bold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                  <Building2 className="w-3 h-3 text-purple-700" />
                  {job.realEstateAgency}
                  {job.workOrderNumber && <span className="font-mono opacity-80">({job.workOrderNumber})</span>}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug truncate">
              {job.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                isEditing
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Job'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
            onClick={() => { setActiveTab('overview'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-blue-600" /> Scope & Checklist
            {totalTasksCount > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
                {completedTasksCount}/{totalTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('quote'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'quote'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quote & Pricing
          </button>

          <button
            onClick={() => { setActiveTab('photos'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Photos ({job.photos.length})
          </button>

          <button
            onClick={() => { setActiveTab('time'); }}
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
          
          {/* ========================================================================= */}
          {/* EDIT JOB & SCOPE MODE OVERLAY */}
          {/* ========================================================================= */}
          {isEditing ? (
            <form onSubmit={handleSaveAllJobEdits} className="bg-white rounded-3xl border border-blue-200 p-5 shadow-lg flex flex-col gap-4 text-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200/60">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Edit Job Scope & Details</h3>
                    <p className="text-[11px] text-slate-500">Update title, description, trade category, or client address.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Job summary title..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              {/* Category, Priority & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as JobCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as JobPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={editDuration}
                    onChange={e => setEditDuration(parseInt(e.target.value, 10) || 45)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Full Description / Scope */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Scope Description & Task Details</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Detailed breakdown of repair tasks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-blue-500 focus:bg-white outline-none resize-y"
                />
              </div>

              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Client Name</label>
                  <input
                    type="text"
                    value={editClientName}
                    onChange={e => setEditClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Client Phone</label>
                  <input
                    type="tel"
                    value={editClientPhone}
                    onChange={e => setEditClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Address with Autocomplete & Suburb */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-bold block mb-1">Street Address</label>
                  <AddressAutocomplete
                    value={editAddress}
                    onChange={setEditAddress}
                    onAddressSelect={(res: AddressResult) => {
                      setEditAddress(res.address);
                      if (res.suburb) setEditSuburb(res.suburb);
                      if (res.coordinates) setEditCoordinates(res.coordinates);
                    }}
                    currentLocation={currentLocation}
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Suburb</label>
                  <select
                    value={editSuburb}
                    onChange={e => setEditSuburb(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:border-blue-500 focus:bg-white outline-none"
                  >
                    {SUBURBS_LIST.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    {!SUBURBS_LIST.includes(editSuburb) && editSuburb && (
                      <option value={editSuburb}>{editSuburb}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" /> Save Scope & Job Changes
                </button>
              </div>
            </form>
          ) : null}

          {/* ========================================================================= */}
          {/* SCOPE & CHECKLIST TAB */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && !isEditing && (
            <div className="flex flex-col gap-5 text-slate-900">
              
              {/* Real Estate Agency B2B Work Order Info (Only if Agency Partner exists) */}
              {job.isAgencyJob && job.realEstateAgency && (
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
                        <p className="text-[10px] uppercase font-bold text-purple-600">Property Manager</p>
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
                        <p className="text-[10px] uppercase font-bold text-blue-600">Tenant / On-Site Occupant</p>
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

              {/* --------------------------------------------------------------------- */}
              {/* INTERACTIVE TASK CHECKLIST (DONE VS PENDING TRACKER) */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col gap-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                      <ListTodo className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Task Checklist & Action Items
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Check off completed tasks on-site to track job completion.
                      </p>
                    </div>
                  </div>

                  {totalTasksCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        completedTasksCount === totalTasksCount
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {completedTasksCount} of {totalTasksCount} Done ({progressPercent}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {totalTasksCount > 0 && (
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        completedTasksCount === totalTasksCount ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                {/* Add Subtask Input */}
                <form onSubmit={handleAddTask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={e => setNewTaskInput(e.target.value)}
                    placeholder="Add a new checklist task (e.g., Replace mixer washer, Test flow)..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm disabled:opacity-50 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                </form>

                {/* Task Checklist Items */}
                <div className="flex flex-col divide-y divide-slate-100 mt-1">
                  {totalTasksCount === 0 ? (
                    <div className="text-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                      <ListTodo className="w-8 h-8 text-slate-300" />
                      <p className="text-xs text-slate-500">No individual checklist tasks yet.</p>
                      {job.description && job.description.length > 5 && (
                        <button
                          type="button"
                          onClick={handleAutoExtractTasks}
                          className="mt-1 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 shadow-sm flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Convert Scope Notes to Checklist
                        </button>
                      )}
                    </div>
                  ) : (
                    currentTasks.map((task) => {
                      const isEditingThis = editingTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`py-2.5 px-2 flex items-start justify-between gap-3 group rounded-xl transition ${
                            task.isCompleted ? 'bg-slate-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id)}
                              className="mt-0.5 text-slate-400 hover:text-blue-600 transition shrink-0"
                            >
                              {task.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 hover:text-blue-500" />
                              )}
                            </button>

                            {isEditingThis ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingTaskTitle}
                                  onChange={e => setEditingTaskTitle(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveEditTask();
                                    if (e.key === 'Escape') setEditingTaskId(null);
                                  }}
                                  className="flex-1 bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs text-slate-900 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEditTask}
                                  className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTaskId(null)}
                                  className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleToggleTask(task.id)}
                                className="flex-1 cursor-pointer select-none"
                              >
                                <p className={`text-xs font-medium ${
                                  task.isCompleted
                                    ? 'line-through text-slate-400 font-normal'
                                    : 'text-slate-800'
                                }`}>
                                  {task.title}
                                </p>
                                {task.completedAt && task.isCompleted && (
                                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                                    ✓ Done {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {!isEditingThis && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTaskId(task.id);
                                  setEditingTaskTitle(task.title);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                                title="Edit task title"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* SCOPE DESCRIPTION CARD */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Full Scope & Request Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit Scope
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {job.description || 'No detailed scope description provided.'}
                </p>

                <div className="mt-1 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
                    Add Note
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

          {/* ========================================================================= */}
          {/* QUOTE BUILDER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'quote' && (
            <QuoteBuilder
              job={job}
              profile={profile}
              onUpdateJob={onUpdateJob}
            />
          )}

          {/* ========================================================================= */}
          {/* PHOTOS TAB */}
          {/* ========================================================================= */}
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
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 transition"
                  >
                    Attach
                  </button>
                </div>
              </div>

              {/* Photo gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.photos.length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-2 text-center py-8">
                    No photos uploaded yet. Add before/after photos above.
                  </p>
                ) : (
                  job.photos.map(p => (
                    <div key={p.id} className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden group shadow-sm">
                      <img src={p.url} alt={p.caption} className="w-full h-44 object-cover" />
                      <div className="p-2.5 flex items-center justify-between text-xs bg-white">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-blue-600 block">{p.type}</span>
                          <span className="text-slate-800 font-medium">{p.caption}</span>
                        </div>
                        <button
                          onClick={() => handleDeletePhoto(p.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TIME TRACKER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'time' && (
            <TimeTracker
              job={job}
              onUpdateJob={onUpdateJob}
            />
          )}
        </div>
      </div>
    </div>
  );
};
