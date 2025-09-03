import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, AppointmentCard } from "./AppointmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PendingAppointmentsList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, status, profiles(*), services(*)")
      .eq("status", "pending")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching pending appointments:", error);
      setAppointments([]);
    } else if (data) {
      setAppointments(data as unknown as Appointment[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPendingAppointments();
  }, [fetchPendingAppointments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>הזמנות ממתינות לאישור</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            אין הזמנות חדשות הממתינות לאישור.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => (
              <AppointmentCard key={app.id} appointment={app} onUpdate={fetchPendingAppointments} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};