export type JobStatus =
  | 'quote_requested'   // Orange: Client requested quote; handyman needs to visit on-site
  | 'quoted'            // Purple: Quote prepared and presented, awaiting client approval
  | 'in_progress'       // Green: Work underway or confirmed scheduled
  | 'urgent'            // Red: Urgent / emergency repair
  | 'completed'         // Slate: Finished work
  | 'invoiced';         // Blue-gray: Invoiced & finalized

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export type JobCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'Carpentry'
  | 'Painting'
  | 'HVAC'
  | 'Roofing'
  | 'General Repair'
  | 'Assembly & Mounting'
  | 'Drywall & Masonry'
  | 'Door & Window';

export interface QuoteItem {
  id: string;
  type: 'labor' | 'material' | 'fee';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface JobQuote {
  id: string;
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  items: QuoteItem[];
  hourlyLaborRate: number;
  estimatedLaborHours: number;
  taxRatePercent: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
  clientSignature?: string; // base64 PNG data URL
  clientSignatureName?: string;
  signedAt?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
}

export interface JobPhoto {
  id: string;
  url: string;
  type: 'assessment' | 'before' | 'after';
  caption: string;
  uploadedAt: string;
}

export interface TimeLog {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  notes?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  status: JobStatus;
  priority: JobPriority;
  category: JobCategory;
  description: string;
  quoteRequestedDate: string;
  appointmentTime?: string; // e.g. "2026-09-22T14:30:00"
  estimatedDurationMinutes: number;
  quote?: JobQuote;
  photos: JobPhoto[];
  timeLogs: TimeLog[];
  internalNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RouteStop {
  id: string;
  job: Job;
  stopOrder: number;
  eta: string;
  distanceFromPrevKm: number;
  durationFromPrevMin: number;
  isCompleted: boolean;
}

export interface OptimizedRoute {
  id: string;
  startLocation: {
    name: string;
    coordinates: [number, number];
  };
  stops: RouteStop[];
  totalDistanceKm: number;
  totalDurationMin: number;
  polylineCoordinates: [number, number][]; // [lat, lng][]
  generatedAt: string;
  filterUsed: 'quotes_only' | 'active_only' | 'urgent_and_quotes' | 'all';
}

export interface HandymanProfile {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  defaultHourlyRate: number;
  baseAddress: string;
  baseCoordinates: [number, number];
  currencySymbol: string;
  taxRatePercent: number;
}

export type ReminderType =
  | 'delayed_quote_visit'     // Waiting quote > 24h without scheduled site visit
  | 'quote_followup'          // Quote sent > 48h ago awaiting client confirmation
  | 'upcoming_appointment'    // Job or quote visit scheduled for today or within next few hours
  | 'in_progress_check'       // Job in progress needing labor time logging or after-photos
  | 'uninvoiced_completion'   // Completed job not yet invoiced
  | 'urgent_unattended';      // Urgent emergency job needing immediate dispatch

export type ReminderUrgency = 'urgent' | 'warning' | 'info';

export interface ReminderItem {
  id: string;
  jobId: string;
  job: Job;
  type: ReminderType;
  urgency: ReminderUrgency;
  title: string;
  message: string;
  suggestedActionLabel: string;
  suggestedActionType: 'sms_followup' | 'call' | 'schedule' | 'open_quote' | 'invoice' | 'open_job';
  actionDraftText?: string;
  dueText: string;
  createdAt: string;
  isSnoozed?: boolean;
}

