import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfDay, endOfDay, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { he } from "date-fns/locale";

type Appointment = {
  id: string;
  start_time: string;
  profiles: { first_name: string | null } | null;
  services: { name: string | null } | null;
};

const getAgendaTitle = (date: Date): string => {
  if (isToday(date)) return "סדר היום להיום";
  if (isTomorrow(date)) return "סדר יום למחר";
  if (isYesterday(date)) return "סדר יום לאתמול";
  return `סדר יום - ${format(date, 'd MMMM', { locale: he })}`;
};

export const TodaysAgenda = () => {
  const [displayDate, setDisplayDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointmentsForDate = useCallback(async (date: Date) => {
    setIsLoading(true);
    const dateStart = startOfDay(date).toISOString();
    const dateEnd = endOfDay(date).toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .select("id, start_time, profiles(first_name), services(name)")
      .eq("status", "approved")
      .gte("start_time", dateStart)
      .lte("start_time", dateEnd)
      .order("start_time", { ascending: true });

    if (error) {
      console.error(`Error fetching appointments for ${date}:`, error);
      setAppointments([]);
    } else if (data) {
      setAppointments(data as unknown as Appointment[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointmentsForDate(displayDate);
  }, [displayDate, fetchAppointmentsForDate]);

  const handlePrevDay = () => {
    setDisplayDate(current => subDays(current, 1));
  };

  const handleNextDay = () => {
    setDisplayDate(current => addDays(current, 1));
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{getAgendaTitle(displayDate)}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow min-h-[200px]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : appointments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center py-4">אין תורים מאושרים ליום זה.</p>
          </div>
        ) : (
          appointments.map(app => (
            <div key={app.id} className="flex items-center gap-4 p-2 bg-muted/50 rounded-md">
              <div className="font-bold text-primary">
                {format(new Date(app.start_time), 'HH:mm')}
              </div>
              <div>
                <p className="font-semibold">{app.profiles?.first_name || "לקוח"}</p>
                <p className="text-sm text-muted-foreground">{app.services?.name || "שירות"}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/admin/calendar">עבור ליומן המלא</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};