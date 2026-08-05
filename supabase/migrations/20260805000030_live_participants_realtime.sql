-- Stream live room participants so the viewer count and cohost list update
-- in real time when someone joins or leaves the room.
alter publication supabase_realtime add table public.live_room_participants;
