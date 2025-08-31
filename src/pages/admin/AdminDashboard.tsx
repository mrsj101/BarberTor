import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Appointment } from "@/components/admin/AppointmentCard";
import { CalendarToolbar } from "@/components/admin/CalendarToolbar";
import { DailyAppointmentsList } from "@/components/admin/DailyAppointmentsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingAppointmentsList } from "@/components/admin/PendingAppointmentsList";
import type { DayContentProps } from "react-day-picker";

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const monthInterval = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return { start, end };
  }, [currentMonth]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, status, profiles(first_name), services(name)")
      .gte("start_time", monthInterval.start.toISOString())
      .lte("start_time", monthInterval.end.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } else if (data) {
      setAppointments(data as unknown as Appointment[]);
    }
    setLoading(false);
  }, [monthInterval]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const appointmentsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter(app => 
      format(new Date(app.start_time), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
  }, [appointments, selectedDate]);

  const appointmentDates = useMemo(() => {
    const dates = new Map<string, { hasPending: boolean }>();
    appointments.forEach(app => {
        const day = format(new Date(app.start_time), 'yyyy-MM-dd');
        const existing = dates.get(day) || { hasPending: false };
        if (app.status === 'pending') {
            existing.hasPending = true;
        }
        dates.set(day, existing);
    });
    return dates;
  }, [appointments]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const CustomDayContent = ({ date }: DayContentProps) => {
    const day = format(date, 'yyyy-MM-dd');
    const dayInfo = appointmentDates.get(day);
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        {format(date, 'd')}
        {dayInfo && (
          <div className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${dayInfo.hasPending ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
        )}
      </div>
    );
  };

  return (
    <Tabs defaultValue="requests" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="requests">בקשות ממתינות</TabsTrigger>
        <TabsTrigger value="calendar">יומן</TabsTrigger>
      </TabsList>
      <TabsContent value="requests" className="mt-6">
        <PendingAppointmentsList />
      </TabsContent>
      <TabsContent value="calendar" className="mt-6">
        <div className="space-y-6">
          <CalendarToolbar 
            currentDate={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border"
                components={{ DayContent: CustomDayContent }}
              />
            </div>
            <div className="md:col-span-2">
              <DailyAppointmentsList
                date={selectedDate}
                appointments={appointmentsForSelectedDay}
                isLoading={loading}
                onUpdate={fetchAppointments}
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default AdminDashboard;