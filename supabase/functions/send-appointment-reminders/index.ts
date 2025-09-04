import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(() => new Response("ok"));

Deno.cron("daily-appointment-reminders", "0 20 * * *", async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: settings } = await supabase
    .from("business_settings")
    .select("appointment_reminders_enabled")
    .single();

  if (!settings?.appointment_reminders_enabled) return;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("user_id")
    .gte("start_time", start.toISOString())
    .lt("start_time", end.toISOString());

  if (error) {
    console.error("Error fetching appointments", error);
    return;
  }

  const userIds = Array.from(new Set((appointments || []).map((a) => a.user_id)));
  if (userIds.length === 0) return;

  const { data: pushSubs } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .in("user_id", userIds);

  const subscribedUserIds = Array.from(
    new Set((pushSubs || []).map((s) => s.user_id)),
  );
  if (subscribedUserIds.length === 0) return;

  const { error: fnError } = await supabase.functions.invoke("send-notification", {
    body: {
      title: "תזכורת לתור",
      body: "יש לך תור מחר",
      user_ids: subscribedUserIds,
    },
  });

  if (fnError) {
    console.error("Error sending notifications", fnError);
  }
});
