-- Safe progress tracker for a referrer. It intentionally returns no personal
-- data of the invited person: the owner sees only the actual qualification
-- stages needed for the referral reward.
create or replace function public.referral_progress()
returns table (
  referral_id uuid,
  status public.referral_status,
  created_at timestamptz,
  onboarding_completed boolean,
  first_action_completed boolean,
  qualified_at timestamptz,
  hold_until timestamptz,
  approved_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id as referral_id,
    r.status,
    r.created_at,
    p.onboarding_completed_at is not null as onboarding_completed,
    (
      exists (select 1 from public.wishes w where w.author_id = r.referee_id)
      or exists (
        select 1 from public.fundraisers f
        where f.author_id = r.referee_id
          and f.status in ('active', 'goal_reached')
      )
    ) as first_action_completed,
    r.qualified_at,
    r.hold_until,
    r.approved_at
  from public.referrals r
  join public.profiles p on p.id = r.referee_id
  where r.referrer_id = auth.uid()
  order by r.created_at desc
  limit 50;
$$;

grant execute on function public.referral_progress() to authenticated;
