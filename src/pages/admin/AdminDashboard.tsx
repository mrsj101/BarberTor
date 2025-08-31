import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentActions } from "@/components/admin/AppointmentActions";

type Appointment = {
  id: string;
  start_time: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  profiles: { first_name: string } | null;
  services: { name: string } | null;
};

const statusMap: { [key: string]: { text: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
  pending: { text: "ממתין לאישור", variant: "default" },
  approved: { text: "אושר", variant: "secondary" },
  rejected: { text: "נדחה", variant: "destructive" },
  cancelled: { text: "בוטל", variant: "destructive" },
};


const AdminDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, start_time, status, profiles(first_name), services(name)")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
    } else if (data) {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ניהול תורים</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>לקוח</TableHead>
              <TableHead>שירות</TableHead>
              <TableHead>תאריך ושעה</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!loading && appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  לא נמצאו תורים.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              appointments.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.profiles?.first_name || "N/A"}</TableCell>
                  <TableCell>{app.services?.name || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(app.start_time).toLocaleString("he-IL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[app.status]?.variant || "default"}>
                      {statusMap[app.status]?.text || app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AppointmentActions
                      appointmentId={app.id}
                      currentStatus={app.status}
                      onUpdate={fetchAppointments}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;