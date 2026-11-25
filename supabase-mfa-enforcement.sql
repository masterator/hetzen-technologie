-- ============================================================
-- Hetzen Business OS - require two-step verification for data access
-- Once a user has a verified authenticator (TOTP) factor, the database
-- refuses their portal data unless the session passed the 6-digit code
-- (aal2). Users with no factor are unaffected until they enrol.
-- These are RESTRICTIVE policies: they are added on top of the existing
-- owner-only policies, never replacing them.
-- Safe to run more than once.
-- ============================================================

-- Private helper (the "private" schema is not exposed through the API).
-- Runs with owner rights so it can read auth.mfa_factors, but only ever
-- answers yes/no about the calling user.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.mfa_requirement_met()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select auth.jwt()->>'aal'), '') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    );
$$;

revoke all on function private.mfa_requirement_met() from public, anon;
grant execute on function private.mfa_requirement_met() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['portal_state','clients','business_records','services'] loop
    execute format('drop policy if exists require_mfa_when_enrolled on public.%I', t);
    execute format(
      'create policy require_mfa_when_enrolled on public.%I as restrictive for all to authenticated
         using ((select private.mfa_requirement_met()))
         with check ((select private.mfa_requirement_met()))', t);
  end loop;
end $$;

-- Lost your phone? Supabase dashboard -> Authentication -> Users ->
-- your user -> remove the MFA factor. Then sign in and set it up again.
