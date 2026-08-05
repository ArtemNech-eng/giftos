-- Referral link with a city tag: «bring a friend to Budyonnovsk».
-- The city of the referrer is stored on the referral link so the invite
-- screen and city battle motivation can name the city explicitly.

create or replace function public.create_referral_link(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code citext;
  v_city text;
  v_link text;
begin
  select code into v_code from public.referral_codes where owner_id = p_user_id;
  if v_code is null then
    insert into public.referral_codes (code, owner_id)
    values ('g' || substring(replace(p_user_id::text, '-', '') from 1 for 11), p_user_id)
    on conflict (owner_id) do nothing
    returning code into v_code;
    if v_code is null then
      select code into v_code from public.referral_codes where owner_id = p_user_id;
    end if;
  end if;

  select city into v_city from public.profiles where id = p_user_id;

  v_link := '/r/' || v_code;
  if v_city is not null and trim(v_city) <> '' then
    v_link := v_link || '?city=' || replace(lower(trim(v_city)), ' ', '-');
  end if;
  return v_link;
end;
$$;

grant execute on function public.create_referral_link(uuid) to authenticated;
