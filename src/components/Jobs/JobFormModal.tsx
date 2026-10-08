import React, { useState } from 'react';
import { Job, JobCategory, JobPriority, JobStatus, JobTask } from '../../types';
import { REAL_ESTATE_AGENCIES, SUBURBS_LIST } from '../../data/mockJobs';
import {
  X,
  Plus,
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  Tag,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ListTodo,
  Check,
  Briefcase
} from 'lucide-react';
import { AddressAutocomplete, AddressResult } from '../Common/AddressAutocomplete';
import { triggerHapticFeedback } from '../../services/nativeMobile';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newJob: Job) => void;
  currentLocation: [number, number];
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

const DURATION_PRESETS = [30, 45, 60, 90, 120, 180];

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentLocation
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [address, setAddress] = useState('');
  const [suburb, setSuburb] = useState('Point Cook');
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [category, setCategory] = useState<JobCategory>('General Repair');
  const [priority, setPriority] = useState<JobPriority>('medium');
  const [status, setStatus] = useState<JobStatus>('quote_requested');
  const [description, setDescription] = useState('');
  const [durationMin, setDurationMin] = useState(45);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [customJobNumber, setCustomJobNumber] = useState('');

  // Real Estate Agency Fields
  const [isAgencyJob, setIsAgencyJob] = useState(false);
  const [realEstateAgency, setRealEstateAgency] = useState('');
  const [realEstateAgentName, setRealEstateAgentName] = useState('');
  const [realEstateAgentPhone, setRealEstateAgentPhone] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');

  const handleAddressSelect = (result: AddressResult) => {
    setAddress(result.address);
    if (result.suburb) {
      const matched = SUBURBS_LIST.find(s => s.toLowerCase() === result.suburb.toLowerCase());
      if (matched) {
        setSuburb(matched);
      } else {
        setSuburb(result.suburb);
      }
    }
    setSelectedCoordinates(result.coordinates);
  };

  const handleAddTask = () => {
    if (taskInput.trim()) {
      setTasks(prev => [...prev, taskInput.trim()]);
      setTaskInput('');
      triggerHapticFeedback('light');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    triggerHapticFeedback('medium');

    let coordinates: [number, number];
    if (selectedCoordinates) {
      coordinates = selectedCoordinates;
    } else {
      // Slight jitter around current location
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      coordinates = [
        currentLocation[0] + latOffset,
        currentLocation[1] + lngOffset
      ];
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const jobNumber = customJobNumber.trim() || (status === 'quote_requested' ? `REQ-${randomNum}` : `JOB-${randomNum}`);

    let initialTasks: JobTask[] = tasks.map((t, i) => ({
      id: `task-${Date.now()}-${i}`,
      title: t,
      isCompleted: false
    }));

    if (initialTasks.length === 0 && description) {
      const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        const clean = line.replace(/^[-*•\d.)]+\s*/, '').trim();
        if (clean.length > 2 && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\./.test(line))) {
          initialTasks.push({
            id: `task-init-${Date.now()}-${idx}`,
            title: clean,
            isCompleted: false
          });
        }
      });
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      jobNumber,
      title: title.trim(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || '0412 555 019',
      clientEmail: clientEmail.trim() || `${clientName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      address: address.trim() || `${suburb} VIC 3030`,
      suburb,
      coordinates,
      status,
      priority,
      category,
      description: description.trim() || 'Customer requested on-site estimate and inspection.',
      tasks: initialTasks,
      quoteRequestedDate: new Date().toISOString(),
      appointmentTime: appointmentTime ? new Date(appointmentTime).toISOString() : undefined,
      estimatedDurationMinutes: durationMin,
      
      // Agency details
      isAgencyJob,
      realEstateAgency: isAgencyJob ? realEstateAgency : undefined,
      realEstateAgentName: isAgencyJob ? realEstateAgentName.trim() : undefined,
      realEstateAgentPhone: isAgencyJob ? realEstateAgentPhone.trim() : undefined,
      workOrderNumber: isAgencyJob ? workOrderNumber.trim() : undefined,
      tenantName: isAgencyJob ? tenantName.trim() : undefined,
      tenantPhone: isAgencyJob ? tenantPhone.trim() : undefined,

      photos: [],
      timeLogs: [],
      internalNotes: [isAgencyJob ? `Real Estate Work Order: ${realEstateAgency}` : 'Created via HandyMap Pro'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 text-slate-900">
      <div className="bg-white border-t sm:border border-slate-200/90 rounded-t-[32px] sm:rounded-3xl w-full max-w-xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                New Job Lead / Work Order
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Place an active quote or agency job directly onto your map
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 text-xs">
          
          {/* SECTION 1: JOB SCOPE & TITLE */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                Job Title & Categorization
              </span>
              <span className="text-[10px] text-blue-600 font-bold">* Required</span>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Kitchen Tap Mixer Replacement & Leak Inspection"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm font-semibold placeholder:text-slate-400 placeholder:font-normal focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Trade Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as JobCategory)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:border-blue-500 outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Job / Invoice ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customJobNumber}
                  onChange={e => setCustomJobNumber(e.target.value)}
                  placeholder="e.g., BK-1042 / INV-99"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs placeholder:text-slate-400 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Scope of Work & Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Details of client request, parts required, or site access instructions..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 text-xs placeholder:text-slate-400 focus:border-blue-500 outline-none resize-none transition"
              />
            </div>
          </div>

          {/* SECTION 2: REAL ESTATE AGENCY TOGGLE */}
          <div className={`rounded-2xl border transition-all ${
            isAgencyJob
              ? 'bg-purple-50/70 border-purple-200 p-3.5 sm:p-4'
              : 'bg-slate-50/80 border-slate-200/80 p-3.5'
          }`}>
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                  isAgencyJob ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Real Estate Agency Work Order</div>
                  <div className="text-[11px] text-slate-500">Enable if dispatched by a property manager (e.g. Ray White)</div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isAgencyJob}
                onChange={e => {
                  triggerHapticFeedback('light');
                  setIsAgencyJob(e.target.checked);
                }}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
            </label>

            {isAgencyJob && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-3 border-t border-purple-200/80 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-bold text-purple-950 block mb-1">
                    Agency Partner *
                  </label>
                  <input
                    type="text"
                    list="agency-suggestions"
                    value={realEstateAgency}
                    onChange={e => setRealEstateAgency(e.target.value)}
                    placeholder="e.g., Ray White Point Cook"
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-purple-600"
                  />
                  <datalist id="agency-suggestions">
                    {REAL_ESTATE_AGENCIES.map(a => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-purple-950 block mb-1">
                    Work Order # (PO)
                  </label>
                  <input
                    type="text"
                    value={workOrderNumber}
                    onChange={e => setWorkOrderNumber(e.target.value)}
                    placeholder="e.g., WO-RW-9021"
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-purple-950 block mb-1">
                    Property Manager Name
                  </label>
                  <input
                    type="text"
                    value={realEstateAgentName}
                    onChange={e => setRealEstateAgentName(e.target.value)}
                    placeholder="e.g., Sarah Jenkins"
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-purple-950 block mb-1">
                    Property Manager Phone
                  </label>
                  <input
                    type="tel"
                    value={realEstateAgentPhone}
                    onChange={e => setRealEstateAgentPhone(e.target.value)}
                    placeholder="e.g., 0412 888 901"
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: CLIENT & ADDRESS DETAILS */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              {isAgencyJob ? 'Tenant & Site Location' : 'Client & Site Location'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  {isAgencyJob ? 'Tenant / Occupant Name *' : 'Client Full Name *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="e.g., Jordan Miller"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  {isAgencyJob ? 'Tenant Contact Phone' : 'Client Phone'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="0412 345 678"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
                <span>Street Address *</span>
                {selectedCoordinates && (
                  <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Exact GPS Pin Linked
                  </span>
                )}
              </label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing street address (e.g. 20 Banjo Paterson)..."
                currentLocation={currentLocation}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Suburb *
                </label>
                <select
                  value={suburb}
                  onChange={e => setSuburb(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:border-blue-500 outline-none"
                >
                  {SUBURBS_LIST.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  {!SUBURBS_LIST.includes(suburb) && suburb && (
                    <option value={suburb}>{suburb}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Client Email <span className="text-slate-400 font-normal">(For Quotes)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="e.g. jordan@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: STATUS, PRIORITY & DURATION */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Status, Urgency & Estimated Time
            </span>

            {/* Status Pills */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1.5">
                Initial Pipeline Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'quote_requested', label: 'Needs Quote' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'urgent', label: 'Urgent Work' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setStatus(s.id as JobStatus);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center ${
                      status === s.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Pills */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'medium', 'high', 'urgent'] as JobPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setPriority(p);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition text-center ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Presets */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1.5 flex items-center justify-between">
                <span>Estimated Time on Site</span>
                <span className="font-extrabold text-blue-600">{durationMin} minutes</span>
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {DURATION_PRESETS.map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setDurationMin(mins);
                    }}
                    className={`flex-1 min-w-[50px] py-1.5 rounded-xl text-xs font-bold transition ${
                      durationMin === mins
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Scheduled Appointment Date / Time <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="datetime-local"
                  value={appointmentTime}
                  onChange={e => setAppointmentTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: TASK CHECKLIST ITEMS */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                Sub-Task Checklist Items
              </span>
              <span className="text-slate-400 font-normal lowercase">mark done on-site</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                placeholder="e.g. Replace shower seal, test pressure..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!taskInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40 transition active:scale-95"
              >
                + Add
              </button>
            </div>

            {tasks.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {tasks.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-xs">
                    <span className="text-slate-800 font-medium">☐ {t}</span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback('light');
                        setTasks(tasks.filter((_, i) => i !== idx));
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer CTA */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg shadow-blue-500/25 active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create & Place on Map</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
