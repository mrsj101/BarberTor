import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface ReminderLog {
  id: string;
  appointment_id: string;
  type: string;
  status: string;
  sent_at: string;
  appointments?: { start_time: string | null };
}

export const ReminderLogs = () => {
  const [logs, setLogs] = useState<ReminderLog[]>([]);

  useEffect(() => {
    supabase
      .from("reminder_logs")
      .select("id, appointment_id, type, status, sent_at, appointments(start_time)")
      .order("sent_at", { ascending: false })
      .then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>לוג תזכורות</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תור</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>זמן שליחה</TableHead>
              <TableHead>סטטוס</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.appointments?.start_time
                    ? new Date(log.appointments.start_time).toLocaleString()
                    : log.appointment_id}
                </TableCell>
                <TableCell>{log.type}</TableCell>
                <TableCell>{new Date(log.sent_at).toLocaleString()}</TableCell>
                <TableCell>{log.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
