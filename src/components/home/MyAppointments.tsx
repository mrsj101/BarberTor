import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Appointment = {
  id: string;
  start_time: string;
  status: string;
  services: { name: string };
};

const statusMap: { [key: string]: { text: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
  pending: { text: "ממתין לאישור", variant: "default" },
  approved: { text: "אושר", variant: "secondary" },
  rejected: { text: "נדחה", variant: "destructive" },
  cancelled: { text: "בוטל", variant: "destructive" },
};

export const MyAppointments = () => {
  const { user } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, status, services(name)")
        .eq("user_id", user.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
      } else if (data) {
        setAppointments(data as unknown as Appointment[]);
      }
      setLoading(false);
    };

    fetchAppointments();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>התורים שלי</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p>טוען תורים...</p>}
        {!loading && appointments.length === 0 && (
          <p className="text-muted-foreground">אין לך תורים עתידיים.</p>
        )}
        <div className="space-y-4">
          {appointments.map((app) => (
            <div key={app.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
              <div>
                <p className="font-bold">{app.services.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(app.start_time).toLocaleDateString("he-IL")} - {new Date(app.start_time).toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Badge variant={statusMap[app.status]?.variant || "default"}>
                {statusMap[app.status]?.text || app.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};