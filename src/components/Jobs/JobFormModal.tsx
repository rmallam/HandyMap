import React, { useState, useEffect, useRef } from 'react';
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
  Briefcase,
  Users,
  ChevronDown,
  ArrowRight,
  UploadCloud,
  Loader2,
  Clipboard,
  RefreshCw,
  FileUp
} from 'lucide-react';
import { AddressAutocomplete, AddressResult } from '../Common/AddressAutocomplete';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import {
  extractTextFromPdfFile,
  parseWorkOrderText,
  geocodeAustralianAddress,
  ParsedWorkOrder
} from '../../services/workOrderParser';
import { ensurePrefix, buildCompositeJobId, stripIdPrefix } from '../../utils/helpers';
import {
  formatPhoneNumber,
  cleanPhoneNumber,
  isValid10DigitPhone,
  getPhoneDigitCount
} from '../../utils/phoneUtils';
import {
  loadSavedCustomers,
  loadSavedAgents,
  loadSavedOwners,
  searchSavedCustomers,
  searchSavedAgents,
  searchSavedOwners,
  findCustomerByPhone,
  findAgentByPhone,
  findOwnerByPhone,
  findAgentsByAgency,
  saveOrUpdateCustomer,
  saveOrUpdateAgent,
  saveOrUpdateOwner,
  SavedCustomer,
  SavedAgent,
  SavedOwner
} from '../../services/contactDirectory';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newJob: Job) => void;
  currentLocation: [number, number];
  initialWorkOrder?: { parsed: ParsedWorkOrder; filename: string } | null;
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
  currentLocation,
  initialWorkOrder
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
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
  
  // Structured Job / Quote / Invoice Reference IDs
  const [jobNumberInput, setJobNumberInput] = useState('');
  const [quoteNumberInput, setQuoteNumberInput] = useState('');
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [nteLimitInput, setNteLimitInput] = useState<string>('');

  // Real Estate Agency Fields
  const [isAgencyJob, setIsAgencyJob] = useState(false);
  const [realEstateAgency, setRealEstateAgency] = useState('');
  const [realEstateAgentName, setRealEstateAgentName] = useState('');
  const [realEstateAgentPhone, setRealEstateAgentPhone] = useState('');
  const [realEstateAgentEmail, setRealEstateAgentEmail] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');

  // Tenant 1 & Tenant 2 Details
  const [tenant1Name, setTenant1Name] = useState('');
  const [tenant1Phone, setTenant1Phone] = useState('');
  const [tenant1Email, setTenant1Email] = useState('');
  const [tenant2Name, setTenant2Name] = useState('');
  const [tenant2Phone, setTenant2Phone] = useState('');
  const [tenant2Email, setTenant2Email] = useState('');
  const [showTenant2, setShowTenant2] = useState(false);
  const [showDirectTenants, setShowDirectTenants] = useState(false);
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);

  // Rolodex / Contact Directory State
  const [savedCustomers, setSavedCustomers] = useState<SavedCustomer[]>([]);
  const [savedAgents, setSavedAgents] = useState<SavedAgent[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<SavedCustomer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [agentSuggestions, setAgentSuggestions] = useState<SavedAgent[]>([]);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [activeAgentField, setActiveAgentField] = useState<'agency' | 'agentName' | null>(null);
  const [matchedAgentByPhone, setMatchedAgentByPhone] = useState<SavedAgent | null>(null);
  const [matchedCustomerByPhone, setMatchedCustomerByPhone] = useState<SavedCustomer | null>(null);
  const [showSavedCustomersList, setShowSavedCustomersList] = useState(false);
  const agentSectionRef = useRef<HTMLDivElement>(null);
  const customerSectionRef = useRef<HTMLDivElement>(null);

  // Work Order Importer State (100% Free, zero AI cost)
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const customerInputRef = useRef<HTMLInputElement>(null);
  const agencyInputRef = useRef<HTMLInputElement>(null);

  // Apply parsed work order fields to form state
  const handleApplyParsedWorkOrder = async (parsed: ParsedWorkOrder, sourceName: string) => {
    triggerHapticFeedback('success');
    if (parsed.title) setTitle(parsed.title);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.workOrderNumber) {
      setWorkOrderNumber(parsed.workOrderNumber);
      setJobNumberInput(stripIdPrefix(parsed.workOrderNumber, 'J'));
    }
    if (parsed.realEstateAgency) {
      setIsAgencyJob(true);
      setRealEstateAgency(parsed.realEstateAgency);
    }
    if (parsed.propertyManager) setRealEstateAgentName(parsed.propertyManager);
    if (parsed.realEstatePhone) setRealEstateAgentPhone(parsed.realEstatePhone);
    if (parsed.realEstateEmail) setRealEstateAgentEmail(parsed.realEstateEmail);
    if (parsed.address) setAddress(parsed.address);
    if (parsed.suburb) setSuburb(parsed.suburb);
    if (parsed.ownerName) setOwnerName(parsed.ownerName);
    else if (parsed.clientName) setOwnerName(parsed.clientName);
    if (parsed.ownerPhone) setOwnerPhone(parsed.ownerPhone);
    else if (parsed.clientPhone) setOwnerPhone(parsed.clientPhone);
    if (parsed.ownerEmail) setOwnerEmail(parsed.ownerEmail);
    else if (parsed.clientEmail) setOwnerEmail(parsed.clientEmail);
    if (parsed.tenant1Name) setTenant1Name(parsed.tenant1Name);
    if (parsed.tenant1Phone) setTenant1Phone(parsed.tenant1Phone);
    if (parsed.tenant1Email) setTenant1Email(parsed.tenant1Email);
    if (parsed.hasTenant2 && parsed.tenant2Name) {
      setShowTenant2(true);
      setTenant2Name(parsed.tenant2Name);
      setTenant2Phone(parsed.tenant2Phone);
      setTenant2Email(parsed.tenant2Email);
    }
    if (parsed.tasks && parsed.tasks.length > 0) {
      setTasks(parsed.tasks);
    }
    if (parsed.category) {
      setCategory(parsed.category);
    }
    if (parsed.nteLimit) {
      setNteLimitInput(String(parsed.nteLimit));
    } else {
      setNteLimitInput('');
    }
    setStatus('quote_requested');

    // Attempt high-accuracy geocoding with user's current GPS location bias
    if (parsed.address) {
      setIsGeocodingAddress(true);
      geocodeAustralianAddress(parsed.address, currentLocation)
        .then(result => {
          setIsGeocodingAddress(false);
          if (result && result.coordinates) {
            setSelectedCoordinates(result.coordinates);
            if (result.suburb) {
              const matchedSub = SUBURBS_LIST.find(s => s.toLowerCase() === result.suburb!.toLowerCase());
              if (matchedSub) setSuburb(matchedSub);
              else setSuburb(result.suburb);
            }
          }
        })
        .catch(err => {
          console.warn('Geocoding notice:', err);
          setIsGeocodingAddress(false);
        });
    }

    setImportSuccessMsg(
      `✓ Parsed from ${sourceName} (${parsed.realEstateAgency || 'Real Estate'} #${parsed.workOrderNumber || 'WO'})`
    );
    setImportErrorMsg(null);
    setShowPasteBox(false);
  };

  const handlePdfFileSelect = async (file: File) => {
    if (!file) return;
    setIsImportingPdf(true);
    setImportErrorMsg(null);
    try {
      triggerHapticFeedback('light');
      const text = await extractTextFromPdfFile(file);
      if (!text || text.trim().length < 15) {
        setImportErrorMsg('Could not read digital text from this PDF. (Scanned image PDFs require digital text).');
        triggerHapticFeedback('error');
        return;
      }
      const parsed = parseWorkOrderText(text);
      await handleApplyParsedWorkOrder(parsed, file.name);
    } catch (err: any) {
      console.error('Failed to parse PDF:', err);
      setImportErrorMsg('Failed to process PDF. You can also paste the email text below.');
      triggerHapticFeedback('error');
    } finally {
      setIsImportingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handlePastedTextSubmit = async () => {
    if (!pastedText.trim()) return;
    setIsImportingPdf(true);
    setImportErrorMsg(null);
    try {
      const parsed = parseWorkOrderText(pastedText);
      await handleApplyParsedWorkOrder(parsed, 'Pasted Work Order');
      setPastedText('');
    } catch (err) {
      setImportErrorMsg('Could not extract fields from pasted text.');
    } finally {
      setIsImportingPdf(false);
    }
  };

  // Load directory on open
  useEffect(() => {
    if (isOpen) {
      const customers = loadSavedCustomers();
      const agents = loadSavedAgents();
      setSavedCustomers(customers);
      setSavedAgents(agents);
      setCustomerSuggestions([]);
      setAgentSuggestions([]);
      setShowCustomerDropdown(false);
      setShowAgentDropdown(false);
      setMatchedCustomerByPhone(null);
      setShowSavedCustomersList(false);
      setPhoneValidationError(null);
      setImportSuccessMsg(null);
      setImportErrorMsg(null);
      setShowPasteBox(false);
      setPastedText('');
      if (initialWorkOrder) {
        handleApplyParsedWorkOrder(initialWorkOrder.parsed, initialWorkOrder.filename);
      } else {
        setTitle('');
        setOwnerName('');
        setOwnerPhone('');
        setOwnerEmail('');
        setAddress('');
        setSuburb('Point Cook');
        setSelectedCoordinates(null);
        setCategory('General Repair');
        setPriority('medium');
        setStatus('quote_requested');
        setDescription('');
        setTasks([]);
        setJobNumberInput('');
        setQuoteNumberInput('');
        setInvoiceNumberInput('');
        setNteLimitInput('');
        setIsAgencyJob(false);
        setRealEstateAgency('');
        setRealEstateAgentName('');
        setRealEstateAgentPhone('');
        setRealEstateAgentEmail('');
        setWorkOrderNumber('');
        setTenant1Name('');
        setTenant1Phone('');
        setTenant1Email('');
        setTenant2Name('');
        setTenant2Phone('');
        setTenant2Email('');
        setRealEstateAgentEmail('');
        setShowTenant2(false);
        setShowDirectTenants(false);
      }
    }
  }, [isOpen, initialWorkOrder]);

  // Visual helper badge for 10-digit phone inputs
  const renderPhoneBadge = (phoneStr: string) => {
    const count = getPhoneDigitCount(phoneStr);
    if (count === 10) {
      return (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          10 digits ✓
        </span>
      );
    }
    if (count > 0) {
      return (
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          {count}/10 digits
        </span>
      );
    }
    return (
      <span className="text-[10px] text-slate-400 font-medium">
        10 digits (AU)
      </span>
    );
  };

  // Owner Name change with autocomplete search
  const handleOwnerNameChange = (val: string) => {
    setOwnerName(val);
    if (val.trim().length >= 2) {
      const matches = searchSavedCustomers(val, 4);
      setCustomerSuggestions(matches);
      setShowCustomerDropdown(matches.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowCustomerDropdown(false);
    }
  };

  // Owner Phone change with smart customer/owner auto-match and strict 10-digit formatting
  const handleOwnerPhoneChange = (val: string) => {
    const formatted = formatPhoneNumber(val);
    setOwnerPhone(formatted);
    setPhoneValidationError(null);
    const digits = cleanPhoneNumber(formatted);
    if (digits.length >= 8) {
      const foundOwner = findOwnerByPhone(digits);
      const found = foundOwner 
        ? { id: foundOwner.id, name: foundOwner.ownerName, phone: foundOwner.ownerPhone || '', email: foundOwner.ownerEmail, address: foundOwner.propertyAddress, suburb: foundOwner.suburb, coordinates: [0, 0] as [number, number], lastUsedAt: foundOwner.lastUsedAt, useCount: foundOwner.useCount }
        : findCustomerByPhone(digits);

      if (found && found.name.toLowerCase() !== ownerName.trim().toLowerCase()) {
        setMatchedCustomerByPhone(found);
      } else {
        setMatchedCustomerByPhone(null);
      }
    } else {
      setMatchedCustomerByPhone(null);
    }
  };

  // Apply selected customer/owner
  const handleSelectCustomer = (cust: SavedCustomer) => {
    triggerHapticFeedback('success');
    setOwnerName(cust.name);
    setOwnerPhone(cust.phone);
    if (cust.email) setOwnerEmail(cust.email);
    if (cust.address) setAddress(cust.address);
    if (cust.suburb) setSuburb(cust.suburb);
    if (cust.coordinates && cust.coordinates[0] !== 0) setSelectedCoordinates(cust.coordinates);
    setShowCustomerDropdown(false);
    setShowSavedCustomersList(false);
    setMatchedCustomerByPhone(null);
  };

  // Agency change with autocomplete search
  const handleAgencyChange = (val: string) => {
    setRealEstateAgency(val);
    setActiveAgentField('agency');
    if (val.trim().length >= 2) {
      const matches = searchSavedAgents(val, 5);
      setAgentSuggestions(matches);
      setShowAgentDropdown(matches.length > 0);

      // Auto-populate if exact match and single agent saved and PM name is not yet custom
      const exactMatchAgents = matches.filter(a => a.agencyName.toLowerCase() === val.trim().toLowerCase());
      if (exactMatchAgents.length === 1 && (!realEstateAgentName || realEstateAgentName === 'Property Manager')) {
        const ag = exactMatchAgents[0];
        setRealEstateAgentName(ag.agentName);
        setRealEstateAgentPhone(formatPhoneNumber(ag.agentPhone));
        if (ag.agentEmail) setRealEstateAgentEmail(ag.agentEmail);
      }
    } else {
      setAgentSuggestions([]);
      setShowAgentDropdown(false);
    }
  };

  // Agent Name change with autocomplete search
  const handleAgentNameChange = (val: string) => {
    setRealEstateAgentName(val);
    setActiveAgentField('agentName');
    if (val.trim().length >= 2) {
      const matches = searchSavedAgents(val, 5);
      setAgentSuggestions(matches);
      setShowAgentDropdown(matches.length > 0);

      // If exact agent name match and agency is empty, auto-populate agency, phone, email
      const exactMatches = matches.filter(a => a.agentName.toLowerCase() === val.trim().toLowerCase());
      if (exactMatches.length === 1 && !realEstateAgency) {
        const ag = exactMatches[0];
        setRealEstateAgency(ag.agencyName);
        setRealEstateAgentPhone(formatPhoneNumber(ag.agentPhone));
        if (ag.agentEmail) setRealEstateAgentEmail(ag.agentEmail);
      }
    } else {
      setAgentSuggestions([]);
      setShowAgentDropdown(false);
    }
  };

  // Agent Phone change with smart directory match
  const handleRealEstateAgentPhoneChange = (val: string) => {
    const formatted = formatPhoneNumber(val);
    setRealEstateAgentPhone(formatted);
    const digits = cleanPhoneNumber(formatted);
    if (digits.length >= 8) {
      const found = findAgentByPhone(digits);
      if (found && (found.agentName.toLowerCase() !== realEstateAgentName.trim().toLowerCase() || found.agencyName.toLowerCase() !== realEstateAgency.trim().toLowerCase())) {
        setMatchedAgentByPhone(found);
      } else {
        setMatchedAgentByPhone(null);
      }
    } else {
      setMatchedAgentByPhone(null);
    }
  };

  // Apply selected agent
  const handleSelectAgent = (agent: SavedAgent) => {
    triggerHapticFeedback('success');
    setRealEstateAgency(agent.agencyName);
    setRealEstateAgentName(agent.agentName);
    setRealEstateAgentPhone(formatPhoneNumber(agent.agentPhone));
    setRealEstateAgentEmail(agent.agentEmail || '');
    setShowAgentDropdown(false);
    setMatchedAgentByPhone(null);
  };

  // Click outside to dismiss suggestions dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (agentSectionRef.current && !agentSectionRef.current.contains(e.target as Node)) {
        setShowAgentDropdown(false);
      }
      if (customerSectionRef.current && !customerSectionRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    if (showAgentDropdown || showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAgentDropdown, showCustomerDropdown]);

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

    const effectiveOwnerName = ownerName.trim() || (isAgencyJob ? (tenant1Name.trim() || realEstateAgentName.trim() || realEstateAgency.trim() || 'Owner') : '');
    if (!title.trim() || (!effectiveOwnerName && !isAgencyJob)) return;

    // Validate 10-digit Australian phone numbers
    if (ownerPhone.trim() && cleanPhoneNumber(ownerPhone).length !== 10) {
      setPhoneValidationError('Owner phone must be exactly 10 digits (e.g. 0412 345 678).');
      triggerHapticFeedback('error');
      return;
    }
    if (realEstateAgentPhone.trim() && cleanPhoneNumber(realEstateAgentPhone).length !== 10) {
      setPhoneValidationError('Property Manager phone must be exactly 10 digits (e.g. 0412 888 901).');
      triggerHapticFeedback('error');
      return;
    }
    if (tenant1Phone.trim() && cleanPhoneNumber(tenant1Phone).length !== 10) {
      setPhoneValidationError('Tenant 1 phone must be exactly 10 digits (e.g. 0412 345 678).');
      triggerHapticFeedback('error');
      return;
    }
    if (tenant2Phone.trim() && cleanPhoneNumber(tenant2Phone).length !== 10) {
      setPhoneValidationError('Tenant 2 phone must be exactly 10 digits (e.g. 0412 987 654).');
      triggerHapticFeedback('error');
      return;
    }
    setPhoneValidationError(null);

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

    const finalJobNum = jobNumberInput.trim() ? ensurePrefix(jobNumberInput.trim(), 'J-') : '';
    const finalQuoteNum = quoteNumberInput.trim() ? ensurePrefix(quoteNumberInput.trim(), 'Q-') : '';
    const finalInvoiceNum = invoiceNumberInput.trim() ? ensurePrefix(invoiceNumberInput.trim(), 'I-') : '';
    const randomJobNum = Math.floor(1000 + Math.random() * 9000);
    const jobNumber = buildCompositeJobId(finalJobNum, finalQuoteNum, finalInvoiceNum) || `J-${randomJobNum}`;

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

    const finalOwnerPhone = ownerPhone.trim() || (isAgencyJob ? tenant1Phone.trim() : '0412 555 019');
    const finalOwnerEmail = ownerEmail.trim() || (isAgencyJob ? tenant1Email.trim() : `${(effectiveOwnerName || 'owner').toLowerCase().replace(/\s+/g, '.')}@gmail.com`);
    const finalAddress = address.trim() || `${suburb} VIC 3030`;

    // Persist to Contact Directory (Zero-risk, background safe)
    try {
      if (ownerName.trim()) {
        saveOrUpdateOwner({
          ownerName: ownerName.trim(),
          ownerPhone: finalOwnerPhone,
          ownerEmail: finalOwnerEmail,
          propertyAddress: finalAddress,
          suburb,
          agencyName: isAgencyJob ? realEstateAgency.trim() : undefined
        });
      }
      saveOrUpdateCustomer({
        name: effectiveOwnerName,
        phone: finalOwnerPhone,
        email: finalOwnerEmail,
        address: finalAddress,
        suburb,
        coordinates
      });

      if (isAgencyJob && realEstateAgency.trim()) {
        saveOrUpdateAgent({
          agencyName: realEstateAgency.trim(),
          agentName: realEstateAgentName.trim() || 'Property Manager',
          agentPhone: realEstateAgentPhone.trim(),
          agentEmail: realEstateAgentEmail.trim() || undefined
        });
      }
    } catch (err) {
      console.warn('Silent contact directory save notice:', err);
    }

    const parsedLimit = parseFloat(nteLimitInput);
    const initialQuote = !isNaN(parsedLimit) && parsedLimit > 0 ? {
      id: `quote-${Date.now()}`,
      quoteNumber: finalQuoteNum || `Q-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{
        id: `item-${Date.now()}-1`,
        type: 'labor' as const,
        description: title.trim() || 'Work Order Maintenance',
        quantity: 1,
        unitPrice: parsedLimit,
        total: parsedLimit
      }],
      hourlyLaborRate: 85,
      estimatedLaborHours: 1,
      taxRatePercent: 10,
      discountAmount: 0,
      subtotal: parsedLimit,
      taxAmount: 0,
      totalAmount: parsedLimit,
      notes: isAgencyJob && realEstateAgency ? `Approved Work Order Limit (${realEstateAgency})` : 'Work Order Estimate',
      status: 'accepted' as const
    } : undefined;

    const newJob: Job = {
      id: `job-${Date.now()}`,
      jobNumber,
      quoteNumber: finalQuoteNum || undefined,
      invoiceNumber: finalInvoiceNum || undefined,
      title: title.trim(),
      ownerName: ownerName.trim() || (isAgencyJob ? undefined : effectiveOwnerName),
      ownerPhone: ownerPhone.trim() || (isAgencyJob ? undefined : finalOwnerPhone),
      ownerEmail: ownerEmail.trim() || (isAgencyJob ? undefined : finalOwnerEmail),
      clientName: effectiveOwnerName,
      clientPhone: finalOwnerPhone,
      clientEmail: finalOwnerEmail,
      address: finalAddress,
      suburb,
      coordinates,
      status,
      priority,
      category,
      description: description.trim() || 'Customer requested on-site estimate and inspection.',
      tasks: initialTasks,
      quote: initialQuote,
      quoteRequestedDate: new Date().toISOString(),
      appointmentTime: appointmentTime ? new Date(appointmentTime).toISOString() : undefined,
      estimatedDurationMinutes: durationMin,
      
      // Agency details
      isAgencyJob,
      realEstateAgency: isAgencyJob ? realEstateAgency.trim() : undefined,
      realEstateAgentName: isAgencyJob ? realEstateAgentName.trim() : undefined,
      realEstateAgentPhone: isAgencyJob ? realEstateAgentPhone.trim() : undefined,
      realEstateAgentEmail: isAgencyJob && realEstateAgentEmail.trim() ? realEstateAgentEmail.trim() : undefined,
      workOrderNumber: isAgencyJob && workOrderNumber.trim() ? workOrderNumber.trim() : undefined,
      tenantName: (tenant1Name.trim() || (!isAgencyJob ? undefined : effectiveOwnerName)) || undefined,
      tenantPhone: (tenant1Phone.trim() || (isAgencyJob ? finalOwnerPhone : undefined)) || undefined,
      tenantEmail: (tenant1Email.trim() || (isAgencyJob ? finalOwnerEmail : undefined)) || undefined,
      tenant1Name: tenant1Name.trim() || undefined,
      tenant1Phone: tenant1Phone.trim() || undefined,
      tenant1Email: tenant1Email.trim() || undefined,
      tenant2Name: tenant2Name.trim() || undefined,
      tenant2Phone: tenant2Phone.trim() || undefined,
      tenant2Email: tenant2Email.trim() || undefined,

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

        {/* Validation Error Banner */}
        {phoneValidationError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{phoneValidationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 text-xs">
          
          {/* ----------------------------------------------------------------- */}
          {/* ----------------------------------------------------------------- */}
          {/* WORK ORDER PDF / EMAIL AUTO-FILL HERO CARD                        */}
          {/* ----------------------------------------------------------------- */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDraggingPdf(true);
            }}
            onDragLeave={() => setIsDraggingPdf(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDraggingPdf(false);
              const file = e.dataTransfer.files?.[0];
              if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
                handlePdfFileSelect(file);
              }
            }}
            className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
              isDraggingPdf
                ? 'bg-blue-100 border-blue-500 ring-4 ring-blue-400/30 shadow-lg scale-[1.01]'
                : importSuccessMsg
                ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white border-slate-800 shadow-md'
            }`}
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={pdfInputRef}
              accept=".pdf,application/pdf"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePdfFileSelect(file);
              }}
              className="hidden"
            />

            <div className="p-3.5 sm:p-4">
              {importSuccessMsg ? (
                /* Success State Banner */
                <div className="flex items-center justify-between gap-3 text-emerald-900">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-xs sm:text-sm text-emerald-950 truncate">
                        {importSuccessMsg}
                      </div>
                      <p className="text-[11px] text-emerald-700 truncate">
                        Form auto-filled with address, tenants, property manager & scope!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback('light');
                      pdfInputRef.current?.click();
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs active:scale-95 transition"
                  >
                    Change PDF
                  </button>
                </div>
              ) : (
                /* High-Visibility Upload Banner */
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
                        <FileUp className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm text-white tracking-tight">
                            Auto-Fill from Work Order PDF
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                            100% Free
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Drop Reliance, Ray White or PropertyMe PDF to fill fields instantly
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Big Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isImportingPdf}
                      onClick={() => {
                        triggerHapticFeedback('light');
                        pdfInputRef.current?.click();
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-black text-xs shadow-md shadow-blue-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isImportingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Reading PDF...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Select PDF File</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback('light');
                        setShowPasteBox(!showPasteBox);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Clipboard className="w-4 h-4 text-blue-300" />
                      <span>{showPasteBox ? 'Close Paste' : 'Paste Email'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {importErrorMsg && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{importErrorMsg}</span>
                </div>
              )}

              {/* Expandable Quick Paste Box */}
              {showPasteBox && (
                <div className="mt-3 pt-3 border-t border-white/15 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      Paste Work Order Email or Text:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasteBox(false)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Paste email body or text (e.g. Property: 111/38 Clark St, Tenant: Priyanka 0434...)"
                    className="w-full bg-slate-900/90 border border-slate-700 text-white rounded-xl p-2.5 text-xs placeholder:text-slate-500 focus:border-blue-400 outline-none resize-none font-mono"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!pastedText.trim() || isImportingPdf}
                      onClick={handlePastedTextSubmit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs disabled:opacity-40 transition active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Parse & Auto-Fill Form</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
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

            {/* Structured Job / Quote / Invoice IDs (Trade Category hidden for now) */}
            <div className="pt-1">
              <label className="text-[10px] font-bold text-slate-600 block mb-1.5">
                Job / Quote / Invoice Ref Numbers
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">
                    Job #
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <span className="px-2 py-2 text-xs font-mono font-bold text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
                      J-
                    </span>
                    <input
                      type="text"
                      value={stripIdPrefix(jobNumberInput, 'J')}
                      onChange={e => setJobNumberInput(stripIdPrefix(e.target.value, 'J'))}
                      placeholder="1001"
                      className="w-full bg-transparent px-2.5 py-2 text-slate-900 font-mono text-xs font-semibold placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">
                    Quote #
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <span className="px-2 py-2 text-xs font-mono font-bold text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
                      Q-
                    </span>
                    <input
                      type="text"
                      value={stripIdPrefix(quoteNumberInput, 'Q')}
                      onChange={e => setQuoteNumberInput(stripIdPrefix(e.target.value, 'Q'))}
                      placeholder="1001"
                      className="w-full bg-transparent px-2.5 py-2 text-slate-900 font-mono text-xs font-semibold placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">
                    Invoice #
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <span className="px-2 py-2 text-xs font-mono font-bold text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
                      I-
                    </span>
                    <input
                      type="text"
                      value={stripIdPrefix(invoiceNumberInput, 'I')}
                      onChange={e => setInvoiceNumberInput(stripIdPrefix(e.target.value, 'I'))}
                      placeholder="1001"
                      className="w-full bg-transparent px-2.5 py-2 text-slate-900 font-mono text-xs font-semibold placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
                <span>Display:</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 truncate">
                  {buildCompositeJobId(
                    jobNumberInput ? ensurePrefix(jobNumberInput, 'J-') : '',
                    quoteNumberInput ? ensurePrefix(quoteNumberInput, 'Q-') : '',
                    invoiceNumberInput ? ensurePrefix(invoiceNumberInput, 'I-') : ''
                  ) || 'J-... (Auto-assigned if left blank)'}
                </span>
              </div>
            </div>

            {/* Approved Budget / Quote Limit */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 block">
                  Approved Budget / Quote Limit ($)
                </label>
                <span className="text-[9px] text-slate-400 font-medium">
                  {nteLimitInput && !isNaN(parseFloat(nteLimitInput))
                    ? `Pre-approved quote: $${parseFloat(nteLimitInput).toFixed(2)}`
                    : 'Leave blank if quoting later'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nteLimitInput}
                  onChange={e => setNteLimitInput(e.target.value)}
                  placeholder="e.g. 350.00 (From work order NTE limit or phone estimate)"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-slate-900 font-mono text-xs font-semibold placeholder:text-slate-400 placeholder:font-normal focus:border-blue-500 outline-none"
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
                placeholder="Details of owner request, parts required, or site access instructions..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 text-xs placeholder:text-slate-400 focus:border-blue-500 outline-none resize-none transition"
              />
            </div>
          </div>

          {/* SECTION 2: REAL ESTATE AGENCY TOGGLE & AUTOSUGGEST */}
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
                  <div className="font-bold text-slate-900 text-xs">Real Estate Agency</div>
                  <div className="text-[11px] text-slate-500">Auto-populates saved agency & property manager contacts</div>
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
              <div ref={agentSectionRef} className="space-y-3 pt-3 mt-3 border-t border-purple-200/80 animate-in fade-in">
                {/* Saved Agents Quick-Select Chips */}
                {savedAgents.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider block">
                      Saved Property Managers ({savedAgents.length})
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {savedAgents.slice(0, 6).map(ag => (
                        <button
                          key={ag.id}
                          type="button"
                          onClick={() => handleSelectAgent(ag)}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 text-purple-900 font-bold text-[11px] whitespace-nowrap shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Building2 className="w-3 h-3 text-purple-600" />
                          <span>{ag.agencyName}</span>
                          <span className="text-purple-400">•</span>
                          <span className="text-purple-700">{ag.agentName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Known agents for selected agency */}
                {realEstateAgency.trim() && (() => {
                  const agencyAgents = savedAgents.filter(a =>
                    a.agencyName.toLowerCase() === realEstateAgency.trim().toLowerCase() ||
                    realEstateAgency.trim().toLowerCase().includes(a.agencyName.toLowerCase())
                  );
                  if (agencyAgents.length === 0) return null;
                  return (
                    <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-purple-100/60 border border-purple-200">
                      <span className="text-[10px] font-bold text-purple-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Saved contacts for this agency:
                      </span>
                      {agencyAgents.map(ag => (
                        <button
                          key={ag.id}
                          type="button"
                          onClick={() => handleSelectAgent(ag)}
                          className="px-2 py-0.5 rounded-lg bg-white hover:bg-purple-50 text-purple-900 font-bold text-[10px] border border-purple-200 transition active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <span>{ag.agentName}</span>
                          <span className="text-purple-600 font-mono text-[9px]">({ag.agentPhone})</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                  {/* Agency Partner */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-purple-950 block mb-1">
                      Agency Partner *
                    </label>
                    <input
                      ref={agencyInputRef}
                      type="text"
                      list="agency-suggestions"
                      value={realEstateAgency}
                      onChange={e => handleAgencyChange(e.target.value)}
                      onFocus={() => {
                        if (realEstateAgency.trim().length >= 2) {
                          const matches = searchSavedAgents(realEstateAgency, 5);
                          setAgentSuggestions(matches);
                          setActiveAgentField('agency');
                          setShowAgentDropdown(matches.length > 0);
                        }
                      }}
                      placeholder="e.g., Ray White Point Cook"
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-purple-600"
                    />
                    <datalist id="agency-suggestions">
                      {REAL_ESTATE_AGENCIES.map(a => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>

                    {/* Agent Suggestions Dropdown under Agency Partner */}
                    {showAgentDropdown && activeAgentField === 'agency' && agentSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-purple-100 animate-in fade-in">
                        {agentSuggestions.map(ag => (
                          <div
                            key={ag.id}
                            onClick={() => handleSelectAgent(ag)}
                            className="p-2.5 hover:bg-purple-50 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-purple-950 text-xs">{ag.agencyName}</div>
                              <div className="text-[11px] text-purple-700">
                                {ag.agentName} • {ag.agentPhone}{ag.agentEmail ? ` • ${ag.agentEmail}` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              Auto-fill
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property Manager Name */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-purple-950 block mb-1">
                      Property Manager Name
                    </label>
                    <input
                      type="text"
                      value={realEstateAgentName}
                      onChange={e => handleAgentNameChange(e.target.value)}
                      onFocus={() => {
                        if (realEstateAgentName.trim().length >= 2) {
                          const matches = searchSavedAgents(realEstateAgentName, 5);
                          setAgentSuggestions(matches);
                          setActiveAgentField('agentName');
                          setShowAgentDropdown(matches.length > 0);
                        }
                      }}
                      placeholder="e.g., Sarah Jenkins"
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-purple-600"
                    />

                    {/* Agent Suggestions Dropdown under Property Manager Name */}
                    {showAgentDropdown && activeAgentField === 'agentName' && agentSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-purple-100 animate-in fade-in">
                        {agentSuggestions.map(ag => (
                          <div
                            key={ag.id}
                            onClick={() => handleSelectAgent(ag)}
                            className="p-2.5 hover:bg-purple-50 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-purple-950 text-xs">{ag.agentName}</div>
                              <div className="text-[11px] text-purple-700">
                                {ag.agencyName} • {ag.agentPhone}{ag.agentEmail ? ` • ${ag.agentEmail}` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              Auto-fill
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property Manager Phone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-purple-950">
                        Property Manager Phone
                      </label>
                      {renderPhoneBadge(realEstateAgentPhone)}
                    </div>
                    <input
                      type="tel"
                      value={realEstateAgentPhone}
                      onChange={e => handleRealEstateAgentPhoneChange(e.target.value)}
                      placeholder="e.g., 0412 888 901"
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs outline-none focus:border-purple-600"
                    />
                  </div>

                  {/* Property Manager / Agent Email */}
                  <div>
                    <label className="text-[10px] font-bold text-purple-950 block mb-1">
                      Property Manager / Agent Email
                    </label>
                    <input
                      type="email"
                      value={realEstateAgentEmail}
                      onChange={e => setRealEstateAgentEmail(e.target.value)}
                      placeholder="e.g., sarah.j@raywhite.com"
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-purple-600"
                    />
                  </div>

                  {/* Smart Phone Match Banner for Agent Phone */}
                  {matchedAgentByPhone && (
                    <div className="sm:col-span-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between gap-2 animate-in fade-in">
                      <div className="min-w-0">
                        <div className="font-bold text-purple-950 text-xs flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate">Saved Agent: {matchedAgentByPhone.agentName} ({matchedAgentByPhone.agencyName})</span>
                        </div>
                        <div className="text-[10px] text-purple-700 truncate mt-0.5">
                          {matchedAgentByPhone.agentPhone} {matchedAgentByPhone.agentEmail && `• ${matchedAgentByPhone.agentEmail}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectAgent(matchedAgentByPhone)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-xs cursor-pointer active:scale-95"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}
                </div>

                {/* On-Site Tenant Details (Tenant 1 & Tenant 2) */}
                <div className="pt-3 border-t border-purple-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      On-Site Tenant Details
                    </span>
                    {!showTenant2 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowTenant2(true);
                          triggerHapticFeedback('light');
                        }}
                        className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100/70 hover:bg-purple-200/70 px-2.5 py-1 rounded-lg transition active:scale-95"
                      >
                        + Add Tenant 2
                      </button>
                    )}
                  </div>

                  {/* Tenant 1 Card */}
                  <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 space-y-2.5 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-purple-800 tracking-wide block">
                      Tenant 1 (Primary Contact)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={tenant1Name}
                          onChange={e => setTenant1Name(e.target.value)}
                          placeholder="e.g. Jordan Miller"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-700">
                            Phone
                          </label>
                          {renderPhoneBadge(tenant1Phone)}
                        </div>
                        <input
                          type="tel"
                          value={tenant1Phone}
                          onChange={e => setTenant1Phone(formatPhoneNumber(e.target.value))}
                          placeholder="0412 345 678"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-semibold focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={tenant1Email}
                          onChange={e => setTenant1Email(e.target.value)}
                          placeholder="jordan@example.com"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tenant 2 Card */}
                  {showTenant2 && (
                    <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 space-y-2.5 shadow-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-purple-800 tracking-wide">
                          Tenant 2 (Secondary Contact)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTenant2(false);
                            setTenant2Name('');
                            setTenant2Phone('');
                            setTenant2Email('');
                            triggerHapticFeedback('light');
                          }}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition"
                        >
                          Remove Tenant 2
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={tenant2Name}
                            onChange={e => setTenant2Name(e.target.value)}
                            placeholder="e.g. Sarah Miller"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:border-purple-500 outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-700">
                              Phone
                            </label>
                            {renderPhoneBadge(tenant2Phone)}
                          </div>
                          <input
                            type="tel"
                            value={tenant2Phone}
                            onChange={e => setTenant2Phone(formatPhoneNumber(e.target.value))}
                            placeholder="0412 987 654"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-semibold focus:border-purple-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={tenant2Email}
                            onChange={e => setTenant2Email(e.target.value)}
                            placeholder="sarah@example.com"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-purple-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Property Owner / Landlord (Optional for Agency jobs) */}
                  <div className="bg-white/95 rounded-2xl p-3 border border-purple-100 space-y-2.5 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-purple-800 tracking-wide block">
                      Property Owner / Landlord (Optional)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">
                          Owner Name
                        </label>
                        <input
                          type="text"
                          value={ownerName}
                          onChange={e => handleOwnerNameChange(e.target.value)}
                          placeholder="e.g. Robert Smith"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-700">
                            Owner Phone
                          </label>
                          {renderPhoneBadge(ownerPhone)}
                        </div>
                        <input
                          type="tel"
                          value={ownerPhone}
                          onChange={e => handleOwnerPhoneChange(e.target.value)}
                          placeholder="0412 345 678"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-semibold focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">
                          Owner Email
                        </label>
                        <input
                          type="email"
                          value={ownerEmail}
                          onChange={e => setOwnerEmail(e.target.value)}
                          placeholder="robert@example.com"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: SITE LOCATION & OWNER DETAILS */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {isAgencyJob ? 'Job Site Address & Location' : 'Property Owner & Site Location'}
              </span>

              {!isAgencyJob && savedCustomers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback('light');
                    setShowSavedCustomersList(!showSavedCustomersList);
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Users className="w-3 h-3" />
                  <span>Saved Owners ({savedCustomers.length})</span>
                </button>
              )}
            </div>

            {/* Quick Picker Drawer for Saved Clients (Non-agency) */}
            {!isAgencyJob && showSavedCustomersList && savedCustomers.length > 0 && (
              <div className="bg-white border border-blue-200 rounded-2xl p-2.5 space-y-1.5 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-slate-600">Select a recent customer to auto-fill:</span>
                  <button
                    type="button"
                    onClick={() => setShowSavedCustomersList(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                  {savedCustomers.slice(0, 6).map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2 rounded-xl hover:bg-blue-50 border border-slate-100 hover:border-blue-200 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-black text-slate-900 text-xs">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.phone} {c.suburb && `• ${c.suburb}`}</div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60">
                        Pick
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Street Address & Suburb (Moved to the Top for Quick Access) */}
            <div className="bg-white rounded-2xl border border-blue-200/90 p-3 sm:p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                  <span>Property / Street Address *</span>
                </label>
                {selectedCoordinates ? (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[2.5]" /> Exact GPS Pin Linked
                  </span>
                ) : isGeocodingAddress ? (
                  <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving GPS location...
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                    Type address to link GPS pin
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <AddressAutocomplete
                    value={address}
                    onChange={setAddress}
                    onAddressSelect={handleAddressSelect}
                    placeholder="Start typing street address (e.g. 20 Banjo Paterson)..."
                    currentLocation={currentLocation}
                    isLinked={Boolean(selectedCoordinates)}
                    coordinates={selectedCoordinates}
                  />
                </div>

                <div>
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
              </div>

              {selectedCoordinates && (
                <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 font-bold shadow-2xs">
                  <span className="flex items-center gap-1.5 truncate text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Live GPS Locked: [{selectedCoordinates[0].toFixed(4)}, {selectedCoordinates[1].toFixed(4)}]</span>
                  </span>
                  <span className="text-[9px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs shrink-0">
                    Ready
                  </span>
                </div>
              )}
            </div>

            {/* Owner Information Fields (When NOT agency job) */}
            {!isAgencyJob && (
              <>
                <div ref={customerSectionRef} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Owner Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        ref={customerInputRef}
                        type="text"
                        required
                        value={ownerName}
                        onChange={e => handleOwnerNameChange(e.target.value)}
                        placeholder="e.g., Jordan Miller"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Autocomplete Dropdown for Owner Name */}
                    {showCustomerDropdown && customerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-blue-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in">
                        {customerSuggestions.map(cust => (
                          <div
                            key={cust.id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-2.5 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <div className="font-black text-slate-900 text-xs">{cust.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {cust.phone} {cust.address && `• ${cust.address}`}
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              Auto-fill
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-600">
                        Owner Phone (AU)
                      </label>
                      {renderPhoneBadge(ownerPhone)}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={e => handleOwnerPhoneChange(e.target.value)}
                        placeholder="0412 345 678"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Owner Email <span className="text-slate-400 font-normal">(Quotes & Invoices)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={e => setOwnerEmail(e.target.value)}
                        placeholder="e.g. jordan@gmail.com"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Smart Banner: Detected Existing Customer from Phone Number */}
                {matchedCustomerByPhone && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="min-w-0">
                      <div className="font-bold text-emerald-950 text-xs flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Existing Owner: {matchedCustomerByPhone.name}</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 truncate">
                        {matchedCustomerByPhone.address} ({matchedCustomerByPhone.suburb})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(matchedCustomerByPhone)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shrink-0 shadow-xs transition active:scale-95 flex items-center gap-1"
                    >
                      <span>Auto-fill</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Optional Tenant / Rental Toggle for residential landlords */}
                <div className="pt-1">
                  {!showDirectTenants ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDirectTenants(true);
                        triggerHapticFeedback('light');
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" /> Add Tenant Details (Tenant 1 & 2 for Rental Properties)
                    </button>
                  ) : (
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-700 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          Rental Tenant Occupants
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowDirectTenants(false)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                        >
                          Hide Tenants
                        </button>
                      </div>

                      {/* Tenant 1 */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Tenant 1 Name
                          </label>
                          <input
                            type="text"
                            value={tenant1Name}
                            onChange={e => setTenant1Name(e.target.value)}
                            placeholder="e.g. Jordan Miller"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-600">
                              Tenant 1 Phone
                            </label>
                            {renderPhoneBadge(tenant1Phone)}
                          </div>
                          <input
                            type="tel"
                            value={tenant1Phone}
                            onChange={e => setTenant1Phone(formatPhoneNumber(e.target.value))}
                            placeholder="0412 345 678"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Tenant 1 Email
                          </label>
                          <input
                            type="email"
                            value={tenant1Email}
                            onChange={e => setTenant1Email(e.target.value)}
                            placeholder="tenant@gmail.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Tenant 2 */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Tenant 2 Name
                          </label>
                          <input
                            type="text"
                            value={tenant2Name}
                            onChange={e => setTenant2Name(e.target.value)}
                            placeholder="e.g. Sarah Miller"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-600">
                              Tenant 2 Phone
                            </label>
                            {renderPhoneBadge(tenant2Phone)}
                          </div>
                          <input
                            type="tel"
                            value={tenant2Phone}
                            onChange={e => setTenant2Phone(formatPhoneNumber(e.target.value))}
                            placeholder="0412 987 654"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Tenant 2 Email
                          </label>
                          <input
                            type="email"
                            value={tenant2Email}
                            onChange={e => setTenant2Email(e.target.value)}
                            placeholder="tenant2@gmail.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* SECTION 4: STATUS, PRIORITY & DURATION */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Status, Urgency & Estimated Time
            </span>

            {/* Initial Pipeline Status - Selectable Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1.5">
                Initial Pipeline Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={e => {
                    triggerHapticFeedback('light');
                    setStatus(e.target.value as JobStatus);
                  }}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none pr-9 cursor-pointer transition shadow-2xs"
                >
                  <option value="quote_requested">🟠 Needs Quote (Site Visit)</option>
                  <option value="quoted">🟣 Quoted (Default / Approved Quote)</option>
                  <option value="in_progress">🟢 In Progress / Confirmed Scheduled</option>
                  <option value="urgent">🔴 Urgent / Emergency Repair</option>
                  <option value="completed">⚪ Completed Work</option>
                  <option value="invoiced">🔵 Invoiced & Finalized</option>
                  <option value="cancelled">🚫 Cancelled</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Select starting status (e.g. choose &quot;Quoted&quot; if pre-quoted by Real Estate, or &quot;Needs Quote&quot; for inspection).
              </p>
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
