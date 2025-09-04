import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: tokens } = await supabase
    .from("device_tokens")
    .select("token")
    .in("user_id", user_ids);

  await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${Deno.env.get("FCM_SERVER_KEY")}`,
    },
    body: JSON.stringify({
      notification: { title, body },
      registration_ids: tokens?.map((t) => t.token) ?? [],
    }),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
});
