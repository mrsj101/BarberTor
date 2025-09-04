import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(() => new Response("ok"));

Deno.cron("upcoming-appointment-reminders", "*/15 * * * *", async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: settings } = await supabase
    .from("business_settings")
    .select(
      "appointment_reminders_enabled, morning_reminder_start_time, morning_reminder_end_time, morning_reminder_message, three_hours_reminder_message",
    )
    .single();

  if (!settings?.appointment_reminders_enabled) return;

  const now = new Date();

  // Morning reminders
  if (
    settings.morning_reminder_start_time &&
    settings.morning_reminder_end_time &&
    settings.morning_reminder_message
  ) {
    const [startH, startM] = settings.morning_reminder_start_time.split(":").map(Number);
    const [endH, endM] = settings.morning_reminder_end_time.split(":").map(Number);
    const start = new Date(now);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(now);
    end.setHours(endH, endM, 0, 0);

    if (now >= start && now <= end) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(now);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, user_id")
        .gte("start_time", dayStart.toISOString())
        .lt("start_time", dayEnd.toISOString())
        .or(
          "morning_reminder_sent.eq.false,morning_reminder_sent.is.null",
        );

      const userIds = Array.from(
        new Set((appointments || []).map((a) => a.user_id)),
      );

      if (userIds.length > 0) {
        const { data: pushSubs } = await supabase
          .from("push_subscriptions")
          .select("user_id")
          .in("user_id", userIds);

        const subscribedUserIds = Array.from(
          new Set((pushSubs || []).map((s) => s.user_id)),
        );

        if (subscribedUserIds.length > 0) {
          const { error: fnError } = await supabase.functions.invoke(
            "send-notification",
            {
              body: {
                title: "תזכורת לתור",
                body: settings.morning_reminder_message,
                user_ids: subscribedUserIds,
              },
            },
          );

          if (fnError) {
            console.error("Error sending morning reminders", fnError);
          }

          const status = fnError ? "failed" : "sent";
          const logs = (appointments || [])
            .filter((a) => subscribedUserIds.includes(a.user_id))
            .map((a) => ({
              appointment_id: a.id,
              user_id: a.user_id,
              type: "morning",
              status,
              sent_at: new Date().toISOString(),
            }));
          if (logs.length > 0) {
            await supabase.from("reminder_logs").insert(logs);
          }
        }

        const appointmentIds = (appointments || []).map((a) => a.id);
        if (appointmentIds.length > 0) {
          await supabase
            .from("appointments")
            .update({ morning_reminder_sent: true })
            .in("id", appointmentIds);
        }
      }
    }
  }

  // Three hours reminders
  if (settings.three_hours_reminder_message) {
    const targetStart = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const targetEnd = new Date(targetStart.getTime() + 15 * 60 * 1000);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, user_id")
      .gte("start_time", targetStart.toISOString())
      .lt("start_time", targetEnd.toISOString())
      .or("three_hours_reminder_sent.eq.false,three_hours_reminder_sent.is.null");

    const userIds = Array.from(new Set((appointments || []).map((a) => a.user_id)));

    if (userIds.length > 0) {
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("user_id")
        .in("user_id", userIds);

      const subscribedUserIds = Array.from(
        new Set((pushSubs || []).map((s) => s.user_id)),
      );

      if (subscribedUserIds.length > 0) {
        const { error: fnError } = await supabase.functions.invoke(
          "send-notification",
          {
            body: {
              title: "תזכורת לתור",
              body: settings.three_hours_reminder_message,
              user_ids: subscribedUserIds,
            },
          },
        );

        if (fnError) {
          console.error("Error sending three hours reminders", fnError);
        }

        const status = fnError ? "failed" : "sent";
        const logs = (appointments || [])
          .filter((a) => subscribedUserIds.includes(a.user_id))
          .map((a) => ({
            appointment_id: a.id,
            user_id: a.user_id,
            type: "three_hours",
            status,
            sent_at: new Date().toISOString(),
          }));
        if (logs.length > 0) {
          await supabase.from("reminder_logs").insert(logs);
        }
      }

      const appointmentIds = (appointments || []).map((a) => a.id);
      if (appointmentIds.length > 0) {
        await supabase
          .from("appointments")
          .update({ three_hours_reminder_sent: true })
          .in("id", appointmentIds);
      }
    }
  }
});
