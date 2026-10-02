-- Hetzen Technologies Business OS
-- Supabase/PostgreSQL schema
-- Run this in Supabase SQL Editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record_type text not null check (record_type in ('lead','quote','invoice','project','task','document')),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  category text,
  status text not null default 'New',
  value numeric(14,2) not null default 0,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  price_from numeric(14,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.business_records enable row level security;
alter table public.services enable row level security;

drop policy if exists "profiles own row" on public.profiles;
create policy "profiles own row" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "clients own rows" on public.clients;
create policy "clients own rows" on public.clients for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "records own rows" on public.business_records;
create policy "records own rows" on public.business_records for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "services own rows" on public.services;
create policy "services own rows" on public.services for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.services (name, description, price_from)
select v.name, v.description, v.price_from
from (values
 ('Website & Web Development','Business websites, landing pages and web applications',750),
 ('AI & Automation','AI assistants, workflows and business automation',null),
 ('Custom Software','Business-specific software and internal systems',null),
 ('API & System Integration','Connect systems, APIs and business tools',null),
 ('Branding & Digital Identity','Brand identity, digital assets and online presence',null),
 ('IT / Digital Solutions','Digital infrastructure and technology solutions',null)
) as v(name,description,price_from)
where not exists (select 1 from public.services);
