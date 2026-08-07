import { createAdminClient } from "@/lib/supabase/admin";

type CitySocialMoment = {
  kind:
    | "place_join"
    | "place_gift"
    | "profile_gift"
    | "live_gift"
    | "live_donation"
    | "story_gift";
  actorId: string;
  subjectId?: string | null;
  placeId?: string | null;
  liveRoomId?: string | null;
  storyId?: string | null;
  giftCode?: string | null;
};

/**
 * Best-effort, consent-first city moment writer. The preferences are checked
 * before insertion and checked again by the public view, so a settings change
 * immediately hides older moments too.
 */
export async function recordCitySocialMoment(moment: CitySocialMoment) {
  try {
    const admin = createAdminClient();
    const ids = [moment.actorId, moment.subjectId].filter(Boolean) as string[];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, city_id, profile_visibility, show_city, share_city_moments")
      .in("id", ids);
    const actor = (profiles ?? []).find((profile) => profile.id === moment.actorId);
    const subject = moment.subjectId
      ? (profiles ?? []).find((profile) => profile.id === moment.subjectId)
      : null;
    if (
      !actor?.city_id ||
      actor.profile_visibility !== "public" ||
      !actor.show_city ||
      !actor.share_city_moments
    )
      return;
    if (
      moment.subjectId &&
      (!subject ||
        subject.city_id !== actor.city_id ||
        subject.profile_visibility !== "public" ||
        !subject.show_city ||
        !subject.share_city_moments)
    )
      return;

    await admin.from("city_social_moments").insert({
      city_id: actor.city_id,
      kind: moment.kind,
      actor_id: moment.actorId,
      subject_id: moment.subjectId ?? null,
      place_id: moment.placeId ?? null,
      live_room_id: moment.liveRoomId ?? null,
      story_id: moment.storyId ?? null,
      gift_code: moment.giftCode ?? null,
    });
  } catch {
    // Social sharing must never block the underlying join, gift or live action.
  }
}
