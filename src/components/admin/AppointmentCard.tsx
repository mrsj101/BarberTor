import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentActions } from "./AppointmentActions";
import { Clock } from "lucide-react";

export type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  profiles: { first_name: string | null } | null;
  services: { name: string | null } | null;
};

type Props = {
  appointment: Appointment;
  onUpdate: () => void;
};

const statusStyles = {
  pending: { text: "ממתין לאישור", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  approved: { text: "אושר", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { text: "נדחה", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  cancelled: { text: "בוטל", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

const getStatusBorderColor = (status: Appointment['status']) => {
    switch (status) {
        case 'pending': return 'border-yellow-400';
        case 'approved': return 'border-green-400';
        case 'rejected':
        case 'cancelled':
        default:
            return 'border-red-400';
    }
}

export const AppointmentCard = ({ appointment, onUpdate }: Props) => {
  const statusInfo = statusStyles[appointment.status];
  const clientName = appointment.profiles?.first_name || "לקוח";
  const serviceName = appointment.services?.name || "שירות לא ידוע";

  return (
    <Card className={`mb-4 bg-muted/50 border-l-4 ${getStatusBorderColor(appointment.status)}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold">{serviceName}</p>
            <p className="text-sm text-muted-foreground">{clientName}</p>
          </div>
          <Badge variant="outline" className={statusInfo.className}>
            {statusInfo.text}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 ml-2" />
          <span>
            {new Date(appointment.start_time).toLocaleTimeString("he-IL", {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {(appointment.status === 'pending' || appointment.status === 'approved') && (
          <div className="pt-3 border-t border-border/50">
            <AppointmentActions
              appointmentId={appointment.id}
              currentStatus={appointment.status}
              onUpdate={onUpdate}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};