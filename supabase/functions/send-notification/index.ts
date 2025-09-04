import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWebPush } from "https://deno.land/x/webpush@1.0.3/mod.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const { title, body, user_ids } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .in("user_id", user_ids);

  for (const { id, subscription } of subscriptions ?? []) {
    try {
      const parsedSubscription =
        typeof subscription === "string" ? JSON.parse(subscription) : subscription;
      const res = await sendWebPush(
        parsedSubscription,
        JSON.stringify({ title, body }),
        { vapidKeys: { publicKey, privateKey } },
      );
      if (res.status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", id);
      }
    } catch (error) {
      const { status, statusCode } = error as {
        status?: number;
        statusCode?: number;
      };
      if ((status ?? statusCode) === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", id);
      } else {
        console.error("Failed to send web push", error);
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
});
