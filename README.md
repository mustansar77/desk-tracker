# Desk Tracker

Time tracking + periodic screenshots for your team, with an admin dashboard
to review hours and screenshots by date. Three pieces, one Supabase project:

```
supabase/    Database schema, security rules, and the employee-creation function
agent/       Desktop app your team installs — Start/Stop timer + screenshots
dashboard/   Web app you use to review time and screenshots
```

## Setup order

1. **[supabase/README.md](supabase/README.md)** — create your Supabase project,
   run the schema, create the storage bucket, deploy the edge function. Do
   this first; nothing else works without it.
2. **[dashboard/README.md](dashboard/README.md)** — run the admin dashboard,
   sign up, promote yourself to admin, add your first team member.
3. **[agent/README.md](agent/README.md)** — run the desktop agent in dev mode
   to test the full flow, then build the Windows installer to send to your
   team.

## How it works

- Each employee gets a real login (created by you, the admin, from the
  dashboard). They install the desktop agent, sign in once, accept the
  one-time consent notice, and use Start/Stop to log their sessions.
- While a session is running, the agent captures a screenshot every 3-5
  minutes (randomized, not a fixed beat) and uploads it straight to your
  Supabase project.
- It also measures mouse/keyboard **activity level** system-wide while
  tracking — whether input happened, never what was typed or clicked on —
  and attaches an activity % to each screenshot, the same way Upwork/Hubstaff
  do.
- Stopping the timer closes out that session with its total duration.
- You review everything in the dashboard: pick a team member and a date to
  see their sessions, total hours, average activity level, and open any
  session to see its screenshots (each tagged with its activity %).
- You can also **assign tasks** with a numeric target (e.g. "40 connection
  requests") to any team member for a given day. They see it in the agent
  app with a +1 button that only ever moves forward — once they hit the
  target, they write a short description and submit it, which you then see
  as a completed report in the dashboard.
- Row Level Security in Postgres enforces all of this server-side: employees
  can only ever read/write their own data; only admins can read everyone's.

## Nothing here is fake

There's no seeded/demo data anywhere — the dashboard and agent only ever show
what actually happened in your real Supabase project. The first thing you'll
see in each app is an empty state until you've signed up, added a team
member, and run a real tracking session.
