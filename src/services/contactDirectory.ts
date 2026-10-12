import { Job } from '../types';

export interface SavedCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  suburb?: string;
  coordinates?: [number, number];
  lastUsedAt: string;
  useCount: number;
}

export interface SavedAgent {
  id: string;
  agencyName: string;
  agentName: string;
  agentPhone: string;
  agentEmail?: string;
  lastUsedAt: string;
  useCount: number;
}

const CUSTOMERS_STORAGE_KEY = 'handymap_saved_customers_v1';
const AGENTS_STORAGE_KEY = 'handymap_saved_agents_v1';

/**
 * Clean phone numbers to digits only for reliable matching
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Load all saved customers from localStorage
 */
export function loadSavedCustomers(): SavedCustomer[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load saved customers:', err);
    return [];
  }
}

/**
 * Save customers array to localStorage
 */
export function persistSavedCustomers(customers: SavedCustomer[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to persist saved customers:', err);
  }
}

/**
 * Load all saved agents from localStorage
 */
export function loadSavedAgents(): SavedAgent[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load saved agents:', err);
    return [];
  }
}

/**
 * Save agents array to localStorage
 */
export function persistSavedAgents(agents: SavedAgent[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
  } catch (err) {
    console.error('Failed to persist saved agents:', err);
  }
}

/**
 * Add or update a customer in the saved directory
 */
export function saveOrUpdateCustomer(cust: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  suburb?: string;
  coordinates?: [number, number];
}): SavedCustomer | null {
  if (!cust.name?.trim() && !cust.phone?.trim()) return null;

  try {
    const list = loadSavedCustomers();
    const cleanPhone = normalizePhone(cust.phone);
    const cleanName = cust.name.trim().toLowerCase();

    // Match by normalized phone (if phone exists) or exact name
    const existingIndex = list.findIndex(c => {
      const pMatch = cleanPhone && cleanPhone.length >= 8 && normalizePhone(c.phone) === cleanPhone;
      const nMatch = cleanName && c.name.trim().toLowerCase() === cleanName;
      return pMatch || nMatch;
    });

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updated: SavedCustomer = {
        ...existing,
        name: cust.name.trim() || existing.name,
        phone: cust.phone.trim() || existing.phone,
        email: cust.email?.trim() || existing.email,
        address: cust.address?.trim() || existing.address,
        suburb: cust.suburb?.trim() || existing.suburb,
        coordinates: cust.coordinates || existing.coordinates,
        lastUsedAt: now,
        useCount: (existing.useCount || 1) + 1
      };
      list[existingIndex] = updated;
      persistSavedCustomers(list);
      return updated;
    } else {
      const newCust: SavedCustomer = {
        id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: cust.name.trim(),
        phone: cust.phone.trim(),
        email: cust.email?.trim() || '',
        address: cust.address?.trim() || '',
        suburb: cust.suburb?.trim() || 'Point Cook',
        coordinates: cust.coordinates,
        lastUsedAt: now,
        useCount: 1
      };
      list.unshift(newCust);
      persistSavedCustomers(list);
      return newCust;
    }
  } catch (err) {
    console.error('Failed to save customer:', err);
    return null;
  }
}

/**
 * Add or update an agent in the saved directory
 */
