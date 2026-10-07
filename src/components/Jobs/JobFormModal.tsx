import React, { useState } from 'react';
import { Job, JobCategory, JobPriority, JobStatus, JobTask } from '../../types';
import { REAL_ESTATE_AGENCIES, SUBURBS_LIST } from '../../data/mockJobs';
import { X, Plus, MapPin, Building2, User, Phone, Tag } from 'lucide-react';
import { AddressAutocomplete, AddressResult } from '../Common/AddressAutocomplete';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

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
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150 text-slate-900">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-[32px] sm:rounded-3xl w-full max-w-lg max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />


        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                New Job Lead / Quote Request
              </h2>
              <p className="text-xs text-slate-500">
                Log a residential or real estate work order onto your map.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-slate-700 font-bold block mb-1">
                Job / Quote Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Kitchen Tap Mixer Replacement & Leak Check"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                Job / Bookkeep ID <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customJobNumber}
                onChange={e => setCustomJobNumber(e.target.value)}
                placeholder="e.g., BK-1042 / INV-99"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-xs placeholder:text-slate-400 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* Real Estate Agency Checkbox Toggle */}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAgencyJob}
                onChange={e => setIsAgencyJob(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-700" />
                This is a Real Estate Agency / Property Manager Work Order
              </span>
            </label>

            {isAgencyJob && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/80 animate-in fade-in">
                <div>
                  <label className="text-purple-900 font-bold block mb-1">
                    Agency Partner *
                  </label>
                  <select
                    value={realEstateAgency}
                    onChange={e => setRealEstateAgency(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-purple-600"
                  >
                    {REAL_ESTATE_AGENCIES.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="Other Real Estate Agency">Other Agency</option>
                  </select>
                </div>

                <div>
                  <label className="text-purple-900 font-bold block mb-1">
                    Work Order # (PO)
                  </label>
                  <input
                    type="text"
                    value={workOrderNumber}
                    onChange={e => setWorkOrderNumber(e.target.value)}
                    placeholder="e.g., WO-RW-9021"
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-purple-900 font-bold block mb-1">
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
                  <label className="text-purple-900 font-bold block mb-1">
                    PM Phone Number
                  </label>
                  <input
                    type="tel"
                    value={realEstateAgentPhone}
                    onChange={e => setRealEstateAgentPhone(e.target.value)}
                    placeholder="0412 888 901"
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {isAgencyJob ? 'Tenant / Occupant Name *' : 'Client Name *'}
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g., Jordan Miller"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {isAgencyJob ? 'Tenant On-Site Phone' : 'Client Phone'}
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="0412 345 678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
                <span>Street Address *</span>
                {selectedCoordinates && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    ✓ Exact Map Pin Linked
                  </span>
                )}
              </label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing street address or place (e.g. 20 Banjo Paterson)..."
                currentLocation={currentLocation}
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                Suburb *
              </label>
              <select
                value={suburb}
                onChange={e => setSuburb(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:border-blue-500 focus:bg-white outline-none"
              >
                {SUBURBS_LIST.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                {!SUBURBS_LIST.includes(suburb) && suburb && (
                  <option value={suburb}>{suburb}</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">
                Trade Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as JobCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as JobStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
              >
                <option value="quote_requested">Needs Quote</option>
                <option value="in_progress">In Progress</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-slate-700 font-bold block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as JobPriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:bg-white outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">
              Scope / Work Order Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What needs to be estimated or repaired? (Bullet points will auto-convert into checkboxes)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white outline-none resize-none transition"
            />
          </div>

          {/* Actionable Subtasks / Checklist Items */}
          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col gap-2">
            <label className="text-slate-700 font-bold block flex items-center justify-between">
              <span>Task Checklist Items (Optional)</span>
              <span className="text-[10px] text-slate-500 font-normal">Mark done on-site</span>
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (taskInput.trim()) {
                      setTasks([...tasks, taskInput.trim()]);
                      setTaskInput('');
                    }
                  }
                }}
                placeholder="e.g. Replace shower seal, check lock..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (taskInput.trim()) {
                    setTasks([...tasks, taskInput.trim()]);
                    setTaskInput('');
                  }
                }}
                disabled={!taskInput.trim()}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 transition"
              >
                + Add
              </button>
            </div>

            {tasks.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {tasks.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <span className="text-slate-800">☐ {t}</span>
                    <button
                      type="button"
                      onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm hover:shadow transition"
            >
              Create & Place on Map
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
