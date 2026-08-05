import { NextResponse } from "next/server";

import { requireModerator } from "@/lib/auth";

/**
 * Test transcode stub.
 *
 * Production: a self-hosted FFmpeg worker consumes a queue, transcodes the
 * uploaded MP4/WebM into HLS/DASH renditions and updates transcode_status
 * (queued -> processing -> done/failed). This test endpoint marks the story
 * as done so the pipeline can be exercised end to end without media infra.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase } = await requireModerator();

  const { data: story, error } = await supabase
    .from("stories")
    .select("id, transcode_status")
    .eq("id", id)
    .maybeSingle();
  if (error || !story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (story.transcode_status === "done") {
    return NextResponse.json({ id, transcode_status: "done" });
  }

  const { error: updateError } = await supabase
    .from("stories")
    .update({ transcode_status: "done" })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update: ${updateError.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ id, transcode_status: "done" });
}
