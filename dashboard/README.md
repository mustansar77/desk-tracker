# Desk Tracker — admin dashboard

The web app you (the owner/admin) use to see who's tracked what, on which
day, and review their screenshots.

## Setup

1. Make sure you've completed [`../supabase/README.md`](../supabase/README.md) first.
2. `cp .env.example .env` and fill in your project's `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
3. `npm install`

## Run it

```bash
npm run dev
```

Open the URL it prints (usually http://localhost:5173). There's no public
sign-up form here on purpose — create your first (owner/admin) account via
Supabase Studio's Authentication > Users screen, then follow the "promote
yourself to admin" SQL step in the Supabase README (see step 6), and sign in.

From there, use **+ Add** in the left sidebar to create real logins for your
team — they'll use those same credentials in the desktop agent app.

## Build for production

```bash
npm run build
```

Outputs static files to `dist/` — host them anywhere that serves static
sites (the app talks directly to Supabase, so there's no backend server to
deploy alongside it).
