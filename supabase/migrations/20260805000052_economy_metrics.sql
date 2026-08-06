-- Stage 4: economy metrics for the admin dashboard.
-- Fix the ledger type check (new spend types) and expose aggregated views.

alter table public.bonus_ledger_entries
  drop constraint if exists bonus_ledger_entries_type_check;

alter table public.bonus_ledger_entries
  add constraint bonus_ledger_entries_type_check
  check (type in ('referral_reward', 'promotion_spend', 'manual_adjustment', 'item_purchase', 'vip_purchase', 'gift_purchase', 'place_style'));

-- Daily star economy summary (earned vs spent, per spend type).
create or replace view public.admin_star_economy_daily
with (security_invoker = false)
as
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where amount > 0) as earned_count,
  coalesce(sum(amount) filter (where amount > 0), 0) as earned_stars,
  count(*) filter (where amount < 0) as spent_count,
  coalesce(sum(-amount) filter (where amount < 0), 0) as spent_stars,
  coalesce(sum(-amount) filter (where amount < 0 and type = 'item_purchase'), 0) as spent_items,
  coalesce(sum(-amount) filter (where amount < 0 and type = 'vip_purchase'), 0) as spent_vip,
  coalesce(sum(-amount) filter (where amount < 0 and type = 'gift_purchase'), 0) as spent_gifts,
  coalesce(sum(-amount) filter (where amount < 0 and type = 'promotion_spend'), 0) as spent_promotions,
  coalesce(sum(-amount) filter (where amount < 0 and type = 'place_style'), 0) as spent_place_style
from public.bonus_ledger_entries
group by 1
order by 1 desc
limit 60;

-- Totals for the header cards.
create or replace view public.admin_star_economy_totals
with (security_invoker = false)
as
select
  (select coalesce(sum(available_balance), 0) from public.bonus_wallets) as total_balance,
  (select count(*) from public.bonus_wallets where available_balance > 0) as active_wallets,
  (select coalesce(sum(amount), 0) from public.bonus_ledger_entries where amount > 0) as total_earned,
  (select coalesce(sum(-amount), 0) from public.bonus_ledger_entries where amount < 0) as total_spent,
  (select count(*) from public.vip_subscriptions where status = 'active' and expires_at > now()) as active_vip,
  (select count(*) from public.profile_gifts) as gifts_sent,
  (select count(*) from public.user_inventory) as items_owned;

grant select on public.admin_star_economy_daily, public.admin_star_economy_totals to authenticated;
