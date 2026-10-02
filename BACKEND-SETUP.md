# Hetzen Business OS — Cloud Backend Setup

The GitHub Pages website is static, so it cannot safely run a private database by itself.

The intended architecture is:

GitHub Pages → Hetzen Dashboard → Supabase Auth → PostgreSQL Database

## 1. Create the database
Create a Supabase project, open SQL Editor, and run `supabase-schema.sql`.

The schema creates:
- secure user profiles
- clients
- leads
- quotes
- invoices
- projects
- tasks
- documents
- service catalogue
- Row Level Security policies
- automatic user profile creation

## 2. Create your first admin
In Supabase Authentication, create your own user account.

Do NOT put a service-role key in the GitHub repository or browser.

## 3. Connect the dashboard
Create `supabase-config.js` from the example file and enter:
- your Supabase project URL
- your Supabase anon/publishable key

Only the public anon/publishable key belongs in the browser.

## 4. Production access
The next integration step is to replace the dashboard's browser localStorage adapter with Supabase Auth + database calls. The localStorage version remains available as a fallback until the cloud credentials are supplied.

## Important
Do not store passwords, service-role keys, private API keys, banking credentials, or other secrets in GitHub.
