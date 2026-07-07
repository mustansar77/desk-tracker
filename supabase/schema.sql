-- Desk Tracker schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'employee');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, created automatically on signup
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role user_role not null default 'employee',
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER: safe to check role without recursive RLS lookups
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'employee'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- time_entries: one row per start/stop session
-- ---------------------------------------------------------------------------
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_user_start_idx
  on public.time_entries (user_id, start_time desc);

-- ---------------------------------------------------------------------------
-- organizations: client companies your team does work for (grouping/tagging
-- only — everything is still managed by the one admin, not separate tenants)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- projects: optionally grouped under an organization, assigned to employees
-- via project_members. Time entries can optionally be tagged to a project.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.time_entries
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists projects_organization_idx
  on public.projects (organization_id);
create index if not exists project_members_user_idx
  on public.project_members (user_id);
create index if not exists time_entries_project_idx
  on public.time_entries (project_id);

-- ---------------------------------------------------------------------------
-- screenshots: one row per captured screenshot
-- ---------------------------------------------------------------------------
create table if not exists public.screenshots (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  captured_at timestamptz not null default now(),
  -- Activity level for the interval this screenshot represents (mouse/keyboard
  -- presence, never what was actually typed or clicked on).
  activity_percent smallint,
  keyboard_events integer not null default 0,
  mouse_events integer not null default 0
);

-- Safe to re-run on an existing database: adds the activity columns above
-- if this table was created before they existed.
alter table public.screenshots add column if not exists activity_percent smallint;
alter table public.screenshots add column if not exists keyboard_events integer not null default 0;
alter table public.screenshots add column if not exists mouse_events integer not null default 0;

create index if not exists screenshots_entry_idx
  on public.screenshots (time_entry_id);
create index if not exists screenshots_user_captured_idx
  on public.screenshots (user_id, captured_at desc);

-- ---------------------------------------------------------------------------
-- tasks: admin-assigned quotas ("40 connection requests today"). Employees
-- can only push current_count up (never down) and attach a description once
-- they hit the target; only admins can create tasks or edit their details.
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null,
  target_count integer not null check (target_count > 0),
  current_count integer not null default 0 check (current_count >= 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  description text,
  task_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_date_idx
  on public.tasks (user_id, task_date desc);

-- Server-side enforcement (not just UI): non-admins may only move
-- current_count forward (up to the target) and set description/status on
-- their own tasks; they can never edit title/target/assignee/date.
create or replace function public.enforce_task_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.title is distinct from old.title
       or new.target_count is distinct from old.target_count
       or new.user_id is distinct from old.user_id
       or new.task_date is distinct from old.task_date
       or new.created_by is distinct from old.created_by then
      raise exception 'Only an admin can change task details';
    end if;
    if new.current_count < old.current_count then
      raise exception 'Task progress cannot be decreased';
    end if;
    if new.current_count > old.target_count then
      raise exception 'Task progress cannot exceed the target';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_task_update on public.tasks;
create trigger on_task_update
  before update on public.tasks
  for each row execute function public.enforce_task_update_rules();

-- Atomic "+1" that respects the trigger above and can never overshoot the
-- target, even if the button is double-clicked or two calls race.
create or replace function public.increment_task_progress(p_task_id uuid)
returns public.tasks
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.tasks;
begin
  update public.tasks
  set current_count = least(current_count + 1, target_count)
  where id = p_task_id and user_id = auth.uid()
  returning * into result;

  if result.id is null then
    raise exception 'Task not found or not yours';
  end if;

  return result;
end;
$$;

grant execute on function public.increment_task_progress(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.time_entries enable row level security;
alter table public.screenshots enable row level security;
alter table public.tasks enable row level security;
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- time_entries
drop policy if exists "time_entries_select_own_or_admin" on public.time_entries;
create policy "time_entries_select_own_or_admin"
  on public.time_entries for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "time_entries_insert_own" on public.time_entries;
create policy "time_entries_insert_own"
  on public.time_entries for insert
  with check (user_id = auth.uid());

drop policy if exists "time_entries_update_own" on public.time_entries;
create policy "time_entries_update_own"
  on public.time_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- screenshots
drop policy if exists "screenshots_select_own_or_admin" on public.screenshots;
create policy "screenshots_select_own_or_admin"
  on public.screenshots for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "screenshots_insert_own" on public.screenshots;
create policy "screenshots_insert_own"
  on public.screenshots for insert
  with check (user_id = auth.uid());

-- tasks
drop policy if exists "tasks_select_own_or_admin" on public.tasks;
create policy "tasks_select_own_or_admin"
  on public.tasks for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "tasks_insert_admin_only" on public.tasks;
create policy "tasks_insert_admin_only"
  on public.tasks for insert
  with check (public.is_admin());

drop policy if exists "tasks_update_own_or_admin" on public.tasks;
create policy "tasks_update_own_or_admin"
  on public.tasks for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "tasks_delete_admin_only" on public.tasks;
create policy "tasks_delete_admin_only"
  on public.tasks for delete
  using (public.is_admin());

-- organizations: admin only (employees don't need to see the client list)
drop policy if exists "organizations_admin_all" on public.organizations;
create policy "organizations_admin_all"
  on public.organizations for all
  using (public.is_admin())
  with check (public.is_admin());

-- projects: admin full access; employees can see projects they're a member of
drop policy if exists "projects_select_admin_or_member" on public.projects;
create policy "projects_select_admin_or_member"
  on public.projects for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
  );

drop policy if exists "projects_insert_admin" on public.projects;
create policy "projects_insert_admin"
  on public.projects for insert
  with check (public.is_admin());

drop policy if exists "projects_update_admin" on public.projects;
create policy "projects_update_admin"
  on public.projects for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "projects_delete_admin" on public.projects;
create policy "projects_delete_admin"
  on public.projects for delete
  using (public.is_admin());

-- project_members: admin full access; employees can see their own memberships
drop policy if exists "project_members_select_admin_or_own" on public.project_members;
create policy "project_members_select_admin_or_own"
  on public.project_members for select
  using (public.is_admin() or user_id = auth.uid());

drop policy if exists "project_members_insert_admin" on public.project_members;
create policy "project_members_insert_admin"
  on public.project_members for insert
  with check (public.is_admin());

drop policy if exists "project_members_delete_admin" on public.project_members;
create policy "project_members_delete_admin"
  on public.project_members for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket + policies (bucket itself is created via the dashboard UI,
-- see supabase/README.md — policies below apply once it exists)
-- ---------------------------------------------------------------------------
drop policy if exists "screenshots_storage_insert_own" on storage.objects;
create policy "screenshots_storage_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "screenshots_storage_select_own_or_admin" on storage.objects;
create policy "screenshots_storage_select_own_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'screenshots'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- One-time step: after you sign up your own owner account through the app,
-- promote yourself to admin (replace the email below):
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ---------------------------------------------------------------------------
