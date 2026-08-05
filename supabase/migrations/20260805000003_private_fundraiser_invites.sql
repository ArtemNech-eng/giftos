-- Private fundraiser invitations.
-- All mutations go through narrowly scoped SECURITY DEFINER functions so an
-- invitee cannot elevate their own role or access an unaccepted fundraiser.

create or replace function public.invite_to_private_fundraiser(
  p_fundraiser_id uuid,
  p_username text
)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  already_accepted boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
  fundraiser_record public.fundraisers%rowtype;
  existing_member public.fundraiser_members%rowtype;
begin
  select * into fundraiser_record
  from public.fundraisers
  where id = p_fundraiser_id;

  if not found or fundraiser_record.author_id <> auth.uid() then
    raise exception 'Only the fundraiser author can invite participants';
  end if;

  if fundraiser_record.visibility <> 'private' then
    raise exception 'Invitations are only required for private fundraisers';
  end if;

  if fundraiser_record.status not in ('active', 'goal_reached') then
    raise exception 'Only an active fundraiser can receive invitations';
  end if;

  select * into target_profile
  from public.profiles
  where username = lower(trim(p_username))
    and is_suspended = false;

  if not found then
    raise exception 'User not found';
  end if;

  if target_profile.id = auth.uid() then
    raise exception 'You cannot invite yourself';
  end if;

  if public.is_blocked_between(auth.uid(), target_profile.id) then
    raise exception 'This user is unavailable for an invitation';
  end if;

  select * into existing_member
  from public.fundraiser_members
  where fundraiser_id = p_fundraiser_id and profile_id = target_profile.id;

  if found and existing_member.accepted_at is not null then
    return query select target_profile.id, target_profile.username::text, target_profile.display_name, true;
    return;
  end if;

  insert into public.fundraiser_members (
    fundraiser_id,
    profile_id,
    role,
    invited_by,
    accepted_at
  ) values (
    p_fundraiser_id,
    target_profile.id,
    'invited',
    auth.uid(),
    null
  )
  on conflict (fundraiser_id, profile_id) do update
    set role = 'invited',
        invited_by = excluded.invited_by,
        accepted_at = null,
        created_at = now();

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    payload
  ) values (
    target_profile.id,
    auth.uid(),
    'private_fundraiser_invite',
    'fundraiser',
    p_fundraiser_id,
    jsonb_build_object(
      'fundraiser_title', fundraiser_record.title,
      'fundraiser_slug', fundraiser_record.slug::text
    )
  );

  return query select target_profile.id, target_profile.username::text, target_profile.display_name, false;
end;
$$;

create or replace function public.my_pending_private_fundraiser_invites()
returns table (
  fundraiser_id uuid,
  slug text,
  title text,
  description text,
  cover_image_path text,
  ends_at timestamptz,
  inviter_username text,
  inviter_display_name text,
  invited_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id,
    f.slug::text,
    f.title,
    f.description,
    f.cover_image_path,
    f.ends_at,
    inviter.username::text,
    inviter.display_name,
    m.created_at
  from public.fundraiser_members m
  join public.fundraisers f on f.id = m.fundraiser_id
  left join public.profiles inviter on inviter.id = m.invited_by
  where m.profile_id = auth.uid()
    and m.role = 'invited'
    and m.accepted_at is null
    and f.visibility = 'private'
    and f.status in ('active', 'goal_reached');
$$;

create or replace function public.accept_private_fundraiser_invite(p_fundraiser_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  fundraiser_slug text;
begin
  update public.fundraiser_members m
  set accepted_at = now()
  where m.fundraiser_id = p_fundraiser_id
    and m.profile_id = auth.uid()
    and m.role = 'invited'
    and m.accepted_at is null;

  if not found then
    raise exception 'Pending invitation not found';
  end if;

  select slug::text into fundraiser_slug
  from public.fundraisers
  where id = p_fundraiser_id;

  return fundraiser_slug;
end;
$$;

create or replace function public.decline_private_fundraiser_invite(p_fundraiser_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.fundraiser_members
  where fundraiser_id = p_fundraiser_id
    and profile_id = auth.uid()
    and role = 'invited'
    and accepted_at is null;

  if not found then
    raise exception 'Pending invitation not found';
  end if;
end;
$$;

-- Replace the permissive self-update policy from the foundation migration.
drop policy if exists "members accept own invite" on public.fundraiser_members;
create policy "members accept pending invite" on public.fundraiser_members
  for update
  using (
    profile_id = auth.uid()
    and role = 'invited'
    and accepted_at is null
  )
  with check (
    profile_id = auth.uid()
    and role = 'invited'
    and accepted_at is not null
  );

create policy "admins manage fundraiser members" on public.fundraiser_members
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Authors can create a pending invitation manually but cannot mark it accepted;
-- the UI uses the stronger security-definer function above.
drop policy if exists "authors invite members" on public.fundraiser_members;
create policy "authors create pending invitations" on public.fundraiser_members
  for insert
  with check (
    public.is_fundraiser_author(fundraiser_id)
    and role = 'invited'
    and accepted_at is null
    and invited_by = auth.uid()
  );

create policy "invitees decline own pending invite" on public.fundraiser_members
  for delete
  using (
    profile_id = auth.uid()
    and role = 'invited'
    and accepted_at is null
  );

grant execute on function public.invite_to_private_fundraiser(uuid, text) to authenticated;
grant execute on function public.my_pending_private_fundraiser_invites() to authenticated;
grant execute on function public.accept_private_fundraiser_invite(uuid) to authenticated;
grant execute on function public.decline_private_fundraiser_invite(uuid) to authenticated;
