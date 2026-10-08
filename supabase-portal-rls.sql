-- Hetzen Technologies — production Supabase hardening
-- File: supabase-portal-rls.sql
-- Run the whole file in Supabase SQL Editor as the project owner.
-- Safe to re-run: it never drops/truncates portal_state data.
--
-- PostgreSQL note: INSERT policies use WITH CHECK only. INSERT does not
-- support USING. UPDATE uses both USING and WITH CHECK.

begin;

-- 0) Show existing policies BEFORE they are replaced.
select schemaname, tablename, policyname, permissive, roles, cmd,
       qual as using_expression, with_check
from pg_policies
where schemaname='public' and tablename='portal_state'
order by policyname;

-- 1) Create the required table if it does not exist.
create table if not exists public.portal_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  settings jsonb,
  report_history jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Add missing columns without dropping existing data.
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='portal_state' and column_name='data')
  then alter table public.portal_state add column data jsonb; end if;

  if not exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='portal_state' and column_name='settings')
  then alter table public.portal_state add column settings jsonb; end if;

  if not exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='portal_state' and column_name='report_history')
  then alter table public.portal_state add column report_history jsonb; end if;

  if not exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='portal_state' and column_name='updated_at')
  then alter table public.portal_state add column updated_at timestamptz; end if;
end $$;

-- Normalize only NULLs introduced by a missing/old column. Existing non-NULL
-- business data is not replaced.
update public.portal_state set data='{}'::jsonb where data is null;
update public.portal_state set updated_at=now() where updated_at is null;

alter table public.portal_state
  alter column data set default '{}'::jsonb,
  alter column data set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- 3) Do not guess a type conversion for owner_id.
do $$
declare owner_type text;
begin
  select data_type into owner_type
  from information_schema.columns
  where table_schema='public' and table_name='portal_state'
    and column_name='owner_id';

  if owner_type is distinct from 'uuid' then
    raise exception
      'portal_state.owner_id must be uuid. Current type is %. No automatic type conversion was attempted.',
      owner_type;
  end if;
end $$;

-- 4) Add the primary key only if the existing table has none.
do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='portal_state'
      and c.contype='p'
  ) then
    alter table public.portal_state
      add constraint portal_state_pkey primary key (owner_id);
  end if;
end $$;

-- 5) Ensure the FK to auth.users exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    join pg_class rt on rt.oid=c.confrelid
    join pg_namespace rn on rn.oid=rt.relnamespace
    where n.nspname='public' and t.relname='portal_state'
      and c.contype='f'
      and rn.nspname='auth' and rt.relname='users'
  ) then
    alter table public.portal_state
      add constraint portal_state_owner_id_fkey
      foreign key (owner_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- 6) Server-owned timestamp. The trigger controls INSERT and UPDATE.
create or replace function public.portal_state_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists portal_state_set_updated_at on public.portal_state;

create trigger portal_state_set_updated_at
before insert or update on public.portal_state
for each row
execute function public.portal_state_set_updated_at();

-- Not a browser API function.
revoke all on function public.portal_state_set_updated_at() from public, anon, authenticated;

-- 7) Replace every existing portal_state policy.
-- The SELECT at the top records the policy names/definitions before removal.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname='public' and tablename='portal_state'
  loop
    execute format('drop policy if exists %I on public.portal_state', p.policyname);
  end loop;
end $$;

alter table public.portal_state enable row level security;
alter table public.portal_state force row level security;

-- 8) Least-privilege table grants.
revoke all on table public.portal_state from public;
revoke all on table public.portal_state from anon;
revoke all on table public.portal_state from authenticated;

grant select, insert, update, delete
on table public.portal_state to authenticated;

-- 9) Four owner-only policies.
create policy "portal_state_owner_select"
on public.portal_state
for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "portal_state_owner_insert"
on public.portal_state
for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "portal_state_owner_update"
on public.portal_state
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "portal_state_owner_delete"
on public.portal_state
for delete to authenticated
using ((select auth.uid()) = owner_id);

create unique index if not exists portal_state_owner_id_unique
on public.portal_state(owner_id);

commit;

-- Final state.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='portal_state';

select policyname, cmd, roles, qual as using_expression, with_check
from pg_policies
where schemaname='public' and tablename='portal_state'
order by policyname;
