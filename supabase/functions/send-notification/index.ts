import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendFcmMessage } from "../_shared/fcmClient.ts";
import { sendWebPush } from "../_shared/webPushClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_ids = [], title, body, data = {} } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    interface PushSub {
      id: string;
      user_id: string;
      type: string;
      token_or_subscription: unknown;
    }

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', user_ids);

    const subsByUser: Record<string, PushSub[]> = {};
    for (const sub of (subs as PushSub[]) || []) {
      if (!subsByUser[sub.user_id]) {
        subsByUser[sub.user_id] = [];
      }
      subsByUser[sub.user_id].push(sub);
    }

    const results: unknown[] = [];

    for (const userId of user_ids) {
      const userSubs = subsByUser[userId] || [];
      if (userSubs.length === 0) {
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          title,
          body,
          payload_json: data,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
        results.push({ user_id: userId, status: 'sent', note: 'no subscription' });
        continue;
      }

      for (const sub of userSubs) {
        try {
          if (sub.type === 'fcm') {
            await sendFcmMessage({
              token: sub.token_or_subscription as string,
              notification: { title, body },
              data,
            });
          } else if (sub.type === 'vapid') {
            await sendWebPush(sub.token_or_subscription, { title, body, data });
          }
          await supabaseAdmin.from('notifications').insert({
            user_id: sub.user_id,
            title,
            body,
            payload_json: data,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
          results.push({ id: sub.id, status: 'sent' });
        } catch (e) {
          await supabaseAdmin.from('notifications').insert({
            user_id: sub.user_id,
            title,
            body,
            payload_json: data,
            status: 'failed',
            error: String(e),
          });
          results.push({ id: sub.id, status: 'failed', error: String(e) });
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
