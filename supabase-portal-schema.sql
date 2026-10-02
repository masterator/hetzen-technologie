-- Hetzen Technologies Business Portal cloud state
-- Run this in Supabase SQL Editor for the "Hetzen Business OS" project.
create table if not exists public.portal_state (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  settings jsonb,
  report_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portal_state enable row level security;

create policy "Portal owners can read their own state"
on public.portal_state for select
to authenticated
using (auth.uid() = owner_id);

create policy "Portal owners can insert their own state"
on public.portal_state for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "Portal owners can update their own state"
on public.portal_state for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Portal owners can delete their own state"
on public.portal_state for delete
to authenticated
using (auth.uid() = owner_id);

create index if not exists portal_state_owner_id_idx on public.portal_state(owner_id);
