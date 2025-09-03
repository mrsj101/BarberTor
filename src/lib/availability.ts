import { supabase } from "@/integrations/supabase/client";
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  isBefore,
  addMinutes,
  isAfter,
} from "date-fns";

type WorkingHours = {
  [key: string]: { start: string; end: string } | null;
};

type GenerateSlotsParams = {
  date: Date;
  serviceDuration: number;
  workingHours: WorkingHours;
  bufferMinutes: number;
};

// Represents a time range
type TimeRange = { start: Date; end: Date };

export const generateAvailableSlots = async ({
  date,
  serviceDuration,
  workingHours,
  bufferMinutes,
}: GenerateSlotsParams): Promise<Date[]> => {
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: 'long' }).toLowerCase();
  const dayWorkingHours = workingHours[dayOfWeek];

  if (!dayWorkingHours) {
    return []; // Closed on this day
  }

  // 1. Get all appointments and blocks for the selected day
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .in("status", ["pending", "approved"])
    .gte("start_time", dayStart.toISOString())
    .lte("start_time", dayEnd.toISOString());

  const { data: blocks, error: blocksError } = await supabase
    .from("time_blocks")
    .select("start_time, end_time")
    .gte("start_time", dayStart.toISOString())
    .lte("start_time", dayEnd.toISOString());

  if (appointmentsError || blocksError) {
    console.error("Error fetching busy times:", appointmentsError || blocksError);
    return [];
  }

  // 2. Combine appointments and blocks into a single list of busy slots
  const busySlots: TimeRange[] = [
    ...(appointments || []).map(a => ({
      start: new Date(a.start_time),
      // Add buffer to the end of each appointment
      end: addMinutes(new Date(a.end_time), bufferMinutes),
    })),
    ...(blocks || []).map(b => ({
      start: new Date(b.start_time),
      end: new Date(b.end_time),
    })),
  ];

  // 3. Generate potential slots and check for availability
  const availableSlots: Date[] = [];
  const [startHour, startMinute] = dayWorkingHours.start.split(":").map(Number);
  const [endHour, endMinute] = dayWorkingHours.end.split(":").map(Number);

  let currentTime = setMinutes(setHours(dayStart, startHour), startMinute);
  const endTime = setMinutes(setHours(dayStart, endHour), endMinute);

  while (isBefore(currentTime, endTime)) {
    const slotEnd = addMinutes(currentTime, serviceDuration);

    // A slot is valid if it doesn't end after the working day ends
    if (isAfter(slotEnd, endTime)) {
      break;
    }

    // Check if the current time is in the future
    const isFutureSlot = isAfter(currentTime, new Date());

    // Check for overlaps with busy slots using a more robust method
    const isOverlapping = busySlots.some(busySlot => {
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return isBefore(currentTime, busySlot.end) && isAfter(slotEnd, busySlot.start);
    });

    if (!isOverlapping && isFutureSlot) {
      availableSlots.push(currentTime);
    }

    // Move to the next 15-minute interval
    currentTime = addMinutes(currentTime, 15);
  }

  return availableSlots;
};