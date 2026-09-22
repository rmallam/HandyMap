-- ==============================================================================
-- HandyMap PRO - Supabase PostgreSQL Database Schema
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Profiles / Handyman Settings Table
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  business_name text not null default 'Apex Handyman & Property Maintenance',
  contact_name text not null default 'Alex Miller',
  phone text default '0412 890 442',
  email text default 'alex@apexhandyman.com.au',
  default_hourly_rate numeric(10,2) default 85.00,
  base_address text default 'Point Cook Town Centre, Main St, Point Cook VIC 3030',
  base_latitude double precision default -37.9175,
  base_longitude double precision default 144.7492,
  currency_symbol text default '$',
  tax_rate_percent numeric(5,2) default 10.00,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Jobs Table
create table if not exists public.jobs (
  id text primary key, -- 'job-101' or uuid string
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

-- 4. Create Spatial / Coordinate Index for fast nearby queries
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);

-- 5. Row Level Security (RLS) - Public Read/Write for Single Handyman App
-- (Can be restricted per user_id if authentication is enabled)
alter table public.jobs enable row level security;
alter table public.profiles enable row level security;

create policy "Allow anonymous select on jobs" on public.jobs for select using (true);
create policy "Allow anonymous insert on jobs" on public.jobs for insert with check (true);
create policy "Allow anonymous update on jobs" on public.jobs for update using (true);
create policy "Allow anonymous delete on jobs" on public.jobs for delete using (true);

create policy "Allow anonymous select on profiles" on public.profiles for select using (true);
create policy "Allow anonymous insert on profiles" on public.profiles for insert with check (true);
create policy "Allow anonymous update on profiles" on public.profiles for update using (true);

-- 6. Storage Bucket for Site Photos & Signatures
-- Run in Supabase SQL editor or create in Dashboard -> Storage -> New Bucket "job-photos" (Public)
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

create policy "Public Access to Job Photos" on storage.objects for select using (bucket_id = 'job-photos');
create policy "Public Upload to Job Photos" on storage.objects for insert with check (bucket_id = 'job-photos');