export function saveOrUpdateAgent(agent: {
  agencyName: string;
  agentName: string;
  agentPhone: string;
  agentEmail?: string;
}): SavedAgent | null {
  if (!agent.agencyName?.trim() && !agent.agentName?.trim()) return null;

  try {
    const list = loadSavedAgents();
    const cleanAgency = agent.agencyName.trim().toLowerCase();
    const cleanName = agent.agentName.trim().toLowerCase();
    const cleanPhone = normalizePhone(agent.agentPhone);

    const existingIndex = list.findIndex(a => {
      const nameMatch = cleanName && a.agentName.trim().toLowerCase() === cleanName;
      const agencyMatch = cleanAgency && a.agencyName.trim().toLowerCase() === cleanAgency;
      const phoneMatch = cleanPhone && cleanPhone.length >= 8 && normalizePhone(a.agentPhone) === cleanPhone;
      return (nameMatch && agencyMatch) || (cleanPhone && phoneMatch);
    });

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updated: SavedAgent = {
        ...existing,
        agencyName: agent.agencyName.trim() || existing.agencyName,
        agentName: agent.agentName.trim() || existing.agentName,
        agentPhone: agent.agentPhone.trim() || existing.agentPhone,
        agentEmail: agent.agentEmail?.trim() || existing.agentEmail,
        lastUsedAt: now,
        useCount: (existing.useCount || 1) + 1
      };
      list[existingIndex] = updated;
      persistSavedAgents(list);
      return updated;
    } else {
      const newAgent: SavedAgent = {
        id: `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        agencyName: agent.agencyName.trim(),
        agentName: agent.agentName.trim(),
        agentPhone: agent.agentPhone.trim(),
        agentEmail: agent.agentEmail?.trim() || '',
        lastUsedAt: now,
        useCount: 1
      };
      list.unshift(newAgent);
      persistSavedAgents(list);
      return newAgent;
    }
  } catch (err) {
    console.error('Failed to save agent:', err);
    return null;
  }
}

/**
 * Non-destructive harvesting of contacts from current jobs.
 * Runs on startup to auto-populate the rolodex from past jobs without any risk!
 */
export function harvestContactsFromJobs(jobs: Job[]): { customersCount: number; agentsCount: number } {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return { customersCount: 0, agentsCount: 0 };
  }

  const existingCustomers = loadSavedCustomers();
  const existingAgents = loadSavedAgents();

  const customerMap = new Map<string, SavedCustomer>();
  existingCustomers.forEach(c => {
    const key = normalizePhone(c.phone) || c.name.toLowerCase().trim();
    if (key) customerMap.set(key, c);
  });

  const agentMap = new Map<string, SavedAgent>();
  existingAgents.forEach(a => {
    const key = `${a.agencyName.toLowerCase().trim()}_${a.agentName.toLowerCase().trim()}`;
    if (key !== '_') agentMap.set(key, a);
  });

  // Harvest from jobs
  jobs.forEach(job => {
    // 1. Customer
    if (job.clientName && job.clientName.trim().length > 1) {
      const cPhone = normalizePhone(job.clientPhone);
      const cKey = cPhone || job.clientName.toLowerCase().trim();

      if (!customerMap.has(cKey)) {
        const newCust: SavedCustomer = {
          id: `cust-h-${job.id}`,
          name: job.clientName.trim(),
          phone: job.clientPhone?.trim() || '',
          email: job.clientEmail?.trim() || '',
          address: job.address?.trim() || '',
          suburb: job.suburb?.trim() || 'Point Cook',
          coordinates: job.coordinates,
          lastUsedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
          useCount: 1
        };
        customerMap.set(cKey, newCust);
      } else {
        const existing = customerMap.get(cKey)!;
        existing.useCount = (existing.useCount || 1) + 1;
        if (!existing.address && job.address) existing.address = job.address;
        if (!existing.suburb && job.suburb) existing.suburb = job.suburb;
        if (!existing.coordinates && job.coordinates) existing.coordinates = job.coordinates;
      }
    }

    // 2. Real Estate Agent
    if (job.isAgencyJob && job.realEstateAgency && job.realEstateAgency.trim().length > 1) {
      const aAgency = job.realEstateAgency.trim();
      const aName = job.realEstateAgentName?.trim() || 'General PM';
      const aPhone = job.realEstateAgentPhone?.trim() || '';
      const aEmail = job.realEstateAgentEmail?.trim() || '';
      const aKey = `${aAgency.toLowerCase()}_${aName.toLowerCase()}`;

      if (!agentMap.has(aKey)) {
        const newAgent: SavedAgent = {
          id: `agent-h-${job.id}`,
          agencyName: aAgency,
          agentName: aName,
          agentPhone: aPhone,
          agentEmail: aEmail,
          lastUsedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
          useCount: 1
        };
        agentMap.set(aKey, newAgent);
      } else {
        const existing = agentMap.get(aKey)!;
        existing.useCount = (existing.useCount || 1) + 1;
        if (!existing.agentPhone && aPhone) existing.agentPhone = aPhone;
      }
    }
  });

  const updatedCustomers = Array.from(customerMap.values()).sort((a, b) => {
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  const updatedAgents = Array.from(agentMap.values()).sort((a, b) => {
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  persistSavedCustomers(updatedCustomers);
  persistSavedAgents(updatedAgents);

  return {
    customersCount: updatedCustomers.length,
    agentsCount: updatedAgents.length
  };
}

/**
 * Search saved customers by name, phone, or address
 */
export function searchSavedCustomers(query: string, limit = 5): SavedCustomer[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const list = loadSavedCustomers();
  const cleanQPhone = normalizePhone(q);

  return list
    .filter(c => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const phoneMatch = cleanQPhone && normalizePhone(c.phone).includes(cleanQPhone);
      const addrMatch = c.address?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || addrMatch;
    })
    .slice(0, limit);
}

/**
 * Match a phone number directly to see if this customer already exists
 */
export function findCustomerByPhone(phone: string): SavedCustomer | null {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 8) return null;
  const list = loadSavedCustomers();
  return list.find(c => normalizePhone(c.phone) === cleanPhone) || null;
}

/**
 * Search saved agents by agency name, agent name, or phone
 */
export function searchSavedAgents(query: string, limit = 5): SavedAgent[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const list = loadSavedAgents();
  const cleanQPhone = normalizePhone(q);

  return list
    .filter(a => {
      const agencyMatch = a.agencyName.toLowerCase().includes(q);
      const nameMatch = a.agentName.toLowerCase().includes(q);
      const phoneMatch = cleanQPhone && normalizePhone(a.agentPhone).includes(cleanQPhone);
      return agencyMatch || nameMatch || phoneMatch;
    })
    .slice(0, limit);
}
