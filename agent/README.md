# Desk Tracker — desktop agent

This is what each team member installs on their laptop. It shows a consent
notice once, then a simple sign-in and a Start/Stop button. While running, it
uploads a screenshot every 3-5 minutes and logs the session's start/stop time.

## Setup (do this once, before building an installer for the team)

1. Make sure you've completed [`../supabase/README.md`](../supabase/README.md) first.
2. `cp .env.example .env` and fill in your project's `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. `npm install`

## Run it in development

```bash
npm run dev
```

This opens the app in a window so you can test the whole flow: consent →
sign in with an employee account created from the admin dashboard → Start →
(wait a few minutes) → check the dashboard for a new screenshot → Stop.

## Build a Windows installer to distribute to your team

```bash
npm run dist
```

The installer (`.exe`) is created in `release/`. Send that file to each team
member — running it installs the app, and it will keep running quietly in the
system tray between sessions (closing the window doesn't stop tracking; use
the tray icon's Quit option, or Stop the timer first).

## How the screenshot timing works

While a timer is running, the app waits a random delay between 3 and 5
minutes, takes one screenshot, uploads it, and repeats — so captures land at
unpredictable points instead of a perfectly fixed 5-minute beat.

## Project picker

If the admin has assigned the signed-in employee to one or more projects (see
the dashboard's Project tracking / Organizations tabs), a **Project**
dropdown appears above the Start button. Picking one before hitting Start
tags that session to the project; leaving it on "No project" behaves exactly
like before. The dropdown is disabled while a session is running.
