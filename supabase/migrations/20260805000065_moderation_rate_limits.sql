-- Moderation rate limits (Блок 12 «Безопасность»):
-- 1) wish comments:   max 10 per minute per author,
-- 2) fundraiser comments: max 10 per minute per author,
-- 3) reports:         max 5 per minute per reporter.
-- Limits live in DB triggers so every write path is covered.

create index if not exists wish_comments_author_idx
  on public.wish_comments (author_id, created_at desc);
create index if not exists fundraiser_comments_author_idx
  on public.fundraiser_comments (author_id, created_at desc);
create index if not exists reports_reporter_idx
  on public.reports (reporter_id, created_at desc);

create or replace function public.wish_comment_rate_limit()
returns trigger
language plpgsql
security invoker
as $$
begin
  if (
    select count(*)
    from public.wish_comments c
    where c.author_id = new.author_id
      and c.created_at > now() - interval '1 minute'
  ) >= 10 then
    raise exception 'comment_rate_limit: too many comments, wait a minute';
  end if;
  return new;
end;
$$;

drop trigger if exists wish_comment_rate_limit_trg on public.wish_comments;
create trigger wish_comment_rate_limit_trg
  before insert on public.wish_comments
  for each row execute function public.wish_comment_rate_limit();

create or replace function public.fundraiser_comment_rate_limit()
returns trigger
language plpgsql
security invoker
as $$
begin
  if (
    select count(*)
    from public.fundraiser_comments c
    where c.author_id = new.author_id
      and c.created_at > now() - interval '1 minute'
  ) >= 10 then
    raise exception 'comment_rate_limit: too many comments, wait a minute';
  end if;
  return new;
end;
$$;

drop trigger if exists fundraiser_comment_rate_limit_trg on public.fundraiser_comments;
create trigger fundraiser_comment_rate_limit_trg
  before insert on public.fundraiser_comments
  for each row execute function public.fundraiser_comment_rate_limit();

create or replace function public.report_rate_limit()
returns trigger
language plpgsql
security invoker
as $$
begin
  if (
    select count(*)
    from public.reports r
    where r.reporter_id = new.reporter_id
      and r.created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'report_rate_limit: too many reports, wait a minute';
  end if;
  return new;
end;
$$;

drop trigger if exists report_rate_limit_trg on public.reports;
create trigger report_rate_limit_trg
  before insert on public.reports
  for each row execute function public.report_rate_limit();
