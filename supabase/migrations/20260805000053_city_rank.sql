-- City rank #N: user's position inside their city by followers, plus the
-- next-level threshold. Pure activity metric — money does not matter.

create or replace function public.city_rank(p_profile_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_city_id uuid;
  v_followers bigint;
  v_rank bigint;
  v_city_size bigint;
  result jsonb;
begin
  select city_id into v_city_id from public.profiles where id = p_profile_id;
  if v_city_id is null then
    return null;
  end if;

  select count(*) into v_followers from public.user_follows uf where uf.following_id = p_profile_id;
  select count(*) into v_city_size from public.profiles p
    where p.city_id = v_city_id and p.is_suspended = false;

  select count(*) + 1 into v_rank
  from public.profiles p
  where p.city_id = v_city_id
    and p.is_suspended = false
    and (select count(*) from public.user_follows uf where uf.following_id = p.id) > v_followers;

  result := jsonb_build_object(
    'city_id', v_city_id,
    'rank', v_rank,
    'city_size', v_city_size,
    'followers', v_followers
  );
  return result;
end;
$$;

grant execute on function public.city_rank(uuid) to anon, authenticated;
