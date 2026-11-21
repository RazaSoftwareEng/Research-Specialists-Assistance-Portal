-- =====================================================================
-- Research Specialists Assistance - Supabase schema
-- Run this whole file once in: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

-- ---------- PROFILES (one per auth user, holds the role) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- DOCUMENTS ----------
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'pending'
                  check (status in ('pending', 'needs_changes', 'approved', 'rejected')),
  current_version int  not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Every uploaded file (v1, v2, v3 ...)
create table if not exists public.document_versions (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  version     int  not null,
  file_path   text not null,
  file_name   text not null,
  file_type   text,
  file_size   bigint,
  uploaded_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (document_id, version)
);

-- Admin review notes / suggestions
create table if not exists public.document_notes (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  author_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  version     int,
  note        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists documents_user_idx on public.documents (user_id);
create index if not exists versions_doc_idx  on public.document_versions (document_id);
create index if not exists notes_doc_idx     on public.document_notes (document_id);

-- Users may only re-submit (status -> pending); only admins set review status
create or replace function public.guard_document_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.is_admin() then
    new.user_id := old.user_id;
    if new.status is distinct from old.status and new.status <> 'pending' then
      raise exception 'Only admins can change the review status';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists documents_guard on public.documents;
create trigger documents_guard
  before update on public.documents
  for each row execute function public.guard_document_update();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles          enable row level security;
alter table public.documents         enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_notes    enable row level security;

-- profiles
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update own name" on public.profiles;
-- (role changes are done by you in SQL; users cannot edit profiles from the app)

-- documents
drop policy if exists "documents read" on public.documents;
create policy "documents read" on public.documents for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "documents insert" on public.documents;
create policy "documents insert" on public.documents for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "documents update" on public.documents;
create policy "documents update" on public.documents for update to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "documents delete" on public.documents;
create policy "documents delete" on public.documents for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- versions
drop policy if exists "versions read" on public.document_versions;
create policy "versions read" on public.document_versions for select to authenticated
  using (exists (select 1 from public.documents d
                 where d.id = document_id and (d.user_id = auth.uid() or public.is_admin())));

drop policy if exists "versions insert" on public.document_versions;
create policy "versions insert" on public.document_versions for insert to authenticated
  with check (uploaded_by = auth.uid() and exists (
    select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()));

-- notes
drop policy if exists "notes read" on public.document_notes;
create policy "notes read" on public.document_notes for select to authenticated
  using (exists (select 1 from public.documents d
                 where d.id = document_id and (d.user_id = auth.uid() or public.is_admin())));

drop policy if exists "notes insert" on public.document_notes;
create policy "notes insert" on public.document_notes for insert to authenticated
  with check (public.is_admin() and author_id = auth.uid());

drop policy if exists "notes delete" on public.document_notes;
create policy "notes delete" on public.document_notes for delete to authenticated
  using (public.is_admin());

-- ---------- TABLE PERMISSIONS (needed on newer Supabase projects) ----------
-- RLS policies above decide WHICH rows; these grants allow the API to touch the tables at all.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert on public.document_versions to authenticated;
grant select, insert, delete on public.document_notes to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------- STORAGE (private bucket, 20 MB, PDF / Word / images) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 20971520, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files are stored as: {user_id}/{document_id}/v{n}-{filename}
drop policy if exists "docs upload own folder" on storage.objects;
create policy "docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "docs read own or admin" on storage.objects;
create policy "docs read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "docs delete own or admin" on storage.objects;
create policy "docs delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =====================================================================
-- MAKE YOURSELF ADMIN (after signing up in the app), run:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =====================================================================

-- =====================================================================
-- CONTACT FORM (same as supabase/contact_messages.sql)
-- =====================================================================
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

-- =====================================================================
-- UPGRADE v2: categories, user details, full admin access
-- Run once in Supabase SQL Editor (safe to run again)
-- =====================================================================

-- ---------- Extra profile details ----------
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists institution text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, institution)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'institution'
  );
  return new;
end $$;

-- Users can edit their own name/phone/institution; only admins can change roles
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id;
  new.email := old.email;
  if not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin());

grant update (full_name, phone, institution, role) on public.profiles to authenticated;

-- ---------- Document category (article type) ----------
alter table public.documents add column if not exists category text not null default 'original_article';
alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check
  check (category in ('original_article', 'review', 'clinical_trial', 'other'));

-- ---------- Admin can add documents / versions for any user ----------
drop policy if exists "documents insert" on public.documents;
create policy "documents insert" on public.documents for insert to authenticated
  with check ((user_id = auth.uid() or public.is_admin()) and status = 'pending');

drop policy if exists "versions insert" on public.document_versions;
create policy "versions insert" on public.document_versions for insert to authenticated
  with check (uploaded_by = auth.uid() and exists (
    select 1 from public.documents d
    where d.id = document_id and (d.user_id = auth.uid() or public.is_admin())));

drop policy if exists "versions delete" on public.document_versions;
create policy "versions delete" on public.document_versions for delete to authenticated
  using (public.is_admin());
grant delete on public.document_versions to authenticated;

-- Admin can edit notes
drop policy if exists "notes update" on public.document_notes;
create policy "notes update" on public.document_notes for update to authenticated
  using (public.is_admin());
grant update on public.document_notes to authenticated;

-- Admin can upload into any user's folder
drop policy if exists "docs upload own folder" on storage.objects;
create policy "docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and
    ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------- Admin: delete a user completely ----------
create or replace function public.admin_delete_user(target uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete users';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;
  delete from auth.users where id = target;  -- cascades to profile, documents, versions, notes
end $$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
