import { createClient, User, Session } from '@supabase/supabase-js';
import { Job, HandymanProfile } from '../types';
import { DEFAULT_PROFILE, INITIAL_JOBS } from '../data/mockJobs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// AUTHENTICATION METHODS (Password Login, Sign Up, Email OTP & Session)
// ============================================================================

/**
 * Sign in with email and password (Primary & Direct)
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  if (!supabase) return { user: null, session: null, error: 'Supabase is not configured' };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) {
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Failed to sign in' };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  if (!supabase) return { user: null, session: null, error: 'Supabase is not configured' };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: fullName || 'Handyman Professional',
          business_name: fullName || 'My Handyman Business'
        }
      }
    });
    if (error) {
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Failed to register account' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase is not configured' };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to send password reset email' };
  }
}

/**
 * Send Email OTP & Magic Link to the handyman's email address
 */
export async function sendEmailOtp(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase is not configured' };
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin
      }
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to send verification email' };
  }
}

/**
 * Verify 6-digit email OTP token
 */
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  if (!supabase) return { user: null, session: null, error: 'Supabase is not configured' };
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email'
    });
    if (error) {
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Invalid or expired code' };
  }
}

/**
 * Sign out user
 */
export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out exception:', err);
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Get current active session
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

// ============================================================================
// PROFILE PERSISTENCE (Scoped per user)
// ============================================================================

export function mapRowToProfile(row: any): HandymanProfile {
  return {
    name: row.name || DEFAULT_PROFILE.name,
    businessName: row.business_name || DEFAULT_PROFILE.businessName,
    abn: row.abn || DEFAULT_PROFILE.abn,
    phone: row.phone || DEFAULT_PROFILE.phone,
    email: row.email || DEFAULT_PROFILE.email,
    defaultHourlyRate: Number(row.default_hourly_rate) || DEFAULT_PROFILE.defaultHourlyRate,
    baseAddress: row.base_address || DEFAULT_PROFILE.baseAddress,
    baseCoordinates: [
      row.base_latitude !== undefined && row.base_latitude !== null ? Number(row.base_latitude) : DEFAULT_PROFILE.baseCoordinates[0],
      row.base_longitude !== undefined && row.base_longitude !== null ? Number(row.base_longitude) : DEFAULT_PROFILE.baseCoordinates[1]
    ],
    currencySymbol: row.currency_symbol || '$',
    taxRatePercent: Number(row.tax_rate_percent) || 10.0,
    accountName: row.account_name || DEFAULT_PROFILE.accountName,
    bsb: row.bsb || DEFAULT_PROFILE.bsb,
    accountNumber: row.account_number || DEFAULT_PROFILE.accountNumber,
    bankName: row.bank_name || DEFAULT_PROFILE.bankName,
    paymentTerms: row.payment_terms || DEFAULT_PROFILE.paymentTerms
  };
}

export function mapProfileToRow(userId: string, profile: HandymanProfile): any {
  return {
    id: userId,
    name: profile.name,
    business_name: profile.businessName,
    abn: profile.abn,
    phone: profile.phone,
    email: profile.email,
    default_hourly_rate: profile.defaultHourlyRate,
    base_address: profile.baseAddress,
    base_latitude: profile.baseCoordinates[0],
    base_longitude: profile.baseCoordinates[1],
    currency_symbol: profile.currencySymbol,
    tax_rate_percent: profile.taxRatePercent,
    account_name: profile.accountName || null,
    bsb: profile.bsb || null,
    account_number: profile.accountNumber || null,
    bank_name: profile.bankName || null,
    payment_terms: profile.paymentTerms || null,
    updated_at: new Date().toISOString()
  };
}

export async function fetchUserProfile(userId: string): Promise<HandymanProfile | null> {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase profile fetch error:', error.message);
      return null;
    }
    return data ? mapRowToProfile(data) : null;
  } catch (err) {
    console.warn('Supabase profile exception:', err);
    return null;
  }
}

export async function upsertUserProfile(userId: string, profile: HandymanProfile): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    const row = mapProfileToRow(userId, profile);
    const { error } = await supabase.from('profiles').upsert(row);
    if (error) {
      console.warn('Supabase profile upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase profile upsert exception:', err);
    return false;
  }
}

// ============================================================================
// JOBS PERSISTENCE & STRICT USER ISOLATION
// ============================================================================

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

    tasks: Array.isArray(row.tasks) ? row.tasks : [],
    quote: row.quote || undefined,
    photos: Array.isArray(row.photos) ? row.photos : [],
    timeLogs: Array.isArray(row.time_logs) ? row.time_logs : [],
    internalNotes: Array.isArray(row.internal_notes) ? row.internal_notes : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapJobToRow(job: Job, userId: string): any {
  return {
    id: job.id,
    user_id: userId,
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

    tasks: job.tasks || [],
    quote: job.quote || null,
    photos: job.photos || [],
    time_logs: job.timeLogs || [],
    internal_notes: job.internalNotes || [],
    updated_at: new Date().toISOString()
  };
}

/**
 * Fetch jobs strictly isolated to the authenticated user ID
 */
export async function fetchJobsFromSupabase(userId: string): Promise<Job[] | null> {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase jobs fetch error:', error.message);
      return null;
    }
    return data ? data.map(mapRowToJob) : [];
  } catch (err) {
    console.warn('Supabase jobs fetch exception:', err);
    return null;
  }
}

/**
 * Upsert a single job scoped to the user ID
 */
export async function upsertJobInSupabase(job: Job, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    const row = mapJobToRow(job, userId);
    let { error } = await supabase.from('jobs').upsert(row);
    if (error && (error.message.includes('tasks') || error.code === '42703')) {
      // Retry without tasks column if schema doesn't have it yet
      delete row.tasks;
      const retry = await supabase.from('jobs').upsert(row);
      error = retry.error;
    }
    if (error) {
      console.warn('Supabase job upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase job upsert exception:', err);
    return false;
  }
}

/**
 * Batch upsert jobs strictly scoped to the user ID
 */
export async function batchUpsertJobsInSupabase(jobsList: Job[], userId: string): Promise<boolean> {
  if (!supabase || !userId || jobsList.length === 0) return false;
  try {
    const rows = jobsList.map(j => mapJobToRow(j, userId));
    const { error } = await supabase.from('jobs').upsert(rows);
    if (error) {
      console.warn('Supabase batch upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase batch upsert exception:', err);
    return false;
  }
}

/**
 * Delete a job strictly scoped to the user ID
 */
export async function deleteJobFromSupabase(jobId: string, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId);
      
    if (error) {
      console.warn('Supabase job delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase job delete exception:', err);
    return false;
  }
}

/**
 * Seed initial mock jobs strictly for a specific user if their account has no jobs yet
 */
export async function seedJobsToSupabaseIfEmpty(initialJobs: Job[], userId: string): Promise<void> {
  if (!supabase || !userId) return;
  try {
    const { count, error } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!error && (count === null || count === 0)) {
      const rows = initialJobs.map(j => mapJobToRow(j, userId));
      await supabase.from('jobs').upsert(rows);
    }
  } catch (err) {
    console.warn('Supabase seed exception:', err);
  }
}
