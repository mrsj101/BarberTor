import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Appointment = {
  id: string;
  start_time: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  profiles: { first_name: string | null } | null;
  services: { name: string | null } | null;
};

type Props = {
  appointments: Appointment[];
  isLoading: boolean;
};

const statusStyles: { [key in Appointment['status']]: { text: string; className: string } } = {
  pending: { text: "ממתין", className: "bg-yellow-400/20 text-yellow-300 border-yellow-400/30" },
  approved: { text: "אושר", className: "bg-green-400/20 text-green-300 border-green-400/30" },
  rejected: { text: "נדחה", className: "bg-red-400/20 text-red-300 border-red-400/30" },
  cancelled: { text: "בוטל", className: "bg-gray-400/20 text-gray-300 border-gray-400/30" },
};

export const RecentRequestsPreview = ({ appointments, isLoading }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>בקשות אחרונות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[250px]">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">לא נמצאו בקשות אחרונות.</p>
        ) : (
          appointments.map(app => (
            <div key={app.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
              <div>
                <p className="font-bold">{app.profiles?.first_name || "לקוח"}</p>
                <p className="text-sm text-muted-foreground">{app.services?.name || "שירות"}</p>
              </div>
              <Badge variant="outline" className={cn("font-normal", statusStyles[app.status].className)}>
                {statusStyles[app.status].text}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/admin/requests">הצג את כל הבקשות הממתינות</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};