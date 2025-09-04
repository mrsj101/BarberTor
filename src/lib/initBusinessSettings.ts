import { supabase } from "@/integrations/supabase/client";

const defaultWorkingHours: Record<string, { start: string; end: string }[] | null> = {
  sunday: [{ start: "09:00", end: "18:00" }],
  monday: [{ start: "09:00", end: "18:00" }],
  tuesday: [{ start: "09:00", end: "18:00" }],
  wednesday: [{ start: "09:00", end: "18:00" }],
  thursday: [{ start: "09:00", end: "18:00" }],
  friday: [{ start: "09:00", end: "14:00" }],
  saturday: null,
};

const defaultPolicy = {
  cancellation_hours_before: 12,
  rebooking_hours_before: 12,
  cancellation_grace_period_minutes: 30,
  rebooking_grace_period_minutes: 30,
};

export async function ensureBusinessSettings() {
  const { data, error } = await supabase
    .from("business_settings")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to check business settings", error);
    return;
  }

  if (!data) {
    const { error: insertError } = await supabase.from("business_settings").insert({
      id: 1,
      working_hours: defaultWorkingHours,
      appointment_reminders_enabled: false,
      ...defaultPolicy,
    });

    if (insertError) {
      console.error("Failed to create default business settings", insertError);
    }
  }
}
