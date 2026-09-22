-- ==============================================================================
-- HandyMap PRO - Supabase PostgreSQL Database Schema
-- Multi-Tenancy, Persistent Profiles, Email OTP Auth & Jobs Directory
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Profiles / Handyman Settings Table (Persistent per authenticated user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Alex Miller',
  business_name text not null default 'Apex Handyman & Property Maintenance',
  abn text default '83 912 405 618',
  phone text default '0412 890 442',
  email text default 'alex@apexhandyman.com.au',
  default_hourly_rate numeric(10,2) default 85.00,
  base_address text default 'Point Cook Town Centre, Main St, Point Cook VIC 3030',
  base_latitude double precision default -37.9175,
  base_longitude double precision default 144.7492,
  currency_symbol text default '$',
  tax_rate_percent numeric(5,2) default 10.00,
  account_name text default 'Apex Handyman Pty Ltd',
  bsb text default '063-875',
  account_number text default '1048 9921',
  bank_name text default 'Commonwealth Bank of Australia',
  payment_terms text default 'Payment due within 7 days of invoice issue. Direct deposit EFT or on-site card tap.',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Jobs Table (linked to user_id for multi-tenant isolation)
create table if not exists public.jobs (
  id text primary key, -- 'job-101' or uuid string
  user_id uuid references auth.users(id) on delete cascade,
  job_number text not null,
  title text not null,
  client_name text not null,
  client_phone text,
  client_email text,
  address text not null,
  suburb text default 'Point Cook',
  latitude double precision not null,
  longitude double precision not null,
  status text not null check (status in ('quote_requested', 'quoted', 'in_progress', 'urgent', 'completed', 'invoiced')),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  category text not null,
  description text,
  quote_requested_date timestamp with time zone default now(),
  appointment_time timestamp with time zone,
  estimated_duration_minutes integer default 45,
  
  -- Real Estate Agency & B2B Work Order Details
  is_agency_job boolean default false,
  real_estate_agency text,
  real_estate_agent_name text,
  real_estate_agent_phone text,
  real_estate_agent_email text,
  work_order_number text,
  tenant_name text,
  tenant_phone text,

  quote jsonb, -- Stores quote data and line items JSON
  photos jsonb default '[]'::jsonb, -- Array of photo objects
  time_logs jsonb default '[]'::jsonb, -- Array of time logs
  internal_notes jsonb default '[]'::jsonb, -- Array of note strings
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Fast Indexes
create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_suburb on public.jobs(suburb);
create index if not exists idx_jobs_agency on public.jobs(real_estate_agency);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);

-- 5. Row Level Security (RLS)
alter table public.jobs enable row level security;
alter table public.profiles enable row level security;

-- Profiles Policies: Users can view, insert, and update their own profile
drop policy if exists "Allow select profiles" on public.profiles;
create policy "Allow select profiles" on public.profiles
  for select using (auth.uid() = id or auth.uid() is null);

drop policy if exists "Allow insert profiles" on public.profiles;
create policy "Allow insert profiles" on public.profiles
  for insert with check (auth.uid() = id or auth.uid() is null);

drop policy if exists "Allow update profiles" on public.profiles;
create policy "Allow update profiles" on public.profiles
  for update using (auth.uid() = id or auth.uid() is null);

-- Jobs Policies: Multi-tenancy with unauthenticated fallback
drop policy if exists "Allow select jobs" on public.jobs;
create policy "Allow select jobs" on public.jobs
  for select using (auth.uid() = user_id or user_id is null or auth.uid() is null);

drop policy if exists "Allow insert jobs" on public.jobs;
create policy "Allow insert jobs" on public.jobs
  for insert with check (auth.uid() = user_id or user_id is null or auth.uid() is null);

drop policy if exists "Allow update jobs" on public.jobs;
create policy "Allow update jobs" on public.jobs
  for update using (auth.uid() = user_id or user_id is null or auth.uid() is null);

drop policy if exists "Allow delete jobs" on public.jobs;
create policy "Allow delete jobs" on public.jobs
  for delete using (auth.uid() = user_id or user_id is null or auth.uid() is null);

-- 6. Trigger: Automatically initialize default profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    business_name,
    abn,
    phone
  )
  values (
    new.id,
    coalesce(new.email, 'handyman@apex.com.au'),
    coalesce(new.raw_user_meta_data->>'name', 'Handyman Provider'),
    coalesce(new.raw_user_meta_data->>'business_name', 'My Handyman Business'),
    coalesce(new.raw_user_meta_data->>'abn', '83 912 405 618'),
    coalesce(new.raw_user_meta_data->>'phone', '0412 890 442')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Storage Bucket for Site Photos & Signatures
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public Access to Job Photos" on storage.objects;
create policy "Public Access to Job Photos" on storage.objects for select using (bucket_id = 'job-photos');

drop policy if exists "Public Upload to Job Photos" on storage.objects;
create policy "Public Upload to Job Photos" on storage.objects for insert with check (bucket_id = 'job-photos');

