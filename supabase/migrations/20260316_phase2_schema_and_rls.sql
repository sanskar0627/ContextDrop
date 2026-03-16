-- ChatHop Phase 2 schema + RLS
-- Apply in Supabase SQL editor or via Supabase CLI migrations.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  platform text not null,
  messages jsonb not null,
  category text,
  upvote_count int not null default 0,
  view_count int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.upvotes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  publication_id uuid not null references public.publications(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, publication_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  title text not null,
  url text,
  messages jsonb not null,
  message_count int not null default 0,
  word_count int not null default 0,
  tags text[] not null default '{}',
  custom_tags text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_publications_created_at on public.publications (created_at desc);
create index if not exists idx_publications_upvotes on public.publications (upvote_count desc);
create index if not exists idx_publications_category on public.publications (category);
create index if not exists idx_bookmarks_user_updated on public.bookmarks (user_id, updated_at desc);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    split_part(coalesce(new.email, ''), '@', 1),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.publications enable row level security;
alter table public.upvotes enable row level security;
alter table public.follows enable row level security;
alter table public.bookmarks enable row level security;

-- Profiles: everyone can read, only owner can update own profile.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

-- Publications: public read, owner insert/update/delete.
drop policy if exists "publications_select_all" on public.publications;
create policy "publications_select_all" on public.publications
for select using (true);

drop policy if exists "publications_insert_own" on public.publications;
create policy "publications_insert_own" on public.publications
for insert with check (auth.uid() = user_id);

drop policy if exists "publications_update_own" on public.publications;
create policy "publications_update_own" on public.publications
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "publications_delete_own" on public.publications;
create policy "publications_delete_own" on public.publications
for delete using (auth.uid() = user_id);

-- Upvotes: users can read all, insert/delete only their own rows.
drop policy if exists "upvotes_select_all" on public.upvotes;
create policy "upvotes_select_all" on public.upvotes
for select using (true);

drop policy if exists "upvotes_insert_own" on public.upvotes;
create policy "upvotes_insert_own" on public.upvotes
for insert with check (auth.uid() = user_id);

drop policy if exists "upvotes_delete_own" on public.upvotes;
create policy "upvotes_delete_own" on public.upvotes
for delete using (auth.uid() = user_id);

-- Follows: users can read all, insert/delete only their own follow rows.
drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" on public.follows
for select using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows
for insert with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows
for delete using (auth.uid() = follower_id);

-- Bookmarks: private per user.
drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own" on public.bookmarks
for select using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own" on public.bookmarks
for insert with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own" on public.bookmarks
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own" on public.bookmarks
for delete using (auth.uid() = user_id);
