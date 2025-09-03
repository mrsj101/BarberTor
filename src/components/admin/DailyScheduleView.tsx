import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfDay, endOfDay, addMinutes, isBefore, isAfter } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types
type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  profiles: { first_name: string | null } | null;
  services: { name: string | null } | null;
};

type TimeSlot = { start: string; end: string };
type WorkingHours = { [key: string]: TimeSlot[] | null };

type ScheduleSlot = {
  startTime: Date;
  endTime: Date;
  status: 'available' | 'booked';
  appointment?: Appointment;
};

type Props = {
  date: Date | undefined;
};

const SLOT_DURATION = 30; // in minutes

export const DailyScheduleView = ({ date }: Props) => {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!date) {
      setSchedule([]);
      return;
    }

    const generateSchedule = async () => {
      setIsLoading(true);
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("business_settings")
          .select("working_hours")
          .single();
        if (settingsError) throw settingsError;
        const workingHours: WorkingHours = settingsData.working_hours || {};

        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select("id, start_time, end_time, profiles(first_name), services(name)")
          .eq("status", "approved")
          .gte("start_time", dayStart.toISOString())
          .lte("start_time", dayEnd.toISOString());
        if (appointmentsError) throw appointmentsError;
        
        const appointments: Appointment[] = appointmentsData || [];
        const sortedAppointments = appointments.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        const dayKey = format(date, 'eeee').toLowerCase();
        const dayWorkingRanges = workingHours[dayKey];
        const newSchedule: ScheduleSlot[] = [];

        if (dayWorkingRanges) {
          for (const range of dayWorkingRanges) {
            let cursor = new Date(`${format(date, 'yyyy-MM-dd')}T${range.start}`);
            const rangeEnd = new Date(`${format(date, 'yyyy-MM-dd')}T${range.end}`);
            
            const appointmentsInRange = sortedAppointments.filter(app => {
                const appStart = new Date(app.start_time);
                return appStart >= cursor && appStart < rangeEnd;
            });

            for (const app of appointmentsInRange) {
                const appStart = new Date(app.start_time);
                const appEnd = new Date(app.end_time);

                while (isBefore(cursor, appStart)) {
                    newSchedule.push({ startTime: cursor, endTime: addMinutes(cursor, SLOT_DURATION), status: 'available' });
                    cursor = addMinutes(cursor, SLOT_DURATION);
                }

                newSchedule.push({ startTime: appStart, endTime: appEnd, status: 'booked', appointment: app });
                cursor = appEnd;
            }

            while (isBefore(cursor, rangeEnd)) {
                newSchedule.push({ startTime: cursor, endTime: addMinutes(cursor, SLOT_DURATION), status: 'available' });
                cursor = addMinutes(cursor, SLOT_DURATION);
            }
          }
        }
        setSchedule(newSchedule);
      } catch (error) {
        console.error("Error generating schedule:", error);
        setSchedule([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateSchedule();
  }, [date]);

  if (!date) {
    return (
      <div className="p-4 border rounded-lg min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">בחר יום מהיומן כדי לראות את לוח הזמנים</p>
      </div>
    );
  }

  const formattedDate = format(date, 'EEEE, d MMMM yyyy', { locale: he });

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-xl font-bold mb-4">{formattedDate}</h3>
      <div className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : schedule.length === 0 ? (
          <div className="text-center text-muted-foreground pt-8">אין שעות עבודה מוגדרות ליום זה.</div>
        ) : (
          schedule.map((slot, index) => {
            const duration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
            const height = Math.max((duration / SLOT_DURATION) * 4, 4);

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center p-3 rounded-md border-l-4",
                  slot.status === 'booked' && "bg-green-500/10 border-green-500",
                  slot.status === 'available' && "bg-muted/50 border-muted-foreground/20"
                )}
                style={{ minHeight: `${height}rem` }}
              >
                <div className="w-20 font-mono text-sm text-muted-foreground">
                  {format(slot.startTime, 'HH:mm')}
                </div>
                <div className="flex-1">
                  {slot.status === 'booked' && slot.appointment ? (
                    <div>
                      <p className="font-bold text-green-900 dark:text-green-300">{slot.appointment.profiles?.first_name || "לקוח"}</p>
                      <p className="text-sm text-green-800 dark:text-green-400">{slot.appointment.services?.name || "שירות"}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">פנוי</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};