-- Follow actions are implemented as narrow security-definer functions so the
-- follow relation and resulting notification are created atomically.

create or replace function public.toggle_user_follow(p_target_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_target_profile_id = auth.uid() then
    raise exception 'You cannot follow yourself';
  end if;

  select * into target_profile
  from public.profiles
  where id = p_target_profile_id;

  if not found or target_profile.is_suspended or target_profile.profile_visibility = 'private' then
    raise exception 'This profile is unavailable for following';
  end if;

  if public.is_blocked_between(auth.uid(), p_target_profile_id) then
    raise exception 'This profile is unavailable for following';
  end if;

  if exists (
    select 1 from public.user_follows
    where follower_id = auth.uid() and following_id = p_target_profile_id
  ) then
    delete from public.user_follows
    where follower_id = auth.uid() and following_id = p_target_profile_id;
    return false;
  end if;

  insert into public.user_follows (follower_id, following_id)
  values (auth.uid(), p_target_profile_id);

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    payload
  ) values (
    p_target_profile_id,
    auth.uid(),
    'user_followed',
    'profile',
    p_target_profile_id,
    '{}'::jsonb
  );

  return true;
end;
$$;

create or replace function public.toggle_fundraiser_follow(p_fundraiser_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  fundraiser_record public.fundraisers%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into fundraiser_record
  from public.fundraisers
  where id = p_fundraiser_id;

  if not found or not public.can_access_fundraiser(p_fundraiser_id) then
    raise exception 'This fundraiser is unavailable for following';
  end if;

  if fundraiser_record.author_id = auth.uid() then
    raise exception 'You cannot follow your own fundraiser';
  end if;

  if exists (
    select 1 from public.fundraiser_follows
    where profile_id = auth.uid() and fundraiser_id = p_fundraiser_id
  ) then
    delete from public.fundraiser_follows
    where profile_id = auth.uid() and fundraiser_id = p_fundraiser_id;
    return false;
  end if;

  insert into public.fundraiser_follows (profile_id, fundraiser_id)
  values (auth.uid(), p_fundraiser_id);

  return true;
end;
$$;

revoke all on function public.toggle_user_follow(uuid) from public, anon;
revoke all on function public.toggle_fundraiser_follow(uuid) from public, anon;
grant execute on function public.toggle_user_follow(uuid) to authenticated;
grant execute on function public.toggle_fundraiser_follow(uuid) to authenticated;
