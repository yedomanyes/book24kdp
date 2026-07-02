-- Tabelle für Aktivitäten erstellen
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_email text,
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

-- RLS (Row Level Security) aktivieren
alter table public.activity_logs enable row level security;

-- Admin darf alles sehen
drop policy if exists "activity_logs_admin_select" on public.activity_logs;
create policy "activity_logs_admin_select" on public.activity_logs for select using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and is_owner = true
  )
);

-- Alle dürfen einfügen (für ihre eigenen Aktionen)
drop policy if exists "activity_logs_insert" on public.activity_logs;
create policy "activity_logs_insert" on public.activity_logs for insert with check (
  auth.uid() = user_id
);

-- RPC zum Abrufen der Logs (inkl. Email)
drop function if exists public.admin_get_activity_logs();

create or replace function public.admin_get_activity_logs()
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  action text,
  details text,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  -- Prüfe ob der Anfragende Admin ist
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_owner = true
  ) then
    raise exception 'Not authorized';
  end if;

  return query
  select 
    a.id,
    a.user_id,
    a.user_email,
    a.action,
    a.details,
    a.created_at
  from public.activity_logs a
  order by a.created_at desc
  limit 100;
end;
$$;
