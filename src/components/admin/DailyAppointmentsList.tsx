import { Appointment, AppointmentCard } from "./AppointmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";

type Props = {
  date: Date | undefined;
  appointments: Appointment[];
  isLoading: boolean;
  onUpdate: () => void;
};

export const DailyAppointmentsList = ({ date, appointments, isLoading, onUpdate }: Props) => {
  if (!date) {
    return (
      <div className="p-4 border rounded-lg min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">בחר יום מהיומן כדי לראות תורים</p>
      </div>
    );
  }

  const formattedDate = format(date, 'EEEE, d MMMM yyyy', { locale: he });

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'approved');
  const otherAppointments = appointments.filter(a => !['pending', 'approved'].includes(a.status));


  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-xl font-bold mb-4">{formattedDate}</h3>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center text-muted-foreground pt-8">אין תורים ביום זה</div>
      ) : (
        <div className="space-y-6">
          {pendingAppointments.length > 0 && (
            <div>
              <h4 className="font-bold mb-3">ממתינים לאישור ({pendingAppointments.length})</h4>
              {pendingAppointments.map(app => (
                <AppointmentCard key={app.id} appointment={app} onUpdate={onUpdate} />
              ))}
            </div>
          )}
          {confirmedAppointments.length > 0 && (
            <div>
              <h4 className="font-bold mb-3">תורים מאושרים ({confirmedAppointments.length})</h4>
              {confirmedAppointments.map(app => (
                <AppointmentCard key={app.id} appointment={app} onUpdate={onUpdate} />
              ))}
            </div>
          )}
          {otherAppointments.length > 0 && (
            <div>
              <h4 className="font-bold mb-3 text-muted-foreground">תורים אחרים ({otherAppointments.length})</h4>
              {otherAppointments.map(app => (
                <AppointmentCard key={app.id} appointment={app} onUpdate={onUpdate} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};