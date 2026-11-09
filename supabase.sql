-- Tesitura: tabla para guardar tus datos en Supabase (el mismo proyecto que Entreno).
-- Pegá esto una sola vez en Supabase > SQL Editor > New query > Run.
create table if not exists public.tesitura_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.tesitura_data enable row level security;
drop policy if exists "cada uno ve solo sus datos" on public.tesitura_data;
create policy "cada uno ve solo sus datos" on public.tesitura_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
