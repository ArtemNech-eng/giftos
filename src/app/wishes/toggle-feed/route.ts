import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";

/**
 * Feed-friendly «Хочу также» toggle: POST wish_id -> toggles and returns
 * the updated count, no redirect. The DB trigger refreshes also_wants_count.
 */
export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const formData = await request.formData();
  const wishId = String(formData.get("wish_id") ?? "").slice(0, 100);
  if (!wishId) return NextResponse.json({ error: "Missing wish_id" }, { status: 400 });

  const { data: wish } = await supabase
    .from("wishes")
    .select("id, visibility, is_archived")
    .eq("id", wishId)
    .maybeSingle();
  if (!wish || wish.visibility !== "public" || wish.is_archived)
    return NextResponse.json({ error: "Wish unavailable" }, { status: 404 });

  const { data: existing } = await supabase
    .from("wish_also_wants")
    .select("wish_id")
    .eq("wish_id", wishId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase
        .from("wish_also_wants")
        .delete()
        .eq("wish_id", wishId)
        .eq("profile_id", user.id)
    : await supabase
        .from("wish_also_wants")
        .insert({ wish_id: wishId, profile_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: updated } = await supabase
    .from("wishes")
    .select("also_wants_count")
    .eq("id", wishId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    active: !existing,
    alsoWantsCount: updated?.also_wants_count ?? 0,
  });
}
