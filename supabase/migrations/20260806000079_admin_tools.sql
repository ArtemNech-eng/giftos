-- Admin tools: role management and suspensions.
-- Roles/suspensions are written through security-definer functions so RLS
-- never lets a regular user escalate themselves.

-- Assign (or remove) a moderator/admin role. Only an admin can change roles,
-- and nobody can demote the last admin or touch themselves.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_role text;
  v_admin_count integer;
begin
  if auth.uid() is null then return false; end if;

  select role into v_admin_role
  from public.user_roles where user_id = auth.uid();
  if v_admin_role is null or v_admin_role <> 'admin' then
    raise exception 'Admin role required';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Cannot change your own role';
  end if;
  if p_role not in ('user', 'moderator', 'admin') then
    raise exception 'Unknown role';
  end if;

  -- Never demote the last admin.
  if p_role <> 'admin' then
    select count(*) into v_admin_count
    from public.user_roles where role = 'admin';
    if v_admin_count <= 1 then
      select count(*) into v_admin_count
      from public.user_roles
      where user_id = p_user_id and role = 'admin';
      if v_admin_count = 1 then
        raise exception 'Cannot demote the last admin';
      end if;
    end if;
  end if;

  insert into public.user_roles (user_id, role, assigned_at, assigned_by)
  values (p_user_id, p_role, now(), auth.uid())
  on conflict (user_id) do update
    set role = excluded.role,
        assigned_at = excluded.assigned_at,
        assigned_by = excluded.assigned_by;

  return true;
end;
$$;

-- Suspend or restore a profile. Moderators and admins can suspend; only
-- admins can restore, and nobody can suspend themselves or other admins.
create or replace function public.admin_set_suspension(p_user_id uuid, p_suspended boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_target_role text;
begin
  if auth.uid() is null then return false; end if;

  select role into v_role
  from public.user_roles where user_id = auth.uid();
  if v_role is null or v_role not in ('moderator', 'admin') then
    raise exception 'Moderator role required';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Cannot suspend yourself';
  end if;

  select role into v_target_role
  from public.user_roles where user_id = p_user_id;
  if v_target_role = 'admin' then
    raise exception 'Cannot suspend an admin';
  end if;
  -- Only admins restore accounts.
  if not p_suspended and v_role <> 'admin' then
    raise exception 'Admin role required to restore';
  end if;

  update public.profiles
  set is_suspended = p_suspended
  where id = p_user_id;

  return true;
end;
$$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_suspension(uuid, boolean) to authenticated;

-- Update platform bonus/limit settings (admin only).
create or replace function public.admin_update_settings(
  p_referral_reward integer,
  p_hold_days smallint,
  p_daily_spend_limit integer,
  p_referral_daily_cap integer,
  p_profile_promotion_cost integer,
  p_live_promotion_cost integer,
  p_event_promotion_cost integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then return false; end if;

  select role into v_role
  from public.user_roles where user_id = auth.uid();
  if v_role is null or v_role <> 'admin' then
    raise exception 'Admin role required';
  end if;

  if p_referral_reward <= 0
     or p_hold_days < 0 or p_hold_days > 30
     or p_daily_spend_limit <= 0
     or p_referral_daily_cap <= 0
     or p_profile_promotion_cost <= 0
     or p_live_promotion_cost <= 0
     or p_event_promotion_cost <= 0 then
    raise exception 'Values out of range';
  end if;

  update public.bonus_settings
  set referral_reward = p_referral_reward,
      hold_days = p_hold_days,
      daily_spend_limit = p_daily_spend_limit,
      referral_daily_cap = p_referral_daily_cap,
      profile_promotion_cost = p_profile_promotion_cost,
      live_promotion_cost = p_live_promotion_cost,
      event_promotion_cost = p_event_promotion_cost,
      updated_at = now()
  where id = true;

  return true;
end;
$$;

grant execute on function public.admin_update_settings(
  integer, smallint, integer, integer, integer, integer, integer
) to authenticated;
