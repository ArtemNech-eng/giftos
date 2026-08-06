-- Stream live room gifts to every participant so gift events can be
-- rendered as story-like overlays in real time.
alter publication supabase_realtime add table public.live_room_gifts;
