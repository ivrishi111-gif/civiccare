-- ============================================================
-- CIVICCARE — Supabase database schema
-- How to run: Supabase Dashboard → SQL Editor → New query
--             → paste this whole file → Run
-- ============================================================

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.complaints (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  category    text not null default 'Other',
  description text not null default '',
  location    text not null default '',
  photo       text,   -- stored as a data-URL in the MVP; move to Supabase Storage for production
  status      text not null default 'open',   -- open | in_progress | resolved
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists complaints_user_created_idx
  on public.complaints (user_id, created_at desc);
