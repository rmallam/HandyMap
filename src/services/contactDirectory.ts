import { Job } from '../types';

export interface SavedCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  suburb?: string;
  coordinates?: [number, number];
  notes?: string;
  lastUsedAt: string;
  useCount: number;
}

export interface SavedAgent {
  id: string;
  agencyName: string;
  agentName: string;
  agentPhone: string; // Primary Key
  agentEmail?: string;
  agencyAddress?: string;
  agencySuburb?: string;
  notes?: string;
  lastUsedAt: string;
  useCount: number;
}

export interface SavedTenant {
  id: string;
  tenantName: string;
  tenantPhone: string; // Primary Key
  tenantEmail?: string;
  propertyAddress?: string;
  suburb?: string;
  agencyName?: string;
  notes?: string;
  lastUsedAt: string;
  useCount: number;
}

export interface SavedOwner {
  id: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  propertyAddress?: string;
  suburb?: string;
  agencyName?: string;
  notes?: string;
  lastUsedAt: string;
  useCount: number;
}

const CUSTOMERS_STORAGE_KEY = 'handymap_saved_customers_v1';
const AGENTS_STORAGE_KEY = 'handymap_saved_agents_v1';
const TENANTS_STORAGE_KEY = 'handymap_saved_tenants_v1';
const OWNERS_STORAGE_KEY = 'handymap_saved_owners_v1';

/**
 * Clean phone numbers to digits only for reliable matching
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Deduplicate agents using normalized phone number as Primary Key.
 * If phone is missing or short, falls back to agent name.
 */
function deduplicateAgentsList(agents: SavedAgent[]): SavedAgent[] {
  const map = new Map<string, SavedAgent>();
  for (const a of agents) {
    const cleanPhone = normalizePhone(a.agentPhone);
    const key = (cleanPhone && cleanPhone.length >= 8)
      ? `phone:${cleanPhone}`
      : `name:${a.agentName.trim().toLowerCase()}`;

    if (!map.has(key)) {
      map.set(key, { ...a });
    } else {
      const existing = map.get(key)!;
      // Merge best fields
      if (!existing.agentEmail && a.agentEmail) existing.agentEmail = a.agentEmail;
      if (!existing.agentPhone && a.agentPhone) existing.agentPhone = a.agentPhone;
      // Prefer non-abbreviated agency name (e.g. "Reliance Real Estate" over "Reliance - PC")
      if (a.agencyName && a.agencyName.length > existing.agencyName.length && !a.agencyName.includes('- PC')) {
        existing.agencyName = a.agencyName;
      }
      existing.useCount = (existing.useCount || 1) + (a.useCount || 1);
      if (new Date(a.lastUsedAt).getTime() > new Date(existing.lastUsedAt).getTime()) {
        existing.lastUsedAt = a.lastUsedAt;
      }
    }
  }
  return Array.from(map.values());
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
 * Load all saved agents from localStorage with automatic deduplication
 */
export function loadSavedAgents(): SavedAgent[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deduplicated = deduplicateAgentsList(parsed);
    // If deduplication merged records, persist back to keep storage clean
    if (deduplicated.length !== parsed.length) {
      persistSavedAgents(deduplicated);
    }
    return deduplicated;
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
    const deduplicated = deduplicateAgentsList(agents);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(deduplicated));
  } catch (err) {
    console.error('Failed to persist saved agents:', err);
  }
}

/**
 * Load all saved tenants from localStorage
 */
export function loadSavedTenants(): SavedTenant[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load saved tenants:', err);
    return [];
  }
}

/**
 * Save tenants array to localStorage
 */
export function persistSavedTenants(tenants: SavedTenant[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
  } catch (err) {
    console.error('Failed to persist saved tenants:', err);
  }
}

/**
 * Load all saved owners from localStorage
 */
export function loadSavedOwners(): SavedOwner[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(OWNERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load saved owners:', err);
    return [];
  }
}

/**
 * Save owners array to localStorage
 */
export function persistSavedOwners(owners: SavedOwner[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(OWNERS_STORAGE_KEY, JSON.stringify(owners));
  } catch (err) {
    console.error('Failed to persist saved owners:', err);
  }
}

/**
 * Add or update a customer in the saved directory
 */
