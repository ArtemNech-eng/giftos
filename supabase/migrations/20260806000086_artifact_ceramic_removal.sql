-- Ceramic series removal: the user wants only the precious gem visual
-- language. Remove the ceramic artifacts (old first-wave figures and the
-- object wave) together with their instances and support requests. Gems stay.

-- 1) Support requests pointing at ceramic series.
delete from public.creator_artifact_requests
where series_id in (
  select id from public.collectible_artifact_series
  where artwork_path like '%/artifacts/%'
);

-- 2) Instances of ceramic series (shelf, unboxings).
delete from public.collectible_artifact_instances
where series_id in (
  select id from public.collectible_artifact_series
  where artwork_path like '%/artifacts/%'
);

-- 3) The ceramic series themselves.
delete from public.collectible_artifact_series
where artwork_path like '%/artifacts/%';
