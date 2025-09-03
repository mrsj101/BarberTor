import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { showError, showSuccess } from "@/utils/toast";

type AppointmentStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed" | "client_approval_pending";

type Appointment = {
  id: string;
  start_time: string;
  status: AppointmentStatus;
  services: { name: string };
};

const statusMap: {
  [key in AppointmentStatus]: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
} = {
  pending: { text: "ממתין לאישור", variant: "default" },
  approved: { text: "אושר", variant: "secondary" },
  rejected: { text: "נדחה", variant: "destructive" },
  cancelled: { text: "בוטל", variant: "destructive" },
  completed: { text: "הושלם", variant: "outline" },
  client_approval_pending: { text: "הוצע מועד חדש", variant: "default" },
};

export const MyAppointments = () => {
  const { user } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, start_time, status, services(name)")
      .eq("user_id", user.id)
      .in("status", ["pending", "approved", "client_approval_pending"]) // רק תורים פעילים
      .gte("start_time", new Date().toISOString()) // רק תורים עתידיים
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
    } else if (data) {
      setAppointments(data as unknown as Appointment[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleClientResponse = async (
    appointmentId: string,
    newStatus: "approved" | "cancelled"
  ) => {
    setUpdatingId(appointmentId);
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      showError(`שגיאה בעדכון התור: ${error.message}`);
    } else {
      showSuccess(newStatus === "approved" ? "התור אושר בהצלחה" : "התור בוטל");
      fetchAppointments(); // Refetch to show the updated list
    }
    setUpdatingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center md:text-right">התורים שלי</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {!loading && appointments.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            אין לך תורים אחרונים או עתידיים.
          </p>
        )}
        <div className="space-y-4">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted rounded-md gap-4"
            >
              <div className="flex-grow">
                <p className="font-bold">{app.services.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(app.start_time).toLocaleDateString("he-IL", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(app.start_time).toLocaleTimeString("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="w-full sm:w-auto">
                {app.status === "client_approval_pending" ? (
                  <div className="flex flex-col items-stretch sm:items-center gap-2">
                    <p className="text-sm font-semibold text-center sm:text-right">
                      {statusMap[app.status]?.text}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => handleClientResponse(app.id, "approved")}
                        disabled={updatingId === app.id}
                      >
                        אישור
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClientResponse(app.id, "cancelled")}
                        disabled={updatingId === app.id}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Badge variant={statusMap[app.status]?.variant || "default"}>
                    {statusMap[app.status]?.text || app.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};