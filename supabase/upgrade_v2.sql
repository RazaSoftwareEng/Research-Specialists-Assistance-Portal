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
