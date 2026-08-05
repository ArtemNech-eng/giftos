/**
 * City battle points for qualified actions.
 * Best-effort: failures never break the main flow (same pattern as push).
 */

export const CITY_BATTLE_POINTS = {
  profile_completed: 50,
  wish_published: 10,
  fundraiser_published: 20,
  story_published: 15,
  live_started: 30,
  referral_qualified: 100,
} as const;

export type CityBattleEventType = keyof typeof CITY_BATTLE_POINTS;

type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<unknown>;
};

export async function awardCityPoints(
  supabase: RpcClient,
  eventType: CityBattleEventType,
  sourceId?: string,
) {
  try {
    const points = CITY_BATTLE_POINTS[eventType];
    await supabase.rpc("award_city_points", {
      p_event_type: eventType,
      p_points: points,
      p_source_id: sourceId ?? null,
    });
  } catch {
    // City battle is a motivational layer; a failure must not block actions.
  }
}
