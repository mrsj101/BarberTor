import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {
  isBefore,
  addMinutes,
  isAfter,
  format,
} from "npm:date-fns@2.30.0";
import { zonedTimeToUtc, utcToZonedTime } from "npm:date-fns-tz@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIMEZONE = 'Asia/Jerusalem';

type TimeSlot = { start: string; end: string };
type WorkingHours = {
  [key: string]: TimeSlot[] | null;
};

type TimeRange = { start: Date; end: Date };
type Slot = { time: string; available: boolean };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { date: dateString, serviceDuration } = await req.json(); // dateString is YYYY-MM-DD

    // --- Timezone-aware date range calculation ---
    const dayStartLocalStr = `${dateString}T00:00:00`;
    const dayEndLocalStr = `${dateString}T23:59:59.999`;
    const dayStartUtc = zonedTimeToUtc(dayStartLocalStr, TIMEZONE);
    const dayEndUtc = zonedTimeToUtc(dayEndLocalStr, TIMEZONE);
    // ---

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("business_settings")
      .select("working_hours, buffer_minutes")
      .single();

    if (settingsError || !settingsData) {
      throw new Error(`Error fetching settings: ${settingsError?.message}`);
    }
    
    const workingHours: WorkingHours = settingsData.working_hours;
    const bufferMinutes: number = settingsData.buffer_minutes;

    // --- Get correct day of week for the target timezone ---
    const localDateForDay = utcToZonedTime(new Date(dateString), TIMEZONE);
    const dayOfWeek = format(localDateForDay, 'eeee').toLowerCase();
    // ---

    const dayWorkingRanges = workingHours[dayOfWeek];

    if (!dayWorkingRanges || dayWorkingRanges.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- Query using the correct UTC range for the local day ---
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("start_time, end_time")
      .in("status", ["pending", "approved"])
      .gte("start_time", dayStartUtc.toISOString())
      .lte("start_time", dayEndUtc.toISOString());

    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from("time_blocks")
      .select("start_time, end_time")
      .gte("start_time", dayStartUtc.toISOString())
      .lte("start_time", dayEndUtc.toISOString());
    // ---

    if (appointmentsError || blocksError) {
      throw new Error(`Error fetching busy times: ${appointmentsError?.message || blocksError?.message}`);
    }

    const busySlots: TimeRange[] = [
      ...(appointments || []).map(a => ({
        start: new Date(a.start_time),
        end: addMinutes(new Date(a.end_time), bufferMinutes),
      })),
      ...(blocks || []).map(b => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time),
      })),
    ];

    const allSlots: Slot[] = [];

    for (const range of dayWorkingRanges) {
      // --- Generate slots based on local time for the selected day ---
      let currentTimeLocal = new Date(`${dateString}T${range.start}:00`);
      const endTimeLocal = new Date(`${dateString}T${range.end}:00`);

      while (isBefore(currentTimeLocal, endTimeLocal)) {
        const slotEndLocal = addMinutes(currentTimeLocal, serviceDuration);

        if (isAfter(slotEndLocal, endTimeLocal)) {
          break;
        }

        // Convert local slot times to UTC for comparison and for returning to client
        const slotStartUtc = zonedTimeToUtc(currentTimeLocal, TIMEZONE);
        const slotEndUtc = zonedTimeToUtc(slotEndLocal, TIMEZONE);

        const isOverlapping = busySlots.some(busySlot => {
          // busySlot start/end are already UTC Date objects
          return isBefore(slotStartUtc, busySlot.end) && isAfter(slotEndUtc, busySlot.start);
        });
        
        allSlots.push({
          time: slotStartUtc.toISOString(),
          available: !isOverlapping,
        });

        currentTimeLocal = addMinutes(currentTimeLocal, 15); // Increment by step
      }
    }

    return new Response(JSON.stringify(allSlots), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});