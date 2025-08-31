import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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

export const TodaysAgenda = ({ appointments, isLoading }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>סדר היום להיום</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">אין תורים מאושרים להיום.</p>
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
    </Card>
  );
};