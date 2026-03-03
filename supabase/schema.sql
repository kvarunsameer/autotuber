-- ─────────────────────────────────────────────────────────────────────────────
-- AUTOTUBER — Supabase Database Schema
-- Run this in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── PROFILES (extends auth.users) ────────────────────────────────────────────
create table if not exists profiles (
  id                      uuid references auth.users on delete cascade primary key,
  name                    text,
  plan                    text not null default 'free',  -- free | hobby | creator | pro
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  subscription_status     text default 'inactive',       -- active | inactive | canceled | past_due
  videos_used_this_month  integer not null default 0,
  billing_period_start    timestamptz default now(),
  services                jsonb not null default '{}',   -- elKey, ytToken, ytChannel, igToken, igAccount
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── VIDEOS ───────────────────────────────────────────────────────────────────
create table if not exists videos (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users on delete cascade not null,
  title            text,
  niche            text,
  hook             text,
  description      text,
  tags             text[] default '{}',
  thumbnail_text   text,
  views_potential  text,
  full_script      text,
  status           text not null default 'draft',   -- draft | rendering | published | failed
  video_style      text default 'gradient',
  voice_id         text,
  platforms        text[] default '{}',
  render_url       text,
  yt_video_id      text,
  ig_media_id      text,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table videos   enable row level security;

-- Profiles: users can only read/update their own profile
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- Videos: users can only CRUD their own videos
create policy "videos_select_own" on videos for select  using (auth.uid() = user_id);
create policy "videos_insert_own" on videos for insert  with check (auth.uid() = user_id);
create policy "videos_update_own" on videos for update  using (auth.uid() = user_id);
create policy "videos_delete_own" on videos for delete  using (auth.uid() = user_id and status != 'published');

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── AUTO-UPDATE updated_at ────────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on profiles for each row execute function touch_updated_at();
create trigger videos_updated_at   before update on videos   for each row execute function touch_updated_at();

-- ── INDEXES ───────────────────────────────────────────────────────────────────
create index if not exists videos_user_id_idx on videos(user_id);
create index if not exists videos_status_idx  on videos(status);
create index if not exists profiles_stripe_customer_idx on profiles(stripe_customer_id);

-- ── RPC FUNCTIONS ─────────────────────────────────────────────────────────────
-- Atomically increments the video usage counter for a user
create or replace function increment_video_usage(uid uuid)
returns void language sql security definer as $$
  update profiles
  set videos_used_this_month = videos_used_this_month + 1
  where id = uid;
$$;

-- Resets monthly video usage (call via pg_cron or manually each billing cycle)
create or replace function reset_monthly_usage()
returns void language sql security definer as $$
  update profiles
  set videos_used_this_month = 0,
      billing_period_start   = now();
$$;
