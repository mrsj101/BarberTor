import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentWithDetails } from "@/pages/admin/AppointmentsManagementPage";
import { AppointmentActions } from "./AppointmentActions";
import { statusStyles, statusText } from "./Columns";
import { format } from "date-fns";
import { Clock, User, Phone, Scissors } from "lucide-react";

type Props = {
  appointment: AppointmentWithDetails;
  onUpdate: () => void;
};

export const MobileAppointmentCard = ({ appointment, onUpdate }: Props) => {
  const status = appointment.status;
  const clientName = appointment.profiles?.first_name || "לקוח";
  const clientPhone = appointment.profiles?.phone || "לא ידוע";
  const serviceName = appointment.services?.name || "שירות לא ידוע";
  const date = new Date(appointment.start_time);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{clientName}</CardTitle>
          <AppointmentActions appointment={appointment} onUpdate={onUpdate} />
        </div>
        <div className="flex items-center text-sm text-muted-foreground pt-1">
          <Phone className="w-3 h-3 ml-2" />
          <span>{clientPhone}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center">
          <Scissors className="w-4 h-4 ml-3 text-muted-foreground" />
          <span>{serviceName}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 ml-3 text-muted-foreground" />
          <span>{format(date, "dd/MM/yy")} בשעה {format(date, "HH:mm")}</span>
        </div>
        <div className="flex items-center">
           <Badge variant="outline" className={`ml-3 ${statusStyles[status] || ""}`}>
            {statusText[status] || status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};