-- ChatHop Phase 2 schema (Supabase/Postgres)

create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  platform text not null,
  messages jsonb not null,
  category text,
  upvote_count int default 0,
  view_count int default 0,
  created_at timestamptz default now()
);

create table if not exists upvotes (
  user_id uuid references profiles(id),
  publication_id uuid references publications(id),
  created_at timestamptz default now(),
  primary key (user_id, publication_id)
);

create table if not exists follows (
  follower_id uuid references profiles(id),
  following_id uuid references profiles(id),
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  platform text not null,
  title text not null,
  url text,
  messages jsonb not null,
  message_count int,
  word_count int,
  tags text[] default '{}',
  custom_tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