export function saveOrUpdateCustomer(cust: {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  suburb?: string;
  coordinates?: [number, number];
  notes?: string;
}): SavedCustomer | null {
  if (!cust.name?.trim() && !cust.phone?.trim()) return null;

  try {
    const list = loadSavedCustomers();
    const cleanPhone = normalizePhone(cust.phone);
    const cleanName = cust.name.trim().toLowerCase();

    // 1. Direct match by ID if provided (editing existing customer)
    let existingIndex = -1;
    if (cust.id) {
      existingIndex = list.findIndex(c => c.id === cust.id);
    }

    // 2. Otherwise match by normalized phone (if phone exists) or exact name
    if (existingIndex < 0) {
      existingIndex = list.findIndex(c => {
        const pMatch = cleanPhone && cleanPhone.length >= 8 && normalizePhone(c.phone) === cleanPhone;
        const nMatch = cleanName && c.name.trim().toLowerCase() === cleanName;
        return pMatch || nMatch;
      });
    }

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const oldPhone = normalizePhone(existing.phone);
      if (oldPhone && oldPhone !== cleanPhone) {
        recordDeletedContact([oldPhone, existing.name.toLowerCase().trim()]);
      }

      const updated: SavedCustomer = {
        ...existing,
        name: cust.name.trim() || existing.name,
        phone: cust.phone.trim() || existing.phone,
        email: cust.email?.trim() || existing.email,
        address: cust.address?.trim() || existing.address,
        suburb: cust.suburb?.trim() || existing.suburb,
        coordinates: cust.coordinates || existing.coordinates,
        notes: cust.notes !== undefined ? cust.notes : existing.notes,
        lastUsedAt: now,
        useCount: (existing.useCount || 1) + 1
      };
      list[existingIndex] = updated;
      persistSavedCustomers(list);
      return updated;
    } else {
      const newCust: SavedCustomer = {
        id: cust.id || `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: cust.name.trim(),
        phone: cust.phone.trim(),
        email: cust.email?.trim() || '',
        address: cust.address?.trim() || '',
        suburb: cust.suburb?.trim() || 'Point Cook',
        coordinates: cust.coordinates,
        notes: cust.notes || '',
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
 * Add or update an agent in the saved directory.
 * STRICT PRIMARY KEY: Phone number (min 8 digits) prevents duplicate agents.
 * If phone matches an existing agent, their record is updated instead of creating a duplicate!
 */
export function saveOrUpdateAgent(agent: {
  id?: string;
  agencyName: string;
  agentName: string;
  agentPhone: string;
  agentEmail?: string;
  agencyAddress?: string;
  agencySuburb?: string;
  notes?: string;
}): SavedAgent | null {
  if (!agent.agencyName?.trim() && !agent.agentName?.trim()) return null;

  try {
    const list = loadSavedAgents();
    const cleanPhone = normalizePhone(agent.agentPhone);
    const cleanName = agent.agentName.trim().toLowerCase();

    // 1. Direct match by ID if provided (editing existing agent)
    let existingIndex = -1;
    if (agent.id) {
      existingIndex = list.findIndex(a => a.id === agent.id);
    }

    // 2. Primary key check:
    // a. Phone number match (if phone >= 8 digits)
    // b. Otherwise match by Agent Name (case-insensitive)
    if (existingIndex < 0) {
      existingIndex = list.findIndex(a => {
        const aPhone = normalizePhone(a.agentPhone);
        if (cleanPhone && cleanPhone.length >= 8 && aPhone && aPhone.length >= 8) {
          return aPhone === cleanPhone;
        }
        return cleanName && a.agentName.trim().toLowerCase() === cleanName;
      });
    }

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const oldPhone = normalizePhone(existing.agentPhone);
      const oldAgencyAgentKey = `${existing.agencyName.toLowerCase()}::${existing.agentName.toLowerCase()}`;
      if (oldPhone && oldPhone !== cleanPhone) {
        recordDeletedContact([oldPhone, oldAgencyAgentKey]);
      }

      const updated: SavedAgent = {
        ...existing,
        // Update agency if a non-empty name was provided
        agencyName: agent.agencyName.trim() || existing.agencyName,
        agentName: agent.agentName.trim() || existing.agentName,
        agentPhone: agent.agentPhone.trim() || existing.agentPhone,
        agentEmail: agent.agentEmail?.trim() || existing.agentEmail,
        agencyAddress: agent.agencyAddress?.trim() || existing.agencyAddress,
        agencySuburb: agent.agencySuburb?.trim() || existing.agencySuburb,
        notes: agent.notes !== undefined ? agent.notes : existing.notes,
        lastUsedAt: now,
        useCount: (existing.useCount || 1) + 1
      };
      list[existingIndex] = updated;
      persistSavedAgents(list);
      return updated;
    } else {
      const newAgent: SavedAgent = {
        id: agent.id || `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        agencyName: agent.agencyName.trim(),
        agentName: agent.agentName.trim(),
        agentPhone: agent.agentPhone.trim(),
        agentEmail: agent.agentEmail?.trim() || '',
        agencyAddress: agent.agencyAddress?.trim() || '',
        agencySuburb: agent.agencySuburb?.trim() || '',
        notes: agent.notes || '',
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
 * Add or update a tenant in the saved directory.
 * Primary Key: Phone number (min 8 digits) or tenant name.
 */
export function saveOrUpdateTenant(tenant: {
  id?: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string;
  propertyAddress?: string;
  suburb?: string;
  agencyName?: string;
  notes?: string;
}): SavedTenant | null {
  if (!tenant.tenantName?.trim() && !tenant.tenantPhone?.trim()) return null;

  try {
    const list = loadSavedTenants();
    const cleanPhone = normalizePhone(tenant.tenantPhone);
    const cleanName = tenant.tenantName.trim().toLowerCase();

    // 1. Direct match by ID if provided (editing existing tenant)
    let existingIndex = -1;
    if (tenant.id) {
      existingIndex = list.findIndex(t => t.id === tenant.id);
    }

    // 2. Otherwise match by phone or name
    if (existingIndex < 0) {
      existingIndex = list.findIndex(t => {
        const tPhone = normalizePhone(t.tenantPhone);
        if (cleanPhone && cleanPhone.length >= 8 && tPhone && tPhone.length >= 8) {
          return tPhone === cleanPhone;
        }
        return cleanName && t.tenantName.trim().toLowerCase() === cleanName;
      });
    }

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const oldPhone = normalizePhone(existing.tenantPhone);
      if (oldPhone && oldPhone !== cleanPhone) {
        recordDeletedContact([oldPhone, existing.tenantName.toLowerCase().trim()]);
      }

      const updated: SavedTenant = {
        ...existing,
        tenantName: tenant.tenantName.trim() || existing.tenantName,
        tenantPhone: tenant.tenantPhone.trim() || existing.tenantPhone,
        tenantEmail: tenant.tenantEmail?.trim() || existing.tenantEmail,
        propertyAddress: tenant.propertyAddress?.trim() || existing.propertyAddress,
        suburb: tenant.suburb?.trim() || existing.suburb,
        agencyName: tenant.agencyName?.trim() || existing.agencyName,
        notes: tenant.notes !== undefined ? tenant.notes : existing.notes,
        lastUsedAt: now,
        useCount: (existing.useCount || 1) + 1
      };
      list[existingIndex] = updated;
      persistSavedTenants(list);
      return updated;
    } else {
      const newTenant: SavedTenant = {
        id: tenant.id || `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantName: tenant.tenantName.trim(),
        tenantPhone: tenant.tenantPhone.trim(),
        tenantEmail: tenant.tenantEmail?.trim() || '',
        propertyAddress: tenant.propertyAddress?.trim() || '',
        suburb: tenant.suburb?.trim() || 'Point Cook',
        agencyName: tenant.agencyName?.trim() || '',
        notes: tenant.notes || '',
        lastUsedAt: now,
        useCount: 1
      };
      list.unshift(newTenant);
      persistSavedTenants(list);
      return newTenant;
    }
  } catch (err) {
    console.error('Failed to save tenant:', err);
    return null;
  }
}

/**
 * Add or update an owner/landlord in the saved directory.
 */
export function saveOrUpdateOwner(owner: {
  id?: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  propertyAddress?: string;
  suburb?: string;
  agencyName?: string;
  notes?: string;
}): SavedOwner | null {
  if (!owner.ownerName?.trim()) return null;

  try {
    const list = loadSavedOwners();
    const cleanPhone = normalizePhone(owner.ownerPhone);
    const cleanName = owner.ownerName.trim().toLowerCase();

    // 1. Direct match by ID if provided (editing existing owner)
    let existingIndex = -1;
    if (owner.id) {
      existingIndex = list.findIndex(o => o.id === owner.id);
    }

    // 2. Otherwise match by phone or name
    if (existingIndex < 0) {
      existingIndex = list.findIndex(o => {
        const oPhone = normalizePhone(owner.ownerPhone);
        if (cleanPhone && cleanPhone.length >= 8 && oPhone && oPhone.length >= 8) {
          return oPhone === cleanPhone;
        }
        return cleanName && o.ownerName.trim().toLowerCase() === cleanName;
      });
    }

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const oldPhone = normalizePhone(existing.ownerPhone);
      if (oldPhone && oldPhone !== cleanPhone) {
        recordDeletedContact([oldPhone, existing.ownerName.toLowerCase().trim()]);
      }

      const updated: SavedOwner = {
        ...existing,
        ownerName: owner.ownerName.trim() || existing.ownerName,
        ownerPhone: owner.ownerPhone?.trim() || existing.ownerPhone,
        ownerEmail: owner.ownerEmail?.trim() || existing.ownerEmail,
        propertyAddress: owner.propertyAddress?.trim() || existing.propertyAddress,
        suburb: owner.suburb?.trim() || existing.suburb,
        agencyName: owner.agencyName?.trim() || existing.agencyName,
        notes: owner.notes !== undefined ? owner.notes : existing.notes,
        lastUsedAt: now,
        useCount: (existing.useCount || 1) + 1
      };
      list[existingIndex] = updated;
      persistSavedOwners(list);
      return updated;
    } else {
      const newOwner: SavedOwner = {
        id: owner.id || `owner-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ownerName: owner.ownerName.trim(),
        ownerPhone: owner.ownerPhone?.trim() || '',
        ownerEmail: owner.ownerEmail?.trim() || '',
        propertyAddress: owner.propertyAddress?.trim() || '',
        suburb: owner.suburb?.trim() || 'Point Cook',
        agencyName: owner.agencyName?.trim() || '',
        notes: owner.notes || '',
        lastUsedAt: now,
        useCount: 1
      };
      list.unshift(newOwner);
      persistSavedOwners(list);
      return newOwner;
    }
  } catch (err) {
    console.error('Failed to save owner:', err);
    return null;
  }
}

const DELETED_CONTACTS_KEY = 'handymap_deleted_contacts';

export function getDeletedContactKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_CONTACTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function recordDeletedContact(keys: string[]): void {
  try {
    const current = getDeletedContactKeys();
    keys.forEach(k => {
      if (k && k.trim()) current.add(k.trim().toLowerCase());
    });
    localStorage.setItem(DELETED_CONTACTS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error('Error persisting deleted contact keys:', e);
  }
}

/**
 * Delete contact helpers (with tombstone tracking to prevent accidental resurrection)
 */
export function deleteAgent(id: string): void {
  const currentAgents = loadSavedAgents();
  const target = currentAgents.find(a => a.id === id);
  if (target) {
    const keys = [
      id,
      normalizePhone(target.agentPhone),
      `${target.agencyName.toLowerCase()}::${target.agentName.toLowerCase()}`
    ].filter(Boolean);
    recordDeletedContact(keys);
  } else {
    recordDeletedContact([id]);
  }
  const list = currentAgents.filter(a => a.id !== id);
  persistSavedAgents(list);
}

export function deleteTenant(id: string): void {
  const currentTenants = loadSavedTenants();
  const target = currentTenants.find(t => t.id === id);
  if (target) {
    const keys = [
      id,
      normalizePhone(target.tenantPhone),
      target.tenantName.toLowerCase().trim()
    ].filter(Boolean);
    recordDeletedContact(keys);
  } else {
    recordDeletedContact([id]);
  }
  const list = currentTenants.filter(t => t.id !== id);
  persistSavedTenants(list);
}

export function deleteOwner(id: string): void {
  const currentOwners = loadSavedOwners();
  const target = currentOwners.find(o => o.id === id);
  if (target) {
    const keys = [
      id,
      normalizePhone(target.ownerPhone),
      target.ownerName.toLowerCase().trim()
    ].filter(Boolean);
    recordDeletedContact(keys);
  } else {
    recordDeletedContact([id]);
  }
  const list = currentOwners.filter(o => o.id !== id);
  persistSavedOwners(list);
}

export function deleteCustomer(id: string): void {
  const currentCustomers = loadSavedCustomers();
  const target = currentCustomers.find(c => c.id === id);
  if (target) {
    const keys = [
      id,
      normalizePhone(target.phone),
      target.name.toLowerCase().trim()
    ].filter(Boolean);
    recordDeletedContact(keys);
  } else {
    recordDeletedContact([id]);
  }
  const list = currentCustomers.filter(c => c.id !== id);
  persistSavedCustomers(list);
}

/**
 * Non-destructive harvesting of contacts from current jobs.
 * Runs on startup to auto-populate the rolodex from past jobs without duplicate agents!
 */
export function harvestContactsFromJobs(jobs: Job[]): {
  customersCount: number;
  agentsCount: number;
  tenantsCount: number;
  ownersCount: number;
} {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return { customersCount: 0, agentsCount: 0, tenantsCount: 0, ownersCount: 0 };
  }

  const existingCustomers = loadSavedCustomers();
  const existingAgents = loadSavedAgents();
  const existingTenants = loadSavedTenants();
  const existingOwners = loadSavedOwners();
  const deletedKeys = getDeletedContactKeys();

  // Track existing IDs so harvested contacts that were modified in-place are never resurrected/duplicated
  const existingCustIds = new Set(existingCustomers.map(c => c.id));
  const existingAgentIds = new Set(existingAgents.map(a => a.id));
  const existingTenantIds = new Set(existingTenants.map(t => t.id));
  const existingOwnerIds = new Set(existingOwners.map(o => o.id));

  // Maps with phone as Primary Key
  const customerMap = new Map<string, SavedCustomer>();
  existingCustomers.forEach(c => {
    const key = normalizePhone(c.phone) || c.name.toLowerCase().trim();
    if (key) customerMap.set(key, c);
  });

  const agentMap = new Map<string, SavedAgent>();
  existingAgents.forEach(a => {
    const aPhone = normalizePhone(a.agentPhone);
    const key = (aPhone && aPhone.length >= 8) ? aPhone : a.agentName.toLowerCase().trim();
    if (key) agentMap.set(key, a);
  });

  const tenantMap = new Map<string, SavedTenant>();
  existingTenants.forEach(t => {
    const tPhone = normalizePhone(t.tenantPhone);
    const key = (tPhone && tPhone.length >= 8) ? tPhone : t.tenantName.toLowerCase().trim();
    if (key) tenantMap.set(key, t);
  });

  const ownerMap = new Map<string, SavedOwner>();
  existingOwners.forEach(o => {
    const oPhone = normalizePhone(o.ownerPhone);
    const key = (oPhone && oPhone.length >= 8) ? oPhone : o.ownerName.toLowerCase().trim();
    if (key) ownerMap.set(key, o);
  });

  // Harvest from jobs
  jobs.forEach(job => {
    // 1. Customer (Direct clients)
    if (!job.isAgencyJob && job.clientName && job.clientName.trim().length > 1) {
      const cPhone = normalizePhone(job.clientPhone);
      const cKey = (cPhone && cPhone.length >= 8) ? cPhone : job.clientName.toLowerCase().trim();
      const harvestedId = `cust-h-${job.id}`;

      if (
        (cPhone && deletedKeys.has(cPhone)) ||
        deletedKeys.has(cKey) ||
        deletedKeys.has(job.clientName.toLowerCase().trim()) ||
        deletedKeys.has(harvestedId) ||
        existingCustIds.has(harvestedId)
      ) {
        // Skip explicitly deleted or already-existing customer
      } else if (!customerMap.has(cKey)) {
        const newCust: SavedCustomer = {
          id: harvestedId,
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
        existingCustIds.add(harvestedId);
      } else {
        const existing = customerMap.get(cKey)!;
        existing.useCount = (existing.useCount || 1) + 1;
        if (!existing.address && job.address) existing.address = job.address;
        if (!existing.suburb && job.suburb) existing.suburb = job.suburb;
        if (!existing.coordinates && job.coordinates) existing.coordinates = job.coordinates;
      }
    }

    // 2. Real Estate Agent (KEYED BY PHONE NUMBER AS PRIMARY KEY)
    if ((job.isAgencyJob || job.realEstateAgency) && job.realEstateAgency && job.realEstateAgency.trim().length > 1) {
      const aAgency = job.realEstateAgency.trim();
      const aName = job.realEstateAgentName?.trim() || 'Property Manager';
      const aPhone = job.realEstateAgentPhone?.trim() || '';
      const aEmail = job.realEstateAgentEmail?.trim() || '';
      const cleanPhone = normalizePhone(aPhone);
      const aKey = (cleanPhone && cleanPhone.length >= 8) ? cleanPhone : aName.toLowerCase();
      const agencyAgentKey = `${aAgency.toLowerCase()}::${aName.toLowerCase()}`;
      const harvestedId = `agent-h-${job.id}`;

      if (
        (cleanPhone && deletedKeys.has(cleanPhone)) ||
        deletedKeys.has(aKey) ||
        deletedKeys.has(agencyAgentKey) ||
        deletedKeys.has(harvestedId) ||
        existingAgentIds.has(harvestedId)
      ) {
        // Skip explicitly deleted or already-existing agent
      } else if (!agentMap.has(aKey)) {
        const newAgent: SavedAgent = {
          id: harvestedId,
          agencyName: aAgency,
          agentName: aName,
          agentPhone: aPhone,
          agentEmail: aEmail,
          lastUsedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
          useCount: 1
        };
        agentMap.set(aKey, newAgent);
        existingAgentIds.add(harvestedId);
      } else {
        const existing = agentMap.get(aKey)!;
        existing.useCount = (existing.useCount || 1) + 1;
        if (!existing.agentPhone && aPhone) existing.agentPhone = aPhone;
        if (!existing.agentEmail && aEmail) existing.agentEmail = aEmail;
      }
    }

    // 3. Tenants
    const tenant1 = job.tenant1Name || (job.isAgencyJob ? job.clientName : undefined);
    const tenant1Phone = job.tenant1Phone || (job.isAgencyJob ? job.clientPhone : undefined);
    const tenant1Email = job.tenant1Email || (job.isAgencyJob ? job.clientEmail : undefined);
    if (tenant1 && tenant1.trim().length > 1) {
      const tPhone = normalizePhone(tenant1Phone);
      const tKey = (tPhone && tPhone.length >= 8) ? tPhone : tenant1.toLowerCase().trim();
      const harvestedId = `tenant-h-${job.id}`;

      if (
        (tPhone && deletedKeys.has(tPhone)) ||
        deletedKeys.has(tKey) ||
        deletedKeys.has(tenant1.toLowerCase().trim()) ||
        deletedKeys.has(harvestedId) ||
        existingTenantIds.has(harvestedId)
      ) {
        // Skip explicitly deleted or already-existing tenant
      } else if (!tenantMap.has(tKey)) {
        const newTenant: SavedTenant = {
          id: harvestedId,
          tenantName: tenant1.trim(),
          tenantPhone: tenant1Phone?.trim() || '',
          tenantEmail: tenant1Email?.trim() || '',
          propertyAddress: job.address?.trim() || '',
          suburb: job.suburb?.trim() || 'Point Cook',
          agencyName: job.realEstateAgency?.trim() || '',
          lastUsedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
          useCount: 1
        };
        tenantMap.set(tKey, newTenant);
        existingTenantIds.add(harvestedId);
      } else {
        const existing = tenantMap.get(tKey)!;
        existing.useCount = (existing.useCount || 1) + 1;
        if (!existing.propertyAddress && job.address) existing.propertyAddress = job.address;
        if (!existing.agencyName && job.realEstateAgency) existing.agencyName = job.realEstateAgency;
      }
    }

    if (job.tenant2Name && job.tenant2Name.trim().length > 1) {
      const tPhone2 = normalizePhone(job.tenant2Phone);
      const tKey2 = (tPhone2 && tPhone2.length >= 8) ? tPhone2 : job.tenant2Name.toLowerCase().trim();
      const harvestedId2 = `tenant-h2-${job.id}`;

      if (!existingTenantIds.has(harvestedId2) && !tenantMap.has(tKey2)) {
        tenantMap.set(tKey2, {
          id: harvestedId2,
          tenantName: job.tenant2Name.trim(),
          tenantPhone: job.tenant2Phone?.trim() || '',
          tenantEmail: job.tenant2Email?.trim() || '',
          propertyAddress: job.address?.trim() || '',
          suburb: job.suburb?.trim() || 'Point Cook',
          agencyName: job.realEstateAgency?.trim() || '',
          lastUsedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
          useCount: 1
        });
        existingTenantIds.add(harvestedId2);
      }
    }

    // 4. Property Owners / Landlords
    const effOwnerName = job.ownerName?.trim() || (!job.isAgencyJob ? job.clientName?.trim() : undefined);
    const effOwnerPhone = job.ownerPhone?.trim() || (!job.isAgencyJob ? job.clientPhone?.trim() : undefined);
    const effOwnerEmail = job.ownerEmail?.trim() || (!job.isAgencyJob ? job.clientEmail?.trim() : undefined);

    if (effOwnerName && effOwnerName.length > 1) {
      const oPhoneClean = normalizePhone(effOwnerPhone);
      const oKey = (oPhoneClean && oPhoneClean.length >= 8) ? oPhoneClean : effOwnerName.toLowerCase().trim();
      const harvestedId = `owner-h-${job.id}`;

      if (
        (oPhoneClean && deletedKeys.has(oPhoneClean)) ||
        deletedKeys.has(oKey) ||
        deletedKeys.has(effOwnerName.toLowerCase().trim()) ||
        deletedKeys.has(harvestedId) ||
        existingOwnerIds.has(harvestedId)
      ) {
        // Skip explicitly deleted or already-existing owner
      } else if (!ownerMap.has(oKey)) {
        ownerMap.set(oKey, {
          id: harvestedId,
          ownerName: effOwnerName,
          ownerPhone: effOwnerPhone || '',
          ownerEmail: effOwnerEmail || '',
          propertyAddress: job.address?.trim() || '',
          suburb: job.suburb?.trim() || 'Point Cook',
          agencyName: job.realEstateAgency?.trim() || '',
          lastUsedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
          useCount: 1
        });
        existingOwnerIds.add(harvestedId);
      } else {
        const existing = ownerMap.get(oKey)!;
        existing.useCount = (existing.useCount || 1) + 1;
        if (!existing.ownerPhone && effOwnerPhone) existing.ownerPhone = effOwnerPhone;
        if (!existing.ownerEmail && effOwnerEmail) existing.ownerEmail = effOwnerEmail;
        if (!existing.propertyAddress && job.address) existing.propertyAddress = job.address;
        if (!existing.agencyName && job.realEstateAgency) existing.agencyName = job.realEstateAgency;
      }
    }
  });

  const updatedCustomers = Array.from(customerMap.values()).sort((a, b) => {
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  const updatedAgents = deduplicateAgentsList(Array.from(agentMap.values())).sort((a, b) => {
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  const updatedTenants = Array.from(tenantMap.values()).sort((a, b) => {
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  const updatedOwners = Array.from(ownerMap.values()).sort((a, b) => {
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  persistSavedCustomers(updatedCustomers);
  persistSavedAgents(updatedAgents);
  persistSavedTenants(updatedTenants);
  persistSavedOwners(updatedOwners);

  return {
    customersCount: updatedCustomers.length,
    agentsCount: updatedAgents.length,
    tenantsCount: updatedTenants.length,
    ownersCount: updatedOwners.length
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
      const addrMatch = c.address && c.address.toLowerCase().includes(q);
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

/**
 * Match a phone number directly to see if this agent already exists (Primary Key check)
 */
export function findAgentByPhone(phone: string): SavedAgent | null {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 8) return null;
  const list = loadSavedAgents();
  return list.find(a => normalizePhone(a.agentPhone) === cleanPhone) || null;
}

/**
 * Find saved agents matching an agency name
 */
export function findAgentsByAgency(agencyName: string): SavedAgent[] {
  const clean = agencyName.trim().toLowerCase();
  if (!clean) return [];
  const list = loadSavedAgents();
  return list.filter(a => a.agencyName.toLowerCase() === clean || a.agencyName.toLowerCase().includes(clean));
}

/**
 * Search saved owners by name, phone, email, or property address
 */
export function searchSavedOwners(query: string, limit = 5): SavedOwner[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const list = loadSavedOwners();
  const cleanQPhone = normalizePhone(q);

  return list
    .filter(o => {
      const nameMatch = o.ownerName.toLowerCase().includes(q);
      const phoneMatch = cleanQPhone && normalizePhone(o.ownerPhone).includes(cleanQPhone);
      const emailMatch = o.ownerEmail && o.ownerEmail.toLowerCase().includes(q);
      const addressMatch = o.propertyAddress && o.propertyAddress.toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || addressMatch;
    })
    .slice(0, limit);
}

/**
 * Match a phone number directly to see if this owner already exists
 */
export function findOwnerByPhone(phone: string): SavedOwner | null {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 8) return null;
  const list = loadSavedOwners();
  return list.find(o => normalizePhone(o.ownerPhone) === cleanPhone) || null;
}
