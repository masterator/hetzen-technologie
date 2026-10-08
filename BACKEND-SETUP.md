# Hetzen Technologies Business Portal — Supabase Backend & Security

## Production architecture

GitHub Pages serves `business-portal.html`. Supabase provides Auth and PostgreSQL. The production portal stores one workspace row per authenticated owner in `public.portal_state`.

The browser uses only the public Supabase publishable key. That key is intentionally public; RLS and least-privilege grants protect the data. Never put a Supabase secret/service-role key or database password in GitHub.

## 1. BACK UP FIRST

### Manual row backup

Supabase Dashboard → **SQL Editor** → **New query**:

```sql
select owner_id,data,settings,report_history,updated_at
from public.portal_state
order by updated_at desc;
```

Run it, then use **Export CSV** if available or copy the result into a private file. Do not store the export in GitHub.

### Managed backups

Open **Database → Backups**. Supabase currently provides daily automated backups on Pro, Team and Enterprise. Pro retains 7 days, Team 14 days and Enterprise up to 30 days. Free does not include automatic backups. Point-in-Time Recovery is a separate paid add-on. If you are on Free, keep manual/off-site exports and consider upgrading before relying on managed recovery.

## 2. RUN THE SQL HARDENING FILE

Open **SQL Editor → New query**, paste the complete `supabase-portal-rls.sql`, and click **Run**.

It:
- creates `public.portal_state` if missing;
- adds missing columns without dropping existing data;
- requires `owner_id` to be UUID;
- ensures the owner primary key and FK to `auth.users(id)`;
- enables and forces RLS;
- removes/replaces old `portal_state` policies after first listing them;
- revokes API table privileges from `public` and `anon`;
- grants SELECT/INSERT/UPDATE/DELETE only to `authenticated`;
- installs a server timestamp trigger.

PostgreSQL does not allow `USING` on INSERT policies. INSERT therefore uses `WITH CHECK`; UPDATE uses both `USING` and `WITH CHECK`.

## 3. HOW ACCESS WORKS

A signed-in user can read, insert, update and delete only the row whose `owner_id` equals `(select auth.uid())`.

The UPDATE policy has both checks, so a user cannot update their row and change its `owner_id` to somebody else.

Signed-out `anon` requests have no table privileges.

## 4. updated_at AND THE PORTAL CONFLICT CHECK

The database trigger sets `updated_at` on INSERT and UPDATE. The browser must not supply its own timestamp.

After a successful whole-row upsert, the portal should read the server value:

```js
const { data: saved, error } = await window.hetzenSupabase
  .from('portal_state')
  .upsert({
    owner_id: user.id,
    data: db,
    settings,
    report_history: reportHistory
  }, { onConflict: 'owner_id' })
  .select('updated_at')
  .single();

if (error) throw error;
localStorage.setItem('hetzenLastCloudUpdatedAt', saved.updated_at);
```

This is the small application-side change needed to make the portal's persistent conflict timestamp match the server-generated timestamp.

## 5. LEGACY DASHBOARD

Repository inspection shows `dashboard.html`/ `dashboard.js` reads and writes:

- `public.clients`
- `public.business_records`
- `public.services`

The production `business-portal.html` uses `public.portal_state`.

These legacy tables are not treated as unused because the legacy dashboard still references them. Do not drop them until you confirm that dashboard is retired. Run `supabase-verify.sql` to inspect their columns and RLS state.

If the legacy dashboard must remain, those tables need their own owner model and RLS. Their exact columns must be inspected first; no guessed `owner_id` column is safe.

## 6. VERIFY TABLES, FUNCTIONS, VIEWS, REALTIME AND STORAGE

Run the read-only `supabase-verify.sql`.

It reports:
- every public table and RLS state;
- portal columns, constraints, policies, grants and trigger;
- public functions and whether anon/authenticated can execute them;
- public views/materialized views and select privileges;
- Realtime publication membership;
- Storage buckets and object policies;
- legacy dashboard table definitions.

Expected: `portal_state` is absent from `supabase_realtime`.

## 7. AUTH DASHBOARD SETTINGS

### Disable public sign-up

For a single-owner portal:

1. Supabase Dashboard → **Authentication**.
2. Open **Providers** or **Configuration**.
3. Open the Email provider.
4. Turn **Allow new users to sign up** OFF.
5. Save.

Existing users can still sign in.

### Email confirmation

