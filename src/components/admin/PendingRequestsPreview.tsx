import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";

type Appointment = {
  id: string;
  start_time: string;
  profiles: { first_name: string | null } | null;
  services: { name: string | null } | null;
};

type Props = {
  appointments: Appointment[];
  isLoading: boolean;
};

export const PendingRequestsPreview = ({ appointments, isLoading }: Props) => {
  const previewAppointments = appointments.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>בקשות אחרונות לאישור</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : previewAppointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">אין בקשות ממתינות.</p>
        ) : (
          previewAppointments.map(app => (
            <div key={app.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
              <div>
                <p className="font-bold">{app.profiles?.first_name || "לקוח"}</p>
                <p className="text-sm text-muted-foreground">{app.services?.name || "שירות"}</p>
              </div>
              <p className="text-sm">
                {format(new Date(app.start_time), 'EEEE, dd/MM/yy HH:mm', { locale: he })}
              </p>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/admin/requests">הצג את כל הבקשות</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};