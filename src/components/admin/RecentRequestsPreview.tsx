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

type FilterType = 'all' | 'pending' | 'approved' | 'cancelled' | 'rejected';

export const RecentRequestsPreview = ({ appointments, isLoading, onUpdate }: Props) => {
  const [filter, setFilter] = useState<FilterType>('pending');

  const filteredAppointments = appointments
    .filter(app => {
      switch (filter) {
        case 'all':
          return true;
        case 'pending':
          return app.status === 'pending';
        case 'approved':
          return app.status === 'approved';
        case 'cancelled':
          return app.status === 'cancelled';
        case 'rejected':
          return app.status === 'rejected';
        default:
          return true;
      }
    })
    .slice(0, 5);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'הכל' },
    { key: 'pending', label: 'דורש טיפול' },
    { key: 'approved', label: 'נקבעו' },
    { key: 'cancelled', label: 'בוטל' },
    { key: 'rejected', label: 'נדחה' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>הזמנות אחרונות</CardTitle>
        <div className="flex gap-2 mt-2 justify-end flex-wrap">
          {filterButtons.map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[250px]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : filteredAppointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">לא נמצאו הזמנות התואמות לסינון.</p>
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