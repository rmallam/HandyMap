import React, { useState, useMemo, useEffect } from 'react';
import { Job } from '../../types';
import {
  SavedAgent,
  SavedTenant,
  SavedOwner,
  SavedCustomer,
  loadSavedAgents,
  loadSavedTenants,
  loadSavedOwners,
  loadSavedCustomers,
  saveOrUpdateAgent,
  saveOrUpdateTenant,
  saveOrUpdateOwner,
  saveOrUpdateCustomer,
  deleteAgent,
  deleteTenant,
  deleteOwner,
  deleteCustomer,
  normalizePhone,
  harvestContactsFromJobs
} from '../../services/contactDirectory';
import {
  Building2,
  Users,
  User,
  Home,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Clock,
  Briefcase,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { formatPhoneNumber, cleanPhoneNumber, getPhoneDigitCount } from '../../utils/phoneUtils';
import { buildWhatsAppLink, buildSmsLink } from '../../utils/helpers';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import { exportContactsToExcel } from '../../services/excelDataService';
import { ImportContactsModal } from './ImportContactsModal';

export type ContactTabType = 'agents' | 'tenants' | 'owners' | 'customers';

interface ContactsViewProps {
  jobs: Job[];
  onOpenJob?: (job: Job) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ jobs, onOpenJob }) => {
  const [activeTab, setActiveTab] = useState<ContactTabType>('agents');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState('all');

  // Contact Directory lists
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [tenants, setTenants] = useState<SavedTenant[]>([]);
  const [owners, setOwners] = useState<SavedOwner[]>([]);
  const [customers, setCustomers] = useState<SavedCustomer[]>([]);

  // Modal State for Add / Edit & Excel Import
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContactTabType>('agents');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAgency, setFormAgency] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formSuburb, setFormSuburb] = useState('Point Cook');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Reload contacts on mount and after changes
  const reloadContacts = () => {
    setAgents(loadSavedAgents());
    setTenants(loadSavedTenants());
    setOwners(loadSavedOwners());
    setCustomers(loadSavedCustomers());
  };

  useEffect(() => {
    const existingA = loadSavedAgents();
    const existingT = loadSavedTenants();
    const existingC = loadSavedCustomers();
    if (existingA.length === 0 && existingT.length === 0 && existingC.length === 0 && jobs.length > 0) {
      harvestContactsFromJobs(jobs);
    }
    reloadContacts();
  }, [jobs]);

  // Unique Agencies list for filtering agents
  const availableAgencies = useMemo(() => {
    const list = Array.from(new Set(agents.map(a => a.agencyName.trim()).filter(Boolean)));
    return list.sort();
  }, [agents]);

  // Filtered lists based on search term
  const filteredAgents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return agents.filter(a => {
      const matchesSearch =
        !q ||
        a.agentName.toLowerCase().includes(q) ||
        a.agencyName.toLowerCase().includes(q) ||
        normalizePhone(a.agentPhone).includes(q) ||
        (a.agentEmail && a.agentEmail.toLowerCase().includes(q));

      const matchesAgency =
        selectedAgencyFilter === 'all' ||
        a.agencyName.toLowerCase() === selectedAgencyFilter.toLowerCase();

      return matchesSearch && matchesAgency;
    });
  }, [agents, searchTerm, selectedAgencyFilter]);

  const filteredTenants = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return tenants.filter(t => {
      return (
        !q ||
        t.tenantName.toLowerCase().includes(q) ||
        normalizePhone(t.tenantPhone).includes(q) ||
        (t.tenantEmail && t.tenantEmail.toLowerCase().includes(q)) ||
        (t.propertyAddress && t.propertyAddress.toLowerCase().includes(q)) ||
        (t.agencyName && t.agencyName.toLowerCase().includes(q))
      );
    });
  }, [tenants, searchTerm]);

  const filteredOwners = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return owners.filter(o => {
      return (
        !q ||
        o.ownerName.toLowerCase().includes(q) ||
        (o.ownerPhone && normalizePhone(o.ownerPhone).includes(q)) ||
        (o.ownerEmail && o.ownerEmail.toLowerCase().includes(q)) ||
        (o.propertyAddress && o.propertyAddress.toLowerCase().includes(q)) ||
        (o.agencyName && o.agencyName.toLowerCase().includes(q))
      );
    });
  }, [owners, searchTerm]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return customers.filter(c => {
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        normalizePhone(c.phone).includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.suburb && c.suburb.toLowerCase().includes(q))
      );
    });
  }, [customers, searchTerm]);

  // Open Modal to Create New Contact
  const handleOpenCreateModal = (type: ContactTabType = activeTab) => {
    triggerHapticFeedback('light');
    setEditingType(type);
    setEditingId(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAgency(type === 'agents' && selectedAgencyFilter !== 'all' ? selectedAgencyFilter : '');
    setFormAddress('');
    setFormSuburb('Point Cook');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Contact
  const handleOpenEditModal = (item: any, type: ContactTabType) => {
    triggerHapticFeedback('light');
    setEditingType(type);
    setEditingId(item.id);
    setFormError(null);

    if (type === 'agents') {
      const a = item as SavedAgent;
      setFormName(a.agentName);
      setFormPhone(formatPhoneNumber(a.agentPhone));
      setFormEmail(a.agentEmail || '');
      setFormAgency(a.agencyName);
      setFormAddress('');
      setFormNotes(a.notes || '');
    } else if (type === 'tenants') {
      const t = item as SavedTenant;
      setFormName(t.tenantName);
      setFormPhone(formatPhoneNumber(t.tenantPhone));
      setFormEmail(t.tenantEmail || '');
      setFormAgency(t.agencyName || '');
      setFormAddress(t.propertyAddress || '');
      setFormSuburb(t.suburb || 'Point Cook');
      setFormNotes(t.notes || '');
    } else if (type === 'owners') {
      const o = item as SavedOwner;
      setFormName(o.ownerName);
      setFormPhone(formatPhoneNumber(o.ownerPhone || ''));
      setFormEmail(o.ownerEmail || '');
      setFormAgency(o.agencyName || '');
      setFormAddress(o.propertyAddress || '');
      setFormSuburb(o.suburb || 'Point Cook');
      setFormNotes(o.notes || '');
    } else {
      const c = item as SavedCustomer;
      setFormName(c.name);
      setFormPhone(formatPhoneNumber(c.phone));
      setFormEmail(c.email || '');
      setFormAgency('');
      setFormAddress(c.address || '');
      setFormSuburb(c.suburb || 'Point Cook');
      setFormNotes(c.notes || '');
    }

    setIsModalOpen(true);
  };

  // Save Contact with Primary Key Validation
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Name is required.');
      return;
    }

    const cleanP = cleanPhoneNumber(formPhone);

    // Primary key validation: Phone number must not duplicate existing agents
    if (editingType === 'agents') {
      if (!cleanP || cleanP.length < 8) {
        setFormError('A valid phone number (minimum 8 digits) is required for real estate agents.');
        return;
      }
      if (!formAgency.trim()) {
        setFormError('Real Estate Agency name is required.');
        return;
      }

      // Check if another agent already has this phone number
      const existingByPhone = agents.find(
        a => normalizePhone(a.agentPhone) === cleanP && a.id !== editingId
      );
      if (existingByPhone) {
        if (
          !window.confirm(
            `Agent "${existingByPhone.agentName}" at "${existingByPhone.agencyName}" already has this phone number (${formPhone}).\n\nSaving will update their record to "${formAgency.trim()}". Continue?`
          )
        ) {
          return;
        }
      }

      saveOrUpdateAgent({
        agencyName: formAgency.trim(),
        agentName: formName.trim(),
        agentPhone: cleanP,
        agentEmail: formEmail.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
    } else if (editingType === 'tenants') {
      saveOrUpdateTenant({
        tenantName: formName.trim(),
        tenantPhone: cleanP || '0400 000 000',
        tenantEmail: formEmail.trim() || undefined,
        propertyAddress: formAddress.trim() || undefined,
        suburb: formSuburb,
        agencyName: formAgency.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
    } else if (editingType === 'owners') {
      saveOrUpdateOwner({
        ownerName: formName.trim(),
        ownerPhone: cleanP || undefined,
        ownerEmail: formEmail.trim() || undefined,
        propertyAddress: formAddress.trim() || undefined,
        suburb: formSuburb,
        agencyName: formAgency.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
    } else {
      saveOrUpdateCustomer({
        name: formName.trim(),
        phone: cleanP || '0400 000 000',
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        suburb: formSuburb,
        notes: formNotes.trim() || undefined
      });
    }

    triggerHapticFeedback('success');
    setIsModalOpen(false);
    reloadContacts();
  };

  // Delete Contact Handler
  const handleDeleteContact = (id: string, name: string, type: ContactTabType) => {
    triggerHapticFeedback('warning');
    if (!window.confirm(`Are you sure you want to delete "${name}" from your directory?`)) {
      return;
    }

    if (type === 'agents') {
      deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } else if (type === 'tenants') {
      deleteTenant(id);
      setTenants(prev => prev.filter(t => t.id !== id));
    } else if (type === 'owners') {
      deleteOwner(id);
      setOwners(prev => prev.filter(o => o.id !== id));
    } else {
      deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    }

    triggerHapticFeedback('success');
  };

  // Count active jobs for a contact
  const getAgentActiveJobsCount = (agentName: string, agencyName: string) => {
    return jobs.filter(
      j =>
        j.status !== 'invoiced' &&
        j.status !== 'cancelled' &&
        j.realEstateAgentName?.toLowerCase().trim() === agentName.toLowerCase().trim()
    ).length;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-slate-900 p-3 sm:p-6 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            <span>Contacts & Directory</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            Property managers, tenants, landlords & direct customers
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              exportContactsToExcel();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 font-bold text-xs shadow-2xs active:scale-95 transition"
            title="Export all contacts to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 font-bold text-xs shadow-2xs active:scale-95 transition"
            title="Import contacts from Excel or CSV"
          >
            <Upload className="w-4 h-4 text-blue-600 stroke-[2.2]" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal(activeTab)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="shrink-0 flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl mb-4 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback('light');
            setActiveTab('agents');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'agents'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-purple-600" />
          <span>Agents ({agents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback('light');
            setActiveTab('tenants');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'tenants'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Tenants ({tenants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback('light');
            setActiveTab('owners');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'owners'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-3.5 h-3.5 text-emerald-600" />
          <span>Owners ({owners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback('light');
            setActiveTab('customers');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'customers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 text-slate-700" />
          <span>Direct ({customers.length})</span>
        </button>
      </div>

      {/* Search & Agency Filter Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, agency, address or email..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeTab === 'agents' && availableAgencies.length > 0 && (
          <div className="shrink-0 min-w-[180px]">
            <select
              value={selectedAgencyFilter}
              onChange={e => setSelectedAgencyFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-purple-500 outline-none"
            >
              <option value="all">🏢 All Agencies ({agents.length})</option>
              {availableAgencies.map(ag => (
                <option key={ag} value={ag}>
                  {ag} ({agents.filter(a => a.agencyName === ag).length})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. AGENTS TAB */}
        {activeTab === 'agents' &&
          filteredAgents.map(agent => {
            const activeJobs = getAgentActiveJobsCount(agent.agentName, agent.agencyName);
            return (
              <div
                key={agent.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="font-black text-purple-900 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 truncate max-w-[170px]">
                      <Building2 className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                      <span className="truncate">{agent.agencyName}</span>
                    </span>
                    {activeJobs > 0 && (
                      <span className="font-mono text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full shrink-0">
                        {activeJobs} active {activeJobs === 1 ? 'job' : 'jobs'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-sm text-slate-900 leading-snug">{agent.agentName}</h3>

                  <div className="mt-2 space-y-1 text-xs">
                    {agent.agentPhone && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono font-bold">{formatPhoneNumber(agent.agentPhone)}</span>
                      </div>
                    )}
                    {agent.agentEmail && (
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate text-[11px] font-medium">{agent.agentEmail}</span>
                      </div>
                    )}
                    {agent.notes && (
                      <p className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 line-clamp-2 mt-1">
                        {agent.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {agent.agentPhone && (
                      <>
                        <a
                          href={`tel:${agent.agentPhone}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                          title="Call Agent"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <a
                          href={buildSmsLink(agent.agentPhone, `Hi ${agent.agentName}, regards HandyMap Pro...`)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95"
                          title="SMS Agent"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </a>
                        <a
                          href={buildWhatsAppLink(agent.agentPhone, `Hi ${agent.agentName}...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                          title="WhatsApp Agent"
                        >
                          <span className="text-[10px] font-black">WA</span>
                        </a>
                      </>
                    )}
                    {agent.agentEmail && (
                      <a
                        href={`mailto:${agent.agentEmail}`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition active:scale-95"
                        title="Email Agent"
                      >
                        <Mail className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(agent, 'agents')}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                      title="Edit Agent"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(agent.id, agent.agentName, 'agents')}
                      className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Agent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {/* 2. TENANTS TAB */}
        {activeTab === 'tenants' &&
          filteredTenants.map(tenant => (
            <div
              key={tenant.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="font-black text-blue-900 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 truncate max-w-[170px]">
                    <Users className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                    <span>Tenant / Occupant</span>
                  </span>
                  {tenant.agencyName && (
                    <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 truncate max-w-[120px]">
                      {tenant.agencyName}
                    </span>
                  )}
                </div>

                <h3 className="font-black text-sm text-slate-900 leading-snug">{tenant.tenantName}</h3>

                <div className="mt-2 space-y-1 text-xs">
                  {tenant.propertyAddress && (
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-xs">{tenant.propertyAddress}</span>
                    </div>
                  )}
                  {tenant.tenantPhone && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold">{formatPhoneNumber(tenant.tenantPhone)}</span>
                    </div>
                  )}
                  {tenant.tenantEmail && (
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-[11px] font-medium">{tenant.tenantEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  {tenant.tenantPhone && (
                    <>
                      <a
                        href={`tel:${tenant.tenantPhone}`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                        title="Call Tenant"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                      <a
                        href={buildSmsLink(tenant.tenantPhone, `Hi ${tenant.tenantName}, regarding maintenance...`)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95"
                        title="SMS Tenant"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </a>
                      <a
                        href={buildWhatsAppLink(tenant.tenantPhone, `Hi ${tenant.tenantName}...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                        title="WhatsApp Tenant"
                      >
                        <span className="text-[10px] font-black">WA</span>
                      </a>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(tenant, 'tenants')}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                    title="Edit Tenant"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(tenant.id, tenant.tenantName, 'tenants')}
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Tenant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

        {/* 3. OWNERS TAB */}
        {activeTab === 'owners' &&
          filteredOwners.map(owner => (
            <div
              key={owner.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="font-black text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 truncate">
                    <Home className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span>Property Owner / Landlord</span>
                  </span>
                  {owner.agencyName && (
                    <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 truncate max-w-[120px]">
                      {owner.agencyName}
                    </span>
                  )}
                </div>

                <h3 className="font-black text-sm text-slate-900 leading-snug">{owner.ownerName}</h3>

                <div className="mt-2 space-y-1 text-xs">
                  {owner.propertyAddress && (
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-xs">{owner.propertyAddress}</span>
                    </div>
                  )}
                  {owner.ownerPhone && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold">{formatPhoneNumber(owner.ownerPhone)}</span>
                    </div>
                  )}
                  {owner.ownerEmail && (
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-[11px] font-medium">{owner.ownerEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  {owner.ownerPhone && (
                    <>
                      <a
                        href={`tel:${owner.ownerPhone}`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                        title="Call Landlord"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                      <a
                        href={buildSmsLink(owner.ownerPhone, `Hi ${owner.ownerName}...`)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95"
                        title="SMS Landlord"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </a>
                    </>
                  )}
                  {owner.ownerEmail && (
                    <a
                      href={`mailto:${owner.ownerEmail}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition active:scale-95"
                      title="Email Landlord"
                    >
                      <Mail className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(owner, 'owners')}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                    title="Edit Owner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(owner.id, owner.ownerName, 'owners')}
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Owner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

        {/* 4. DIRECT CUSTOMERS TAB */}
        {activeTab === 'customers' &&
          filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="font-black text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 truncate">
                    <User className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                    <span>Direct Homeowner</span>
                  </span>
                  {customer.suburb && (
                    <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      {customer.suburb}
                    </span>
                  )}
                </div>

                <h3 className="font-black text-sm text-slate-900 leading-snug">{customer.name}</h3>

                <div className="mt-2 space-y-1 text-xs">
                  {customer.address && (
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-xs">{customer.address}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold">{formatPhoneNumber(customer.phone)}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-[11px] font-medium">{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  {customer.phone && (
                    <>
                      <a
                        href={`tel:${customer.phone}`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                      <a
                        href={buildSmsLink(customer.phone, `Hi ${customer.name}...`)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition active:scale-95"
                        title="SMS Customer"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </a>
                      <a
                        href={buildWhatsAppLink(customer.phone, `Hi ${customer.name}...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition active:scale-95"
                        title="WhatsApp Customer"
                      >
                        <span className="text-[10px] font-black">WA</span>
                      </a>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(customer, 'customers')}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(customer.id, customer.name, 'customers')}
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Empty State */}
      {((activeTab === 'agents' && filteredAgents.length === 0) ||
        (activeTab === 'tenants' && filteredTenants.length === 0) ||
        (activeTab === 'owners' && filteredOwners.length === 0) ||
        (activeTab === 'customers' && filteredCustomers.length === 0)) && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3 mt-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-black text-sm text-slate-900">No {activeTab} found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `No records match "${searchTerm}". Clear search or add a new contact.`
              : `Your ${activeTab} directory is empty. Add a new contact or upload a work order.`}
          </p>
          <button
            type="button"
            onClick={() => handleOpenCreateModal(activeTab)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs hover:bg-blue-700 transition"
          >
            + Add New {activeTab === 'agents' ? 'Agent' : activeTab === 'tenants' ? 'Tenant' : activeTab === 'owners' ? 'Owner' : 'Customer'}
          </button>
        </div>
      )}

      {/* CREATE / EDIT CONTACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  {editingType === 'agents' ? (
                    <Building2 className="w-4 h-4 stroke-[2.5]" />
                  ) : editingType === 'tenants' ? (
                    <Users className="w-4 h-4 stroke-[2.5]" />
                  ) : editingType === 'owners' ? (
                    <Home className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <User className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900 leading-snug">
                    {editingId ? 'Edit Contact' : 'Add New Contact'}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {editingType === 'agents'
                      ? 'Real Estate Agent / Property Manager'
                      : editingType === 'tenants'
                      ? 'On-site Occupant / Tenant'
                      : editingType === 'owners'
                      ? 'Property Owner / Landlord'
                      : 'Direct Client'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveContact} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Switcher when creating new */}
              {!editingId && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Contact Category</label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditingType('agents')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition ${
                        editingType === 'agents' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Agent
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingType('tenants')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition ${
                        editingType === 'tenants' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Tenant
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingType('owners')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition ${
                        editingType === 'owners' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingType('customers')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition ${
                        editingType === 'customers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Direct
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={
                    editingType === 'agents'
                      ? 'e.g. Makayla Hurinui'
                      : editingType === 'tenants'
                      ? 'e.g. Amitkumar Patel'
                      : 'e.g. John Smith'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              {/* Phone (Primary Key for Agents) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    Mobile Phone {editingType === 'agents' && <span className="text-rose-500">* (Primary Key)</span>}
                  </label>
                  {formPhone && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {getPhoneDigitCount(formPhone)} digits
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(formatPhoneNumber(e.target.value))}
                  placeholder="e.g. 0412 888 901"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:border-blue-500 focus:bg-white outline-none"
                />
                {editingType === 'agents' && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Unique identifier prevents adding this agent under duplicate agency names.
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="e.g. agent@agency.com.au"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              {/* Real Estate Agency Name (Agents, Tenants, Owners) */}
              {editingType !== 'customers' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    Real Estate Agency {editingType === 'agents' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formAgency}
                    onChange={e => setFormAgency(e.target.value)}
                    placeholder="e.g. Reliance Real Estate, YPA, Ray White..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
              )}

              {/* Property Address (Tenants, Owners, Customers) */}
              {editingType !== 'agents' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Property Street Address</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    placeholder="e.g. 21 Alverton Drive"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Gate code, lockbox, preferred contact hours..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-blue-500 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition active:scale-95"
                >
                  {editingId ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel / CSV Contacts Import Modal */}
      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          reloadContacts();
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
};
