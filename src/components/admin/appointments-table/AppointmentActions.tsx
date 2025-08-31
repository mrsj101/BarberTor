import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, Ban, Check, X, Trash2, Clock } from "lucide-react";
import { AppointmentWithDetails } from "@/pages/admin/AppointmentsManagementPage";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { TimeSlotSelector } from "@/components/booking/TimeSlotSelector";
import { addMinutes } from "date-fns";
import { statusText } from "./Columns";

type Props = {
  appointment: AppointmentWithDetails;
  onUpdate: () => void;
};

export const AppointmentActions = ({ appointment, onUpdate }: Props) => {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const handleStatusChange = async (
    newStatus: "pending" | "approved" | "rejected" | "cancelled" | "completed"
  ) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment.id);

    if (error) {
      showError(`שגיאה בעדכון הסטטוס: ${error.message}`);
    } else {
      showSuccess("סטטוס התור עודכן בהצלחה");
      onUpdate();
    }
  };

  const handleReschedule = async (newTime: Date) => {
    if (!appointment.services) {
      showError("לא ניתן לשנות מועד עבור שירות לא ידוע.");
      return;
    }
    const startTime = newTime;
    const endTime = addMinutes(startTime, appointment.services.duration_minutes);

    const { error } = await supabase
      .from("appointments")
      .update({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "pending", // Reset status to pending for re-confirmation
      })
      .eq("id", appointment.id);

    if (error) {
      showError(`שגיאה בשינוי מועד: ${error.message}`);
    } else {
      showSuccess("מועד התור שונה וממתין לאישור מחדש");
      setIsRescheduleOpen(false);
      onUpdate();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">פתח תפריט</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>פעולות</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsRescheduleOpen(true)}>
            <Calendar className="ml-2 h-4 w-4" />
            <span>שינוי מועד</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Clock className="ml-2 h-4 w-4" />
              <span>שנה סטטוס</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {Object.keys(statusText).map((statusKey) => (
                  <DropdownMenuItem
                    key={statusKey}
                    onClick={() => handleStatusChange(statusKey as any)}
                  >
                    {statusText[statusKey]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={() => setIsCancelOpen(true)}
          >
            <Trash2 className="ml-2 h-4 w-4" />
            <span>ביטול תור</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>שינוי מועד תור</DialogTitle>
            <DialogDescription>
              בחר תאריך ושעה חדשים עבור{" "}
              {appointment.profiles?.first_name || "הלקוח"}.
            </DialogDescription>
          </DialogHeader>
          {appointment.services && (
            <TimeSlotSelector
              service={appointment.services}
              onSelectTime={handleReschedule}
              onBack={() => setIsRescheduleOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Alert Dialog */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור ביטול תור</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לבטל את התור? פעולה זו תשנה את סטטוס
              התור ל"בוטל". לא ניתן לשחזר פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>חזרה</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleStatusChange("cancelled")}
            >
              כן, בטל את התור
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};