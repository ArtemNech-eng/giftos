-- Optional profile gallery. The avatar remains the compact image used in feeds;
-- gallery photos belong to the full profile only.

do $$
begin
  create type public.profile_media_visibility as enum ('public', 'private');
exception when duplicate_object then null;
end $$;

create table if not exists public.profile_media (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  visibility public.profile_media_visibility not null default 'public',
  sort_order smallint not null default 0 check (sort_order between 0 and 5),
  created_at timestamptz not null default now(),
  unique (profile_id, sort_order)
);

create index if not exists profile_media_profile_idx on public.profile_media (profile_id, sort_order asc);

create or replace function public.enforce_profile_media_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.profile_media where profile_id = new.profile_id) >= 6 then
    raise exception 'A profile can have no more than six gallery photos';
  end if;
  return new;
end;
$$;

drop trigger if exists profile_media_limit on public.profile_media;
create trigger profile_media_limit
  before insert on public.profile_media
  for each row execute procedure public.enforce_profile_media_limit();

alter table public.profile_media enable row level security;

create policy "public profile media visible by setting" on public.profile_media
  for select
  using (
    profile_id = auth.uid()
    or (
      visibility = 'public'
      and exists (
        select 1 from public.profiles p
        where p.id = profile_id and p.profile_visibility = 'public' and not p.is_suspended
      )
    )
    or public.is_admin()
  );

create policy "users add own profile media" on public.profile_media
  for insert
  with check (profile_id = auth.uid());

create policy "users update own profile media" on public.profile_media
  for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "users delete own profile media" on public.profile_media
  for delete
  using (profile_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload own profile gallery media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-media'
    and owner_id = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own profile gallery media" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-media' and owner_id = auth.uid())
  with check (
    bucket_id = 'profile-media'
    and owner_id = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own profile gallery media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-media' and owner_id = auth.uid());
