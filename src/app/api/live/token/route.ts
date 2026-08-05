import { AccessToken } from "livekit-server-sdk";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const roomSlug = request.nextUrl.searchParams.get("room");
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!roomSlug || !livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Live media is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const { data: room } = await supabase
    .from("live_rooms")
    .select("host_id, status")
    .eq("slug", roomSlug)
    .maybeSingle();
  if (!room || room.status !== "live")
    return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const token = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.email ?? user.id,
  });
  token.addGrant({
    roomJoin: true,
    room: roomSlug,
    canPublish: room.host_id === user.id,
    canSubscribe: true,
    canPublishData: true,
  });
  return NextResponse.json({ token: await token.toJwt(), url: livekitUrl });
}
