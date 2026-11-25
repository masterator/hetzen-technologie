-- ============================================================
-- Hetzen Business OS - Supabase security fixes
-- Project: hetzen-business-os (ylddhoqixybescoqpuka)
-- Safe to run more than once. Does NOT delete any data.
-- How to use: Supabase dashboard -> SQL Editor -> paste -> Run
-- ============================================================

begin;

-- 1. Remove permissions logged-out visitors (anon) never need.
--    RLS already blocks them, but TRUNCATE ignores RLS, so take it away.
revoke all on public.clients          from anon;
revoke all on public.business_records from anon;
revoke all on public.services         from anon;
revoke all on public.portal_state     from anon;

--    Logged-in users only need read/add/edit/delete - not TRUNCATE etc.
revoke truncate, trigger, references on public.clients          from authenticated;
revoke truncate, trigger, references on public.business_records from authenticated;
revoke truncate, trigger, references on public.services         from authenticated;

--    Stop future tables getting these wide permissions automatically.
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on functions from anon;

-- 2. Stop a record being linked to someone else's client.
--    The client must belong to the same owner as the record.
alter table public.clients
  drop constraint if exists clients_id_owner_unique;
alter table public.clients
  add constraint clients_id_owner_unique unique (id, owner_id);

alter table public.business_records
  drop constraint if exists business_records_client_id_fkey;
alter table public.business_records
  drop constraint if exists business_records_client_owner_fkey;
alter table public.business_records
  add constraint business_records_client_owner_fkey
  foreign key (client_id, owner_id) references public.clients (id, owner_id)
  on delete set null (client_id);

-- 3. Basic data sanity rules.
alter table public.business_records drop constraint if exists business_records_amount_check;
alter table public.business_records add  constraint business_records_amount_check check (amount is null or amount >= 0);
alter table public.services drop constraint if exists services_price_check;
alter table public.services add  constraint services_price_check check (price_from is null or price_from >= 0);
alter table public.portal_state drop constraint if exists portal_state_size_check;
alter table public.portal_state add  constraint portal_state_size_check check (pg_column_size(data) < 5000000);

-- 4. Faster, cleaner security rules: (select auth.uid()) runs once per query
--    instead of once per row. Same protection, better speed.
drop policy if exists "Users can view their own clients"   on public.clients;
drop policy if exists "Users can insert their own clients" on public.clients;
drop policy if exists "Users can update their own clients" on public.clients;
drop policy if exists "Users can delete their own clients" on public.clients;
create policy clients_select on public.clients for select to authenticated using ((select auth.uid()) = owner_id);
create policy clients_insert on public.clients for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy clients_update on public.clients for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy clients_delete on public.clients for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "Users can view their own business records"   on public.business_records;
drop policy if exists "Users can insert their own business records" on public.business_records;
drop policy if exists "Users can update their own business records" on public.business_records;
drop policy if exists "Users can delete their own business records" on public.business_records;
create policy records_select on public.business_records for select to authenticated using ((select auth.uid()) = owner_id);
create policy records_insert on public.business_records for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy records_update on public.business_records for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy records_delete on public.business_records for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "services own rows" on public.services;
create policy services_owner_all on public.services for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- 5. Indexes (speed) + remove the duplicate index on portal_state.
create index if not exists business_records_owner_id_idx  on public.business_records (owner_id);
create index if not exists business_records_client_id_idx on public.business_records (client_id);
create index if not exists clients_owner_id_idx           on public.clients (owner_id);
create index if not exists services_owner_id_idx          on public.services (owner_id);
alter table public.portal_state drop constraint if exists portal_state_owner_id_unique;
drop index if exists public.portal_state_owner_id_unique;
drop index if exists public.portal_state_owner_id_idx;

commit;

-- ============================================================
-- ALSO DO IN THE DASHBOARD (can't be done with SQL):
--  a) Authentication -> Sign In / Providers -> Email:
--       turn OFF "Allow new users to sign up" (you're the only user)
--  b) Authentication -> Passwords: turn ON leaked password protection,
--       minimum length 12
--  c) Your account -> enable 2FA (authenticator app) on the portal login
--     and on your Supabase + GitHub accounts
-- ============================================================
