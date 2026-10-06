-- Routes app: database setup.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again.

create table if not exists public.routes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  colour      text not null check (colour ~ '^#[0-9a-fA-F]{6}$'),
  -- Ordered list of clicked points: [[lat, lng], [lat, lng], ...]
  points      jsonb not null check (jsonb_typeof(points) = 'array' and jsonb_array_length(points) >= 2),
  distance_m  double precision not null check (distance_m >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists routes_user_created_idx
  on public.routes (user_id, created_at desc);

-- Newer Supabase projects do not expose tables to the browser API automatically,
-- so grant access to signed-in users explicitly. Visitors who are not signed in
-- (the "anon" role) get nothing.
grant select, insert, update, delete on public.routes to authenticated;

-- Row-level security: each user can only see and change their own routes.
alter table public.routes enable row level security;

drop policy if exists "Users read own routes" on public.routes;
create policy "Users read own routes"
  on public.routes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users add own routes" on public.routes;
create policy "Users add own routes"
  on public.routes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users change own routes" on public.routes;
create policy "Users change own routes"
  on public.routes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own routes" on public.routes;
create policy "Users delete own routes"
  on public.routes for delete to authenticated
  using ((select auth.uid()) = user_id);
