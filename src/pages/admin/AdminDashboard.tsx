import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, addDays, subDays, format, eachDayOfInterval } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard, Appointment } from "@/components/admin/AppointmentCard";
import { CalendarToolbar } from "@/components/admin/CalendarToolbar";

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekInterval = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(currentDate, { weekStartsOn: 0 }); // Saturday
    return { start, end };
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return eachDayOfInterval(weekInterval);
  }, [weekInterval]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, status, profiles(first_name), services(name)")
      .gte("start_time", weekInterval.start.toISOString())
      .lte("start_time", weekInterval.end.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } else if (data) {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  }, [weekInterval]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const appointmentsByDay = useMemo(() => {
    const grouped: { [key: string]: Appointment[] } = {};
    weekDays.forEach(day => {
      grouped[format(day, 'yyyy-MM-dd')] = [];
    });
    appointments.forEach(app => {
      const dayKey = format(new Date(app.start_time), 'yyyy-MM-dd');
      if (grouped[dayKey]) {
        grouped[dayKey].push(app);
      }
    });
    return grouped;
  }, [appointments, weekDays]);

  const handlePrevWeek = () => setCurrentDate(prev => subDays(prev, 7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6">
      <CalendarToolbar 
        currentDate={currentDate}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekDays.map(day => (
          <div key={day.toString()} className="bg-card rounded-lg p-4 border min-h-[200px]">
            <h3 className="font-bold text-center mb-1">
              {format(day, 'EEEE', { locale: he })}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {format(day, 'd MMM', { locale: he })}
            </p>
            <div className="space-y-2">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : appointmentsByDay[format(day, 'yyyy-MM-dd')].length > 0 ? (
                appointmentsByDay[format(day, 'yyyy-MM-dd')].map(app => (
                  <AppointmentCard key={app.id} appointment={app} onUpdate={fetchAppointments} />
                ))
              ) : (
                <div className="text-center text-muted-foreground pt-8 text-sm">אין תורים</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;