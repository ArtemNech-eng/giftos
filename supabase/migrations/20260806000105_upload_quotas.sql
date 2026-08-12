-- Upload quotas (PM: защита хранилища перед бета-приглашениями).
-- Per-user daily limits: images and videos are counted separately.
-- The guard lives in a security-definer RPC so the app asks «may I upload?»
-- before touching Storage; a legit user on a small VPS can never fill the
-- disk in one session.

create table if not exists public.upload_quota_settings (
  id boolean primary key default true,
  daily_image_limit integer not null default 30 check (daily_image_limit >= 0),
  daily_video_limit integer not null default 5 check (daily_video_limit >= 0),
  updated_at timestamptz not null default now()
);

insert into public.upload_quota_settings (id, daily_image_limit, daily_video_limit)
values (true, 30, 5)
on conflict (id) do nothing;

alter table public.upload_quota_settings enable row level security;
create policy "quota settings readable" on public.upload_quota_settings for select using (true);

-- Returns how many uploads of the given kind the user has left today.
create or replace function public.upload_quota_left(p_kind text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
begin
  if auth.uid() is null then return 0; end if;

  select
    case p_kind
      when 'image' then daily_image_limit
      when 'video' then daily_video_limit
      else 0
    end
  into v_limit
  from public.upload_quota_settings
  where id = true;

  select count(*) into v_used
  from public.uploads_daily
  where profile_id = auth.uid()
    and kind = p_kind
    and uploaded_on = current_date;

  return greatest(v_limit - v_used, 0);
end;
$$;

-- Records one upload. Returns false (and records nothing) when the quota
-- is exhausted — the caller then aborts before writing to Storage.
create or replace function public.consume_upload_quota(p_kind text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_left integer;
begin
  if auth.uid() is null then return false; end if;

  v_left := public.upload_quota_left(p_kind);
  if v_left <= 0 then
    return false;
  end if;

  insert into public.uploads_daily (profile_id, kind)
  values (auth.uid(), p_kind);

  return true;
end;
$$;

create table if not exists public.uploads_daily (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  uploaded_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists uploads_daily_profile_idx
  on public.uploads_daily (profile_id, uploaded_on, kind);

alter table public.uploads_daily enable row level security;
create policy "uploads counted via function" on public.uploads_daily for select using (profile_id = auth.uid() or public.is_admin());
create policy "uploads inserted via function" on public.uploads_daily for insert with check (profile_id = auth.uid());

grant execute on function public.upload_quota_left(text) to authenticated;
grant execute on function public.consume_upload_quota(text) to authenticated;
