# Supabase setup (do this first)

Everything else in this repo (the `agent/` desktop app and the `dashboard/`
admin app) depends on a Supabase project existing and being configured this
way. This takes about 10 minutes.

## 1. Create the project
1. Go to https://supabase.com, sign in, click **New project**.
2. Pick a name (e.g. `desk-tracker`), a database password (save it somewhere),
   and a region close to your team. Create the project and wait for it to
   finish provisioning.

## 2. Run the schema
1. In the project, open **SQL Editor > New query**.
2. Paste the entire contents of [`schema.sql`](./schema.sql) and click **Run**.
   This creates the `profiles`, `time_entries`, `screenshots` tables, the
   auto-profile trigger, and all Row Level Security policies.

## 3. Create the storage bucket
1. Open **Storage** in the sidebar > **New bucket**.
2. Name it exactly `screenshots`, and set it to **Private** (not public).
3. That's it — the storage policies from `schema.sql` already restrict access
   so each employee can only write/read their own folder, and admins can read
   everyone's.

## 4. Get your API keys
1. Open **Project Settings > API**.
2. Copy the **Project URL** and the **anon public** key — you'll paste these
   into `agent/.env` and `dashboard/.env` (see each app's README).
3. Also copy the **service_role** key — this is only ever used as a secret for
   the edge function below. Never put it in the desktop app or dashboard.

## 5. Deploy the `create-employee` edge function
This lets you add team members from the admin dashboard instead of the
Supabase console. Requires the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase login
supabase link --project-ref <your-project-ref>   # found in Project Settings > General
supabase functions deploy create-employee
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
```

(`SUPABASE_URL` is provided automatically to edge functions — no need to set it.)

## 6. Create your own owner/admin account
The dashboard has no public sign-up form on purpose (you don't want random
people creating their own accounts) — so your first account is created
directly in Supabase Studio:
1. Open **Authentication > Users > Add user > Create new user**. Enter your
   real email and a password, and check **Auto Confirm User**. Click
   **Create user** — this automatically creates your `profiles` row too (as
   a normal `employee`, via the trigger).
2. Back in the Supabase **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Log out and back into the dashboard — you should now see the admin view.

From here on, use the dashboard's **Add team member** button to create logins
for the rest of your team — no more manual SQL needed.

## Updating an existing project
`schema.sql` is safe to re-run any time — it only creates things that don't
already exist and adds any new columns/tables. Whenever this repo's
`schema.sql` changes (e.g. new features like activity levels or tasks), just
paste the current version into the SQL Editor again and re-run it to pick up
the changes on your existing project.
