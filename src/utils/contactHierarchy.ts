import { Job } from '../types';

export interface DefaultJobContact {
  type: 'tenant' | 'agent' | 'owner';
  name: string;
  phone?: string;
  email?: string;
  roleLabel: string; // 'Tenant' | 'Property Manager' | 'Owner'
}

/**
 * Returns the primary/default contact for any job following strict operational hierarchy:
 * 1. Tenant (occupant on-site to schedule appointment and access with)
 * 2. Real Estate Agent / Property Manager (if tenant is not added)
 * 3. Property Owner (direct customer fallback if neither tenant nor agent is present)
 */
export function getDefaultJobContact(job: Job): DefaultJobContact {
  // 1. Tenant Priority: check Tenant 1 or generic tenant fields
  const tenantPhone = job.tenant1Phone || job.tenantPhone;
  const tenantName = job.tenant1Name || job.tenantName;
  const tenantEmail = job.tenant1Email || job.tenantEmail;

  if (tenantPhone || (tenantName && tenantName.trim().length > 0)) {
    return {
      type: 'tenant',
      name: tenantName?.trim() || 'Tenant',
      phone: tenantPhone?.trim() || undefined,
      email: tenantEmail?.trim() || undefined,
      roleLabel: 'Tenant'
    };
  }

  // 2. Real Estate Agent Priority (if agency job or agent details provided)
  const agentPhone = job.realEstateAgentPhone;
  const agentName = job.realEstateAgentName;
  const agentEmail = job.realEstateAgentEmail;

  if (agentPhone || (agentName && agentName.trim().length > 0) || (job.isAgencyJob && job.realEstateAgency)) {
    return {
      type: 'agent',
      name: agentName?.trim() || job.realEstateAgency?.trim() || 'Property Manager',
      phone: agentPhone?.trim() || undefined,
      email: agentEmail?.trim() || undefined,
      roleLabel: 'PM / Agent'
    };
  }

  // 3. Owner Fallback (Direct Customer)
  const ownerPhone = job.ownerPhone || job.clientPhone;
  const ownerName = job.ownerName || job.clientName;
  const ownerEmail = job.ownerEmail || job.clientEmail;

  return {
    type: 'owner',
    name: ownerName?.trim() || 'Owner',
    phone: ownerPhone?.trim() || undefined,
    email: ownerEmail?.trim() || undefined,
    roleLabel: 'Owner'
  };
}
