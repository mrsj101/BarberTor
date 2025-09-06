import webpush from "https://deno.land/x/webpush@1.5.0/mod.ts";

type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function sendWebPush(
  subscription: Record<string, unknown>,
  payload: Record<string, unknown>,
) {
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  webpush.setVapidDetails("mailto:example@example.com", vapidPublic, vapidPrivate);
  return webpush.sendNotification(subscription as unknown as PushSubscription, JSON.stringify(payload));
}
