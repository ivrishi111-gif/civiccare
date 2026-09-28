-- ============================================================
-- CIVICCARE — updated schema (v2)
-- Run the WHOLE file in: Supabase Dashboard → SQL Editor → Run
-- (It is safe to run again — everything uses "if not exists")
-- ============================================================

-- 1) users: add mobile number + language preference, email now optional
alter table public.users add column if not exists phone text unique;
alter table public.users add column if not exists language text not null default 'en';
alter table public.users alter column email drop not null;

-- 2) authorities (municipal staff accounts — separate from citizens)
create table if not exists public.authorities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null unique,
  department    text not null default 'Municipal Corporation',
  area          text not null default '',
  password_hash text not null,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 3) complaints: before/after proof photos + assigned authority
alter table public.complaints add column if not exists before_image text;
alter table public.complaints add column if not exists after_image text;
alter table public.complaints add column if not exists authority_id uuid references public.authorities(id);

-- 4) complaint history (the timeline: who did what, when)
create table if not exists public.complaint_history (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status       text not null,
  message      text not null default '',
  actor        text not null default 'system',
  role         text not null default 'system',   -- user | authority | system
  created_at   timestamptz not null default now()
);

create index if not exists complaint_history_complaint_idx
  on public.complaint_history (complaint_id, created_at);
