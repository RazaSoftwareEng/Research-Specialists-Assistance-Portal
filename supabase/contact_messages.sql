-- Contact form messages (run once in Supabase SQL Editor)
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 200),
  phone      text check (char_length(phone) <= 40),
  subject    text check (char_length(subject) <= 100),
  message    text not null check (char_length(message) between 1 and 5000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (even not logged in) can send a message; nobody but admins can read them
drop policy if exists "contact insert" on public.contact_messages;
create policy "contact insert" on public.contact_messages for insert to anon, authenticated
  with check (is_read = false);

drop policy if exists "contact admin read" on public.contact_messages;
create policy "contact admin read" on public.contact_messages for select to authenticated using (public.is_admin());

drop policy if exists "contact admin update" on public.contact_messages;
create policy "contact admin update" on public.contact_messages for update to authenticated using (public.is_admin());

drop policy if exists "contact admin delete" on public.contact_messages;
create policy "contact admin delete" on public.contact_messages for delete to authenticated using (public.is_admin());

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