Keep **Confirm Email** ON for future account creation/invitations.

### URLs

Authentication → **URL Configuration**:

**Site URL**
`https://masterator.github.io/hetzen-technologie/`

Allowed Redirect URLs should contain only URLs actually used. Confirm the production portal:

`https://masterator.github.io/hetzen-technologie/business-portal.html`

If password reset lands on `index.html`, also allow:

`https://masterator.github.io/hetzen-technologie/index.html`

Do not add localhost or broad wildcards to production unless required.

### Password security

Use minimum length **12+**, require uppercase/lowercase/digit/symbol, and enable leaked-password protection if available. Supabase says leaked-password protection is available on Pro and above.

### Rate limits

Keep the default Auth rate limits unless you have a demonstrated reason to change them. Supabase rate-limits sign-in/recovery/token endpoints and returns 429 when limits are exceeded.

## 8. MFA

Turn on MFA for the Supabase account used to administer this project:

1. Open your Supabase account settings.
2. Open **Security/MFA**.
3. Choose TOTP/authenticator app.
4. Scan the QR code.
5. Enter the current code.
6. Add a backup TOTP factor on a different device/app if possible.

If the organization is Pro/Team/Enterprise, organization-level MFA enforcement is also available.

## 9. PUBLIC API KEY CHECK

The repository search found no common `service_role`, `SUPABASE_SERVICE_ROLE`, `sb_secret_` or common live secret-key marker. The browser config uses a publishable key.

Do not print or share any secret key. Publishable keys are safe to expose only because RLS and grants restrict what they can reach.

## 10. ANONYMOUS TEST

Use placeholders only:

```bash
curl -i \
  -H "apikey: YOUR_PUBLIC_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer YOUR_PUBLIC_PUBLISHABLE_KEY" \
  "YOUR_SUPABASE_URL/rest/v1/portal_state?select=owner_id"
```

Expected: 401/403 or an empty result.

For POST/PATCH/DELETE, use the same placeholder key and a dummy UUID. Expected: 401/403 or zero affected rows.

Do not use a secret/service-role key for these tests.

## 11. SECOND USER TEST

Create a temporary test user under **Authentication → Users**. Sign in to the portal as that user.

Expected:
- first user's row is invisible;
- first user's row cannot be updated/deleted;
- the second user can only access its own row.

Delete the test user after the test.

Do not use the SQL Editor as the RLS isolation test; the Dashboard SQL editor uses elevated database privileges.

## 12. REAL PORTAL TEST

1. Open the production portal.
2. Sign in.
3. Confirm existing data loads.
4. Make one harmless edit.
5. Confirm the cloud save succeeds.
6. Refresh.
7. Confirm the edit remains.
8. Use two browser sessions to test stale-save conflict protection.

## 13. SECURITY AND PERFORMANCE ADVISORS

Dashboard → **Advisors → Security Advisor** and **Performance Advisor**.

Review, do not blindly dismiss:
- RLS disabled;
- RLS enabled with no policy;
- permissive `USING(true)`/broad policies;
- multiple permissive policies;
- exposed auth users;
- unsafe SECURITY DEFINER views/functions;
- mutable function search_path;
- anon/authenticated execution of privileged functions;
- public Storage buckets;
- sensitive columns exposed;
- unindexed foreign keys;
- slow RLS/auth initplan warnings;
- missing primary keys.

An unindexed FK is mainly a performance issue. RLS-disabled, permissive-policy, exposed-view/function and public-bucket findings can be security issues.

## 14. POPIA TECHNICAL OPERATING RULES

Use least privilege, MFA, private backups/exports, controlled retention, deletion processes and access review. This technical hardening does not by itself constitute a legal determination of POPIA compliance.

## 15. FINAL VERIFICATION ITEMS

The following must be verified in the live Supabase Dashboard because they cannot be truthfully run from this repository connection:

- SQL hardening completed successfully;
- live RLS/forced-RLS state;
- live policies and grants;
- live Realtime publication;
- live Storage buckets/policies;
- live public functions/views;
- Auth sign-up disabled;
- password policy/leaked-password protection;
- MFA enabled;
- live portal login/load/edit/save/refresh;
- second-user isolation;
- server timestamp read-back in the portal save code;
- Security/Performance Advisor results;
- actual plan/backups/PITR status.

Until those live checks pass, the project is **not yet verified safe for real customer data**.
