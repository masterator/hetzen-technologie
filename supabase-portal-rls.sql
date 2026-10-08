-- Hetzen Technologies portal_state production RLS
-- Run this in Supabase SQL Editor while signed in as the project owner.
alter table if exists public.portal_state enable row level security;

drop policy if exists "Portal owners can read their own state" on public.portal_state;
create policy "Portal owners can read their own state"
on public.portal_state for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Portal owners can insert their own state" on public.portal_state;
create policy "Portal owners can insert their own state"
on public.portal_state for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Portal owners can update their own state" on public.portal_state;
create policy "Portal owners can update their own state"
on public.portal_state for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Portal owners can delete their own state" on public.portal_state;
create policy "Portal owners can delete their own state"
on public.portal_state for delete
to authenticated
using (owner_id = auth.uid());

-- Recommended uniqueness for the whole-row storage model:
create unique index if not exists portal_state_owner_id_unique on public.portal_state(owner_id);
