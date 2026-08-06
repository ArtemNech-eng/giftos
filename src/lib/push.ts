import "server-only";

import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:push@hochutakzhe.ru";

const configured = Boolean(vapidPublicKey && vapidPrivateKey);

if (configured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
}

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Sends a web push to one user's subscriptions.
 * Returns the number of successfully delivered pushes.
 * Removes subscriptions that the push provider reports as gone.
 */
export async function sendPushToUser(
  profileId: string,
  payload: { title: string; body?: string; url?: string },
): Promise<number> {
  if (!configured) return 0;
  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile_id", profileId);
  if (!subscriptions || subscriptions.length === 0) return 0;

  const serialized = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
  });

  let delivered = 0;
  const gone: string[] = [];
  for (const subscription of subscriptions as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        serialized,
      );
      delivered += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) gone.push(subscription.endpoint);
    }
  }
  if (gone.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", gone)
      .eq("profile_id", profileId);
  }
  return delivered;
}

export function pushConfigured() {
  return configured;
}

export function pushPublicKey() {
  return vapidPublicKey ?? "";
}
