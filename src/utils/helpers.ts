import { JobStatus, JobPriority, JobCategory } from '../types';

export const STATUS_CONFIG: Record<
  JobStatus,
  {
    label: string;
    shortLabel: string;
    colorHex: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeBg: string;
    icon: string;
    description: string;
  }
> = {
  quote_requested: {
    label: 'Quote Requested',
    shortLabel: 'Needs Quote',
    colorHex: '#d97706', // Warm Amber 600
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    badgeBg: 'bg-amber-500',
    icon: 'FileQuestion',
    description: 'Client asked for an estimate. Handyman needs to visit on-site.'
  },
  quoted: {
    label: 'Quoted (Awaiting Approval)',
    shortLabel: 'Quoted',
    colorHex: '#7c3aed', // Purple 600
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-200',
    badgeBg: 'bg-purple-500',
    icon: 'FileCheck',
    description: 'Quote prepared & presented. Awaiting customer confirmation.'
  },
  in_progress: {
    label: 'In Progress / Scheduled',
    shortLabel: 'In Progress',
    colorHex: '#059669', // Emerald 600
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    badgeBg: 'bg-emerald-500',
    icon: 'Wrench',
    description: 'Work is underway or actively scheduled.'
  },
  urgent: {
    label: 'Urgent / Emergency',
    shortLabel: 'Urgent',
    colorHex: '#dc2626', // Red 600
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    badgeBg: 'bg-red-600',
    icon: 'AlertTriangle',
    description: 'High priority urgent emergency (leak, hazard, electrical).'
  },
  completed: {
    label: 'Completed',
    shortLabel: 'Completed',
    colorHex: '#475569', // Slate 600
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    badgeBg: 'bg-slate-600',
    icon: 'CheckCircle2',
    description: 'Work completed. Ready for billing or signed off.'
  },
  invoiced: {
    label: 'Invoiced / Paid',
    shortLabel: 'Invoiced',
    colorHex: '#2563eb', // Blue 600
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    badgeBg: 'bg-blue-600',
    icon: 'Receipt',
    description: 'Final tax invoice generated and sent to customer.'
  }
};

export const PRIORITY_CONFIG: Record<
  JobPriority,
  { label: string; textClass: string; bgClass: string; borderClass: string }
> = {
  low: { label: 'Low', textClass: 'text-slate-600', bgClass: 'bg-slate-100', borderClass: 'border-slate-200' },
  medium: { label: 'Medium', textClass: 'text-blue-700', bgClass: 'bg-blue-50', borderClass: 'border-blue-200' },
  high: { label: 'High', textClass: 'text-amber-700', bgClass: 'bg-amber-50', borderClass: 'border-amber-200' },
  urgent: { label: 'Urgent', textClass: 'text-red-700', bgClass: 'bg-red-50', borderClass: 'border-red-200' }
};

export const CATEGORY_ICONS: Record<JobCategory, string> = {
  'Plumbing': 'Droplets',
  'Electrical': 'Zap',
  'Carpentry': 'Hammer',
  'Painting': 'Paintbrush',
  'HVAC': 'Fan',
  'Roofing': 'Home',
  'General Repair': 'Wrench',
  'Assembly & Mounting': 'Layers',
  'Drywall & Masonry': 'Box',
  'Door & Window': 'DoorOpen'
};

export function formatCurrency(amount: number, currency = '$'): string {
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (!timeString) return '';
  try {
    const d = new Date(timeString);
    return d.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return timeString;
  }
}

export function formatDateTime(dateTimeString?: string): string {
  if (!dateTimeString) return 'Not scheduled';
  try {
    const d = new Date(dateTimeString);
    return `${d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } catch {
    return dateTimeString;
  }
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buildGoogleMapsRouteUrl(
  start: [number, number],
  stops: [number, number][]
): string {
  if (stops.length === 0) return `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}`;
  
  const origin = `${start[0]},${start[1]}`;
  const destination = `${stops[stops.length - 1][0]},${stops[stops.length - 1][1]}`;
  
  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  }
  
  const waypoints = stops
    .slice(0, -1)
    .map(pt => `${pt[0]},${pt[1]}`)
    .join('|');
    
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}`;
}

export function buildAppleMapsRouteUrl(
  start: [number, number],
  destination: [number, number]
): string {
  return `http://maps.apple.com/?saddr=${start[0]},${start[1]}&daddr=${destination[0]},${destination[1]}`;
}

export function buildSmsLink(phone: string, message: string): string {
  const cleanedPhone = phone.replace(/[^0-9+]/g, '');
  return `sms:${cleanedPhone}?body=${encodeURIComponent(message)}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
