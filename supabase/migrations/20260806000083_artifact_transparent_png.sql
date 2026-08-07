-- Art Pass v2: switch artifact art to transparent PNG (no background) so the
-- figures float freely in cards. The white-background JPGs stay as fallback
-- only for reproducibility of the earlier seed.
update public.collectible_artifact_series
set artwork_path = '/collectibles/artifacts/png/' || slug || '.png',
    updated_at = now()
where slug in ('key', 'relic', 'compass', 'cube', 'lantern', 'prism', 'vial', 'seal', 'sphere', 'orbit');
