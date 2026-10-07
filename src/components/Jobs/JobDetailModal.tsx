import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Job, JobStatus, HandymanProfile, JobPhoto, JobCategory, JobPriority, JobTask, CustomerSignature } from '../../types';
import { STATUS_CONFIG, formatDateTime, formatCurrency, buildLiveNavigationUrl, buildSmsLink, buildWhatsAppLink } from '../../utils/helpers';
import { buildGoogleCalendarUrl, downloadIcsCalendarFile } from '../../utils/calendarExport';
import { stitchBeforeAndAfterPhotos, processImageFile } from '../../utils/photoStitcher';
import { generateQuotePDF } from '../../services/pdfGenerator';
import { SignaturePadModal } from '../Common/SignaturePadModal';
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
  CheckCheck,
  Receipt,
  Circle,
  Pencil,
  Save,
  RotateCcw,
  Check,
  ListTodo,
  AlertCircle,
  Calendar,
  Download,
  Share2,
  PenTool,
  ShieldCheck,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Loader2
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

  // Customer Signature Pad Modal
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Before & After Photo Stitcher state
  const [selectedBeforePhoto, setSelectedBeforePhoto] = useState<string>('');
  const [selectedAfterPhoto, setSelectedAfterPhoto] = useState<string>('');
  const [stitchedPhotoUrl, setStitchedPhotoUrl] = useState<string>(job.beforeAfterImage || '');
  const [isStitching, setIsStitching] = useState(false);

  // Camera & Gallery file input refs
  const attachCameraInputRef = useRef<HTMLInputElement>(null);
  const attachGalleryInputRef = useRef<HTMLInputElement>(null);
  const beforeCameraInputRef = useRef<HTMLInputElement>(null);
  const beforeGalleryInputRef = useRef<HTMLInputElement>(null);
  const afterCameraInputRef = useRef<HTMLInputElement>(null);
  const afterGalleryInputRef = useRef<HTMLInputElement>(null);

  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showUrlInputFallback, setShowUrlInputFallback] = useState(false);

  const handleFileCapture = async (
    file: File,
    type: 'assessment' | 'before' | 'after' = 'assessment',
    customCaption?: string,
    setAsStitchTarget?: 'before' | 'after'
  ) => {
    if (!file) return;
    try {
      setIsProcessingImage(true);
      const dataUrl = await processImageFile(file, 1280, 0.85);
      const newPhoto: JobPhoto = {
        id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        url: dataUrl,
        caption: customCaption || photoCaptionInput.trim() || (type === 'before' ? 'Before Work' : type === 'after' ? 'After Completion' : 'Site Assessment'),
        type: type,
        uploadedAt: new Date().toISOString()
      };

      const updatedJob: Job = {
        ...job,
        photos: [...job.photos, newPhoto],
        updatedAt: new Date().toISOString()
      };
      onUpdateJob(updatedJob);

      if (setAsStitchTarget === 'before' || type === 'before') {
        setSelectedBeforePhoto(dataUrl);
      }
      if (setAsStitchTarget === 'after' || type === 'after') {
        setSelectedAfterPhoto(dataUrl);
      }

      setPhotoUrlInput('');
      setPhotoCaptionInput('');
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Failed to process the selected photo. Please try again.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Interactive Checklist & Task Management
  const [newTaskInput, setNewTaskInput] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Full Scope / Job Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editJobNumber, setEditJobNumber] = useState(job.jobNumber);
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

  // Sync edit form and photo stitcher when job prop changes
  useEffect(() => {
    setEditJobNumber(job.jobNumber);
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
    setStitchedPhotoUrl(job.beforeAfterImage || '');

    const beforeP = job.photos.find(p => p.type === 'before');
    const afterP = job.photos.find(p => p.type === 'after');
    if (beforeP) setSelectedBeforePhoto(beforeP.url);
    else if (job.photos.length > 0) setSelectedBeforePhoto(job.photos[0].url);
    if (afterP) setSelectedAfterPhoto(afterP.url);
    else if (job.photos.length > 1) setSelectedAfterPhoto(job.photos[1].url);
  }, [job]);

  const handleGenerateStitchedReport = async () => {
    if (!selectedBeforePhoto || !selectedAfterPhoto) {
      alert('Please select or upload both a Before and After photo first.');
      return;
    }
    try {
      setIsStitching(true);
      const dataUrl = await stitchBeforeAndAfterPhotos(
        selectedBeforePhoto,
        selectedAfterPhoto,
        {
          jobNumber: job.jobNumber,
          jobTitle: job.title,
          address: job.address,
          suburb: job.suburb || 'Point Cook',
          businessName: profile.businessName
        }
      );
      setStitchedPhotoUrl(dataUrl);
      onUpdateJob({
        ...job,
        beforeAfterImage: dataUrl,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      alert('Could not generate stitched photo. Please verify photo URLs are accessible.');
    } finally {
      setIsStitching(false);
    }
  };

  const handleDownloadStitchedImage = () => {
    if (!stitchedPhotoUrl) return;
    const a = document.createElement('a');
    a.href = stitchedPhotoUrl;
    a.download = `HandyMap_${job.jobNumber}_Before_After_Comparison.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
      jobNumber: editJobNumber.trim() || job.jobNumber,
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

  const handleCompleteAndInvoice = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    const updatedJob: Job = {
      ...job,
      status: 'completed',
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
            {(job.status === 'completed' || job.status === 'invoiced') && (
              <button
                type="button"
                onClick={() => generateQuotePDF(job, profile)}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                title="Generate & Download Official Tax Invoice PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tax Invoice (PDF)</span>
                <span className="sm:hidden">Invoice</span>
              </button>
            )}

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

        {/* Client Quick Contact & Calendar Sync Banner */}
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

            {/* 1-Click Calendar Sync */}
            <button
              type="button"
              onClick={() => window.open(buildGoogleCalendarUrl(job, profile), '_blank')}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-800 font-semibold flex items-center gap-1 transition border border-blue-200 shadow-sm"
              title="Add to Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Cal</span>
            </button>

            <button
              type="button"
              onClick={() => downloadIcsCalendarFile(job, profile)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold flex items-center gap-1 transition border border-slate-200 shadow-sm"
              title="Download Apple / Outlook iCal (.ics) file"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>iCal</span>
            </button>
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

              {/* Title & Job Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
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

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Job / Bookkeep ID</label>
                  <input
                    type="text"
                    value={editJobNumber}
                    onChange={e => setEditJobNumber(e.target.value)}
                    placeholder="e.g., BK-1042 / INV-99"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-xs focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
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

              {/* Job Completed & Tax Invoice Generation Banner */}
              {(job.status === 'completed' || job.status === 'invoiced') && (
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                      job.status === 'invoiced'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {job.status === 'invoiced' ? <CheckCheck className="w-6 h-6 text-blue-400" /> : <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                          job.status === 'invoiced'
                            ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
                            : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                        }`}>
                          {job.status === 'invoiced' ? '✓ INVOICED & PAID' : '✓ JOB COMPLETED'}
                        </span>
                        <span className="text-sm font-bold text-white">
                          Total: {formatCurrency(job.quote?.totalAmount || profile.defaultHourlyRate, profile.currencySymbol)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {job.status === 'invoiced'
                          ? 'Tax Invoice generated & marked paid. You can re-download or share anytime.'
                          : 'Job is complete! Generate official Tax Invoice with ABN, bank deposit details & customer signature.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => generateQuotePDF(job, profile)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                      title="Download Official Tax Invoice PDF"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>Generate Tax Invoice (PDF)</span>
                    </button>

                    <a
                      href={buildWhatsAppLink(
                        job.isAgencyJob && job.realEstateAgentPhone ? job.realEstateAgentPhone : job.clientPhone,
                        `Hi ${job.clientName}, your repair work for "${job.title}" at ${job.address} is completed! Tax Invoice Total: ${formatCurrency(job.quote?.totalAmount || profile.defaultHourlyRate, profile.currencySymbol)}. Bank Transfer: BSB ${profile.bsb || '063-875'} Acc ${profile.accountNumber || '1048 9921'} / PayID: ${profile.payId || profile.phone}. Thank you!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      title="Send Tax Invoice details via WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Invoice</span>
                    </a>

                    {job.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange('invoiced')}
                        className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 font-bold text-xs border border-white/20 transition"
                      >
                        <span>Mark Paid</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              
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

              {/* --------------------------------------------------------------------- */}
              {/* CUSTOMER SIGN-OFF & DIGITAL ACCEPTANCE CARD */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${
                      job.signature
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                        : 'bg-blue-50 text-blue-600 border-blue-200/60'
                    }`}>
                      {job.signature ? <ShieldCheck className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Customer Completion Sign-Off
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {job.signature
                          ? 'Work verified and approved by customer on-site'
                          : 'Collect digital touch/stylus signature upon completing job'}
                      </p>
                    </div>
                  </div>

                  {job.signature ? (
                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <PenTool className="w-3.5 h-3.5" /> Resign
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition active:scale-95"
                    >
                      <PenTool className="w-3.5 h-3.5" /> Sign-Off Job
                    </button>
                  )}
                </div>

                {job.signature ? (
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-1.5 rounded-xl border border-emerald-200 shadow-inner">
                        <img
                          src={job.signature.dataUrl}
                          alt="Customer Signature"
                          className="h-12 w-32 object-contain"
                        />
                      </div>
                      <div className="text-xs">
                        <p className="font-extrabold text-emerald-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Signed by {job.signature.signedBy}
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          {formatDateTime(job.signature.signedAt)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      ✓ Signature Embedded in PDF Invoice
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1">
                    <p className="text-xs text-slate-600 font-medium">No signature collected yet for Job #{job.jobNumber}.</p>
                    <p className="text-[11px] text-slate-400">Click "Sign-Off Job" above to open the touch signature pad for the client or tenant.</p>
                  </div>
                )}
              </div>

              {/* Complete Job & Invoice Action Card (when active or in progress) */}
              {job.status !== 'completed' && job.status !== 'invoiced' && (
                <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 rounded-2xl border-2 border-emerald-300/80 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 uppercase tracking-wide">
                        Work Finished on Site?
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Mark this job completed to unlock instant Tax Invoice PDF generation and customer receipt delivery.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompleteAndInvoice}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Job & Generate Invoice</span>
                  </button>
                </div>
              )}

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

              {/* Hidden File Inputs for Direct Camera & Gallery capture */}
              <input
                type="file"
                ref={attachCameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, photoTypeInput, photoCaptionInput);
                  e.target.value = '';
                }}
              />
              <input
                type="file"
                ref={attachGalleryInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, photoTypeInput, photoCaptionInput);
                  e.target.value = '';
                }}
              />

              <input
                type="file"
                ref={beforeCameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, 'before', 'Before repair work', 'before');
                  e.target.value = '';
                }}
              />
              <input
                type="file"
                ref={beforeGalleryInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, 'before', 'Before repair work', 'before');
                  e.target.value = '';
                }}
              />

              <input
                type="file"
                ref={afterCameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, 'after', 'Completed repair work', 'after');
                  e.target.value = '';
                }}
              />
              <input
                type="file"
                ref={afterGalleryInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileCapture(file, 'after', 'Completed repair work', 'after');
                  e.target.value = '';
                }}
              />

              {/* Processing Image Indicator */}
              {isProcessingImage && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-2xl flex items-center justify-center gap-2 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-xs font-bold">Optimizing & saving photo...</span>
                </div>
              )}

              {/* Add Photo form */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Attach Site & Assessment Photo
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Snap or upload photos on-site with automatic mobile compression.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Photo Category</label>
                    <select
                      value={photoTypeInput}
                      onChange={e => setPhotoTypeInput(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none"
                    >
                      <option value="assessment">Site Assessment / General</option>
                      <option value="before">Before Work (Initial State)</option>
                      <option value="after">After Work (Completed Repair)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Caption / Note (Optional)</label>
                    <input
                      type="text"
                      value={photoCaptionInput}
                      onChange={e => setPhotoCaptionInput(e.target.value)}
                      placeholder="e.g., Leaking brass valve, Cracked tile..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Mobile Camera & Gallery Capture Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => attachCameraInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo (Camera)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => attachGalleryInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition shadow-sm"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span>Upload from Device Gallery</span>
                  </button>
                </div>

                {/* Fallback URL toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInputFallback(!showUrlInputFallback)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showUrlInputFallback ? '▲ Hide URL input option' : '▼ Or enter image web URL directly'}
                  </button>

                  {showUrlInputFallback && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 animate-in fade-in">
                      <input
                        type="text"
                        value={photoUrlInput}
                        onChange={e => setPhotoUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none"
                      />
                      <button
                        onClick={handleAddPhoto}
                        disabled={!photoUrlInput.trim()}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 transition"
                      >
                        Attach URL
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* BEFORE & AFTER PHOTO STITCHER GENERATOR */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-xl border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Before & After Photo Stitcher
                      </h3>
                      <p className="text-sm font-extrabold text-white">
                        Side-by-Side Verified Work Report
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                    Auto-Watermarked
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Take or select 'Before' and 'After' photos on mobile to generate an official branded comparison report stamped with GPS address, timestamp, and Job ID.
                </p>

                {/* Photo Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Before Selector Card */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                        <span>◀ 1. 'Before' Photo</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Pre-repair state</span>
                    </div>

                    {/* Direct Camera / Upload Buttons for Before */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => beforeCameraInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => beforeGalleryInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="py-2 px-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-600 shadow-sm transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                    </div>

                    {/* Dropdown of existing photos */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Or pick from existing photos:</span>
                      <select
                        value={selectedBeforePhoto}
                        onChange={e => setSelectedBeforePhoto(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-medium outline-none"
                      >
                        <option value="">-- Select photo from job --</option>
                        {job.photos.map((p, idx) => (
                          <option key={p.id} value={p.url}>
                            Photo {idx + 1}: {p.caption} ({p.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBeforePhoto && (
                      <div className="h-32 rounded-xl overflow-hidden border border-slate-700 mt-1 relative bg-slate-950">
                        <img src={selectedBeforePhoto} alt="Before Preview" className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow">
                          ◀ BEFORE SELECTED
                        </span>
                      </div>
                    )}
                  </div>

                  {/* After Selector Card */}
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                        <span>2. 'After' Photo ▶</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Finished repair</span>
                    </div>

                    {/* Direct Camera / Upload Buttons for After */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => afterCameraInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="py-2 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => afterGalleryInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="py-2 px-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-600 shadow-sm transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                    </div>

                    {/* Dropdown of existing photos */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Or pick from existing photos:</span>
                      <select
                        value={selectedAfterPhoto}
                        onChange={e => setSelectedAfterPhoto(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-medium outline-none"
                      >
                        <option value="">-- Select photo from job --</option>
                        {job.photos.map((p, idx) => (
                          <option key={p.id} value={p.url}>
                            Photo {idx + 1}: {p.caption} ({p.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedAfterPhoto && (
                      <div className="h-32 rounded-xl overflow-hidden border border-slate-700 mt-1 relative bg-slate-950">
                        <img src={selectedAfterPhoto} alt="After Preview" className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow">
                          AFTER SELECTED ▶
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  disabled={!selectedBeforePhoto || !selectedAfterPhoto || isStitching}
                  onClick={handleGenerateStitchedReport}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                    selectedBeforePhoto && selectedAfterPhoto && !isStitching
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-98 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isStitching ? 'Stitching Side-by-Side Report...' : '✨ Generate Before & After Stitched Comparison'}</span>
                </button>

                {/* Stitched Comparison Output Card */}
                {stitchedPhotoUrl && (
                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex flex-col gap-3 mt-1 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Ready: Verified Side-by-Side Comparison
                      </span>
                      <span className="text-[10px] text-slate-400">High-Resolution 1200x760</span>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-md">
                      <img
                        src={stitchedPhotoUrl}
                        alt="Stitched Before & After Report"
                        className="w-full h-auto object-contain max-h-80"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadStitchedImage}
                        className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-300" />
                        <span>Download Image</span>
                      </button>

                      <a
                        href={buildWhatsAppLink(
                          job.clientPhone,
                          `Hi ${job.clientName}, here is the Before & After verified work completion report for ${job.title} at ${job.address}. Thank you!`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
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
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                            p.type === 'before'
                              ? 'bg-amber-100 text-amber-800'
                              : p.type === 'after'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {p.type}
                          </span>
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

      {/* Customer Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        clientName={job.clientName}
        jobNumber={job.jobNumber}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={(signature: CustomerSignature) => {
          onUpdateJob({
            ...job,
            signature,
            updatedAt: new Date().toISOString()
          });
          setIsSignatureModalOpen(false);
        }}
      />
    </div>
  );
};
