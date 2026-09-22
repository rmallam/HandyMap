import { createClient } from '@supabase/supabase-js';
import { Job, HandymanProfile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Map DB row to Job TypeScript model
function mapRowToJob(row: any): Job {
  return {
    id: row.id,
    jobNumber: row.job_number,
    title: row.title,
    clientName: row.client_name,
    clientPhone: row.client_phone || '',
    clientEmail: row.client_email || '',
    address: row.address,
    suburb: row.suburb || 'Point Cook',
    coordinates: [row.latitude, row.longitude],
    status: row.status,
    priority: row.priority,
    category: row.category,
    description: row.description || '',
    quoteRequestedDate: row.quote_requested_date,
    appointmentTime: row.appointment_time,
    estimatedDurationMinutes: row.estimated_duration_minutes || 45,
    
    // Real estate agency details
    isAgencyJob: row.is_agency_job || false,
    realEstateAgency: row.real_estate_agency || undefined,
    realEstateAgentName: row.real_estate_agent_name || undefined,
    realEstateAgentPhone: row.real_estate_agent_phone || undefined,
    realEstateAgentEmail: row.real_estate_agent_email || undefined,
    workOrderNumber: row.work_order_number || undefined,
    tenantName: row.tenant_name || undefined,
    tenantPhone: row.tenant_phone || undefined,

    quote: row.quote || undefined,
    photos: Array.isArray(row.photos) ? row.photos : [],
    timeLogs: Array.isArray(row.time_logs) ? row.time_logs : [],
    internalNotes: Array.isArray(row.internal_notes) ? row.internal_notes : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Map Job TypeScript model to DB row
function mapJobToRow(job: Job): any {
  return {
    id: job.id,
    job_number: job.jobNumber,
    title: job.title,
    client_name: job.clientName,
    client_phone: job.clientPhone,
    client_email: job.clientEmail,
    address: job.address,
    suburb: job.suburb || 'Point Cook',
    latitude: job.coordinates[0],
    longitude: job.coordinates[1],
    status: job.status,
    priority: job.priority,
    category: job.category,
    description: job.description,
    quote_requested_date: job.quoteRequestedDate,
    appointment_time: job.appointmentTime || null,
    estimated_duration_minutes: job.estimatedDurationMinutes,
    
    // Real estate agency details
    is_agency_job: job.isAgencyJob || false,
    real_estate_agency: job.realEstateAgency || null,
    real_estate_agent_name: job.realEstateAgentName || null,
    real_estate_agent_phone: job.realEstateAgentPhone || null,
    real_estate_agent_email: job.realEstateAgentEmail || null,
    work_order_number: job.workOrderNumber || null,
    tenant_name: job.tenantName || null,
    tenant_phone: job.tenantPhone || null,

    quote: job.quote || null,
    photos: job.photos || [],
    time_logs: job.timeLogs || [],
    internal_notes: job.internalNotes || [],
    updated_at: new Date().toISOString()
  };
}

// Fetch all jobs from Supabase
export async function fetchJobsFromSupabase(): Promise<Job[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }
    return data ? data.map(mapRowToJob) : [];
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

// Upsert a single job in Supabase
export async function upsertJobInSupabase(job: Job): Promise<boolean> {
  if (!supabase) return false;
  try {
    const row = mapJobToRow(job);
    const { error } = await supabase.from('jobs').upsert(row);
    if (error) {
      console.warn('Supabase upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsert exception:', err);
    return false;
  }
}

// Delete job from Supabase
export async function deleteJobFromSupabase(jobId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) {
      console.warn('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete exception:', err);
    return false;
  }
}

// Seed initial jobs to Supabase if empty
export async function seedJobsToSupabaseIfEmpty(initialJobs: Job[]): Promise<void> {
  if (!supabase) return;
  try {
    const { count, error } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
    if (error || count === 0) {
      const rows = initialJobs.map(mapJobToRow);
      await supabase.from('jobs').upsert(rows);
    }
  } catch (err) {
    console.warn('Supabase seed exception:', err);
  }
}
