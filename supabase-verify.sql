-- Hetzen Technologies — read-only Supabase verification
-- Run in SQL Editor. This file changes nothing.

select n.nspname schema_name,c.relname table_name,
       c.relrowsecurity rls_enabled,c.relforcerowsecurity rls_forced
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='portal_state';

select ordinal_position,column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_schema='public' and table_name='portal_state'
order by ordinal_position;

select conname,contype,pg_get_constraintdef(oid) definition
from pg_constraint
where conrelid='public.portal_state'::regclass
order by conname;

select policyname,permissive,roles,cmd,
       qual as using_expression,with_check
from pg_policies
where schemaname='public' and tablename='portal_state'
order by policyname;

select grantee,privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name='portal_state'
  and grantee in ('anon','authenticated','public')
order by grantee,privilege_type;

select trigger_name,event_manipulation,action_timing,action_statement
from information_schema.triggers
where event_object_schema='public' and event_object_table='portal_state'
order by trigger_name,event_manipulation;

select n.nspname schema_name,c.relname table_name,
       case c.relkind when 'r' then 'table' when 'p' then 'partitioned table'
       when 'v' then 'view' when 'm' then 'materialized view'
       when 'f' then 'foreign table' else c.relkind::text end object_type,
       c.relrowsecurity rls_enabled,c.relforcerowsecurity rls_forced
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p','v','m','f')
order by c.relname;

select n.nspname schema_name,p.proname function_name,
       pg_get_function_identity_arguments(p.oid) arguments,
       p.prosecdef security_definer,
       has_function_privilege('anon',p.oid,'execute') anon_can_execute,
       has_function_privilege('authenticated',p.oid,'execute') authenticated_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
order by p.proname;

select n.nspname schema_name,c.relname view_name,c.relkind,
       has_table_privilege('anon',c.oid,'select') anon_can_select,
       has_table_privilege('authenticated',c.oid,'select') authenticated_can_select
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('v','m')
order by c.relname;

-- portal_state must NOT appear in this result.
select p.pubname publication_name,n.nspname schema_name,c.relname table_name
from pg_publication p
join pg_publication_rel pr on pr.prpubid=p.oid
join pg_class c on c.oid=pr.prrelid
join pg_namespace n on n.oid=c.relnamespace
where p.pubname='supabase_realtime'
order by n.nspname,c.relname;

select id,name,public,created_at,updated_at
from storage.buckets order by name;

select policyname,cmd,roles,qual as using_expression,with_check
from pg_policies
where schemaname='storage' and tablename='objects'
order by policyname;

-- Legacy dashboard tables.
select table_name,
       string_agg(column_name||' '||data_type,', ' order by ordinal_position) columns
from information_schema.columns
where table_schema='public'
  and table_name in ('clients','business_records','services')
group by table_name order by table_name;

select c.relname table_name,c.relrowsecurity rls_enabled,
       c.relforcerowsecurity rls_forced
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('clients','business_records','services')
order by c.relname;

select count(*) portal_state_rows from public.portal_state;
