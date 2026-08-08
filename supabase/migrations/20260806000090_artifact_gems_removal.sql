-- Remove the precious gem series: the user wants only the thematic gift
-- collections. Gems and their instances/requests are removed.

delete from public.creator_artifact_requests
where series_id in (
  select id from public.collectible_artifact_series
  where collection_slug = 'gems'
);

delete from public.collectible_artifact_instances
where series_id in (
  select id from public.collectible_artifact_series
  where collection_slug = 'gems'
);

delete from public.collectible_artifact_series
where collection_slug = 'gems';
