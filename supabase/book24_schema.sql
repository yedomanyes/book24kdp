create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  photo_url text,
  email_verified boolean default false,
  provider_ids jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.accounts (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.books (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  title text,
  market_niche text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.brain_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, account_id)
);

create table if not exists public.queue_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  book_id text not null,
  title text,
  niche text,
  content jsonb not null,
  quality_score numeric default 0,
  synced_to_obsidian boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_diversity_embeddings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  book_id text not null,
  title text,
  opening_text text,
  vector jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_user_account_idx on public.books(user_id, account_id);
create index if not exists queue_items_user_account_sync_idx on public.queue_items(user_id, account_id, synced_to_obsidian);
create index if not exists gde_user_idx on public.global_diversity_embeddings(user_id);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.books enable row level security;
alter table public.brain_states enable row level security;
alter table public.queue_items enable row level security;
alter table public.global_diversity_embeddings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "accounts_all_own" on public.accounts;
create policy "accounts_all_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "books_all_own" on public.books;
create policy "books_all_own" on public.books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "brain_states_all_own" on public.brain_states;
create policy "brain_states_all_own" on public.brain_states for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "queue_items_all_own" on public.queue_items;
create policy "queue_items_all_own" on public.queue_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gde_all_own" on public.global_diversity_embeddings;
create policy "gde_all_own" on public.global_diversity_embeddings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
