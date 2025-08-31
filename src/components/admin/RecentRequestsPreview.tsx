import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";
import type { Appointment } from "./AppointmentCard";

type Props = {
  appointments: Appointment[];
  isLoading: boolean;
  onUpdate: () => void;
};

export const RecentRequestsPreview = ({ appointments, isLoading, onUpdate }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>הזמנות אחרונות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[250px]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">לא נמצאו הזמנות אחרונות.</p>
        ) : (
          appointments.map(app => (
            <AppointmentCard key={app.id} appointment={app} onUpdate={onUpdate} />
          ))
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/admin/requests">הצג את כל ההזמנות הממתינות</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};