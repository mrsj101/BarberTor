import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  isBefore,
  addMinutes,
  isAfter,
} from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { date: dateString, serviceDuration } = await req.json();
    // The date string is YYYY-MM-DD. Create a date object that represents the start of that day in UTC.
    const date = new Date(`${dateString}T00:00:00.000Z`);

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

    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
    const dayWorkingRanges = workingHours[dayOfWeek];

    if (!dayWorkingRanges || dayWorkingRanges.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("start_time, end_time")
      .in("status", ["pending", "approved"])
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());

    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from("time_blocks")
      .select("start_time, end_time")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());

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
      const [startHour, startMinute] = range.start.split(":").map(Number);
      const [endHour, endMinute] = range.end.split(":").map(Number);

      let currentTime = setMinutes(setHours(dayStart, startHour), startMinute);
      const endTime = setMinutes(setHours(dayStart, endHour), endMinute);

      while (isBefore(currentTime, endTime)) {
        const slotEnd = addMinutes(currentTime, serviceDuration);

        if (isAfter(slotEnd, endTime)) {
          break;
        }

        const isOverlapping = busySlots.some(busySlot => {
          return isBefore(currentTime, busySlot.end) && isAfter(slotEnd, busySlot.start);
        });
        
        // Return a local ISO-like string (without 'Z') so the client browser interprets it in its own timezone.
        const localIsoString = currentTime.toISOString().slice(0, 19);

        allSlots.push({
          time: localIsoString,
          available: !isOverlapping,
        });

        currentTime = addMinutes(currentTime, 15);
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