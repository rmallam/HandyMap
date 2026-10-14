import { Job, HandymanProfile, QuickMessageTemplates } from '../types';
import { formatCurrency } from './helpers';

export const DEFAULT_MESSAGE_TEMPLATES: Required<QuickMessageTemplates> = {
  onMyWay: 'Hi {clientName}, {handymanName} from {businessName} here. I am on my way to your location ({address})! Est. arrival in 15-20 minutes.',
  quoteReady: 'Hi {clientName}, your quote for {jobTitle} is ready for review. Total: {quoteTotal}. Let me know if you would like to proceed!',
  runningLate: 'Hi {clientName}, {handymanName} here. I am running about 10-15 minutes behind schedule due to traffic. See you shortly at {address}!',
  jobCompleted: 'Hi {clientName}, work on "{jobTitle}" at {address} is now completed. Thank you for choosing {businessName}!',
  agencyUpdate: 'Hi {agentName}, {handymanName} from {businessName} regarding {workOrderNumber} at {address}. Work status update: {jobStatus}.',
  tenantArrival: 'Hi {tenantName}, {handymanName} from {businessName} here. I am arriving for the maintenance work order ({jobTitle}) at {address}.'
};

export interface MessageContext {
  clientName?: string;
  handymanName?: string;
  businessName?: string;
  jobTitle?: string;
  address?: string;
  quoteTotal?: string;
  agentName?: string;
  tenantName?: string;
  workOrderNumber?: string;
  jobStatus?: string;
  eta?: string;
  [key: string]: string | undefined;
}

/**
 * Replaces placeholders like {clientName}, {handymanName}, etc. with actual values.
 */
export function interpolateTemplate(template: string, context: MessageContext): string {
  let result = template;
  for (const [key, val] of Object.entries(context)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, val || '');
  }
  return result;
}

/**
 * Builds the standard context dictionary for a job and handyman profile.
 */
export function buildMessageContext(job: Job, profile: HandymanProfile, extra?: Partial<MessageContext>): MessageContext {
  const handymanName = profile.name ? profile.name.trim() : 'Your Handyman';
  const businessName = profile.businessName ? profile.businessName.trim() : 'Apex Handyman';
  const quoteTotal = job.quote ? formatCurrency(job.quote.totalAmount, profile.currencySymbol) : 'Pending';
  const agentName = job.realEstateAgentName || 'Property Manager';
  const tenantName = job.tenant1Name || job.tenantName || job.clientName;
  const workOrderNumber = job.workOrderNumber ? `WO #${job.workOrderNumber}` : job.jobNumber;

  return {
    clientName: job.clientName,
    handymanName,
    businessName,
    jobTitle: job.title,
    address: job.address,
    quoteTotal,
    agentName,
    tenantName,
    workOrderNumber,
    jobStatus: job.status.replace('_', ' ').toUpperCase(),
    ...extra
  };
}

/**
 * Resolves a template with active profile overrides, falling back to defaults.
 */
export function getInterpolatedMessage(
  templateKey: keyof QuickMessageTemplates,
  job: Job,
  profile: HandymanProfile,
  extra?: Partial<MessageContext>
): string {
  const template =
    profile.messageTemplates?.[templateKey] ||
    DEFAULT_MESSAGE_TEMPLATES[templateKey] ||
    '';

  const context = buildMessageContext(job, profile, extra);
  return interpolateTemplate(template, context);
}
