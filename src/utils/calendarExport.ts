import { Job, HandymanProfile } from '../types';
import { formatDateTime } from './helpers';

/**
 * Builds a direct web URL to add the job/quote visit to Google Calendar
 */
export function buildGoogleCalendarUrl(job: Job, profile: HandymanProfile): string {
  const visitTime = job.appointmentTime || job.quoteRequestedDate;
  const startDate = visitTime ? new Date(visitTime) : new Date();
  
  // If invalid date, fallback to now + 1 hour
  const validStart = isNaN(startDate.getTime()) ? new Date() : startDate;
  const durationMs = (job.estimatedDurationMinutes || 60) * 60 * 1000;
  const validEnd = new Date(validStart.getTime() + durationMs);

  const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

  const startISO = formatGCalDate(validStart);
  const endISO = formatGCalDate(validEnd);

  const title = `🔨 [${job.jobNumber}] ${job.title} - ${job.clientName}`;
  
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${job.coordinates[0]},${job.coordinates[1]}`;
  
  let details = `Handyman Service Booking\n\n`;
  details += `Job ID: ${job.jobNumber}\n`;
  details += `Client: ${job.clientName} (${job.clientPhone})\n`;
  details += `Address: ${job.address}\n`;
  details += `Category: ${job.category} | Priority: ${job.priority.toUpperCase()}\n\n`;
  if (job.description) {
    details += `Scope & Notes:\n${job.description}\n\n`;
  }
  if (job.isAgencyJob && job.realEstateAgency) {
    details += `Real Estate Agency: ${job.realEstateAgency} (WO: ${job.workOrderNumber || 'N/A'})\n\n`;
  }
  details += `🗺️ Google Maps Navigation:\n${navUrl}\n\n`;
  details += `Apex Handyman PRO: ${profile.businessName} (Ph: ${profile.phone})`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startISO}/${endISO}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(job.address)}`;
}

/**
 * Generates and downloads a standard .ics calendar file for Apple Calendar (iOS/Mac) and Outlook
 */
export function downloadIcsCalendarFile(job: Job, profile: HandymanProfile): void {
  const visitTime = job.appointmentTime || job.quoteRequestedDate;
  const startDate = visitTime ? new Date(visitTime) : new Date();
  const validStart = isNaN(startDate.getTime()) ? new Date() : startDate;
  const durationMs = (job.estimatedDurationMinutes || 60) * 60 * 1000;
  const validEnd = new Date(validStart.getTime() + durationMs);

  const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

  const startISO = formatIcsDate(validStart);
  const endISO = formatIcsDate(validEnd);
  const nowISO = formatIcsDate(new Date());

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${job.coordinates[0]},${job.coordinates[1]}`;

  const description = [
    `Job ID: ${job.jobNumber}`,
    `Client: ${job.clientName} (${job.clientPhone})`,
    `Address: ${job.address}`,
    `Category: ${job.category}`,
    `Description: ${job.description.replace(/\n/g, ' ')}`,
    `Live Navigation: ${navUrl}`,
    `Service Provider: ${profile.businessName}`
  ].join('\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HandyMap PRO//Handyman Job Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:handymap-${job.id}-${Date.now()}@handymap.app`,
    `DTSTAMP:${nowISO}`,
    `DTSTART:${startISO}`,
    `DTEND:${endISO}`,
    `SUMMARY:${job.jobNumber} - ${job.title} (${job.clientName})`,
    `DESCRIPTION:${description}`,
    `LOCATION:${job.address}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `HandyMap_${job.jobNumber}_Booking.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
