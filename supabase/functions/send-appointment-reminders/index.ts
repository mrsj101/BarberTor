import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { renderTemplate } from "../_shared/templateParser.ts";
import { sendFcmMessage } from "../_shared/fcmClient.ts";
import { sendWebPush } from "../_shared/webPushClient.ts";

serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const now = new Date().toISOString();
  const { data: reminders } = await supabaseAdmin
    .from('reminders_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('due_at', now);

  for (const reminder of reminders || []) {
    try {
      const { data: template } = await supabaseAdmin
        .from('notification_templates')
        .select('title, body')
        .eq('schedule_kind', reminder.kind)
        .eq('active', true)
        .single();

      const { data: sub } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', reminder.user_id)
        .maybeSingle();

      if (template && sub) {
        const title = renderTemplate(template.title, {});
        const body = renderTemplate(template.body, {});
        if (sub.type === 'fcm') {
          await sendFcmMessage({
            token: sub.token_or_subscription as string,
            notification: { title, body },
          });
        } else if (sub.type === 'vapid') {
          await sendWebPush(sub.token_or_subscription, { title, body });
        }
        await supabaseAdmin.from('notifications').insert({
          user_id: reminder.user_id,
          title,
          body,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
        await supabaseAdmin
          .from('reminders_queue')
          .update({ status: 'sent' })
          .eq('id', reminder.id);
      } else {
        await supabaseAdmin
          .from('reminders_queue')
          .update({ status: 'failed' })
          .eq('id', reminder.id);
      }
    } catch (e) {
      await supabaseAdmin
        .from('reminders_queue')
        .update({ status: 'failed' })
        .eq('id', reminder.id);
    }
  }

  return new Response('ok');
});
