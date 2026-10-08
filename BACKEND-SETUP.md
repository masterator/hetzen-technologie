# Hetzen Technologies Business Portal — Backend Setup

## Architecture
GitHub Pages serves the static portal. Supabase provides Authentication and the portal_state table. The browser contains only the public publishable/anon key; never put a service-role key in GitHub.

## 1. Supabase table
The production portal stores one row per signed-in owner in public.portal_state:
- owner_id
- data (jsonb)
- settings (jsonb)
- report_history (jsonb)
- updated_at

## 2. Row Level Security — REQUIRED
Open Supabase → SQL Editor → New query. Open supabase-portal-rls.sql from this repository, copy the complete contents, paste it into SQL Editor and click Run.

The policies allow an authenticated user to read/write only the row whose owner_id equals auth.uid().

After running it, verify Table Editor → portal_state → RLS shows enabled.

## 3. First administrator
Create the owner account under Supabase → Authentication → Users. Sign in through business-portal.html.

Do not place passwords, service-role keys, bank credentials or private API keys in the repository.

## 4. Cloud sync safety
The portal keeps a local copy so work can continue if the network is unavailable. Cloud writes compare the last synced updated_at with the current cloud row before replacing the whole row. If another device changed the row first, the portal blocks the upload and shows an OUT OF DATE banner. The user can reload the cloud version or download the local changes.

## 5. Legacy dashboard
 dashboard.html and dashboard.js are legacy and use the old clients/business_records schema. The production workspace is business-portal.html. Do not use the legacy dashboard as the production business system until it is migrated to the portal schema or retired.

## 6. Contact and banking details
Business contact details are configurable in the portal. VAT and banking fields are intentionally blank until the owner supplies them.

Current contact values configured in the portal:
- Email: midimetjasilas93@gmail.com
- Phone: 081 300 4634

Please confirm these before publishing customer-facing financial documents.

## 7. Production checklist
1. Run supabase-portal-rls.sql.
2. Sign in to business-portal.html.
3. Confirm the portal can read the owner row.
4. Create a test record and confirm it reaches portal_state.
5. Open the portal in a second browser/device and verify conflict protection.
6. Make a full backup before real customer onboarding.

## 8. Privacy
Customer records may contain names, contact details, business information, requirements, project information and financial records. They are stored in the signed-in owner's Supabase portal_state row and locally in the browser for offline continuity. Use the portal's backup and logout controls responsibly.
