import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";
import type { Appointment } from "./AppointmentCard";
import { useState } from "react";

type Props = {
  appointments: Appointment[];
  isLoading: boolean;
  onUpdate: () => void;
};

export const RecentRequestsPreview = ({ appointments, isLoading, onUpdate }: Props) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled' | 'rejected'>('active');

  const filteredAppointments = appointments.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'active') return app.status === 'pending' || app.status === 'approved';
    if (filter === 'cancelled') return app.status === 'cancelled';
    if (filter === 'rejected') return app.status === 'rejected';
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>הזמנות אחרונות</CardTitle>
        <div className="flex gap-2 mt-2 justify-end">
          <Button
            variant={filter === 'all' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            הכל
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            דורש טיפול
          </Button>
          <Button
            variant={filter === 'cancelled' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('cancelled')}
          >
            בוטל
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter('rejected')}
          >
            נדחה
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[250px]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : filteredAppointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">לא נמצאו הזמנות אחרונות.</p>
        ) : (
          filteredAppointments.map(app => (
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