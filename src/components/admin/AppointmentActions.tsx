import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

type Props = {
  appointmentId: string;
  currentStatus: string;
  onUpdate: () => void; // Callback to refresh the list
};

export const AppointmentActions = ({ appointmentId, currentStatus, onUpdate }: Props) => {
  const handleUpdateStatus = async (newStatus: "approved" | "rejected" | "cancelled") => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      showError(`שגיאה בעדכון הסטטוס: ${error.message}`);
    } else {
      let successMessage = "הסטטוס עודכן בהצלחה";
      if (newStatus === 'approved') successMessage = "התור אושר בהצלחה";
      if (newStatus === 'rejected') successMessage = "התור נדחה בהצלחה";
      if (newStatus === 'cancelled') successMessage = "התור בוטל בהצלחה";
      showSuccess(successMessage);
      onUpdate(); // Refresh the appointments list
    }
  };

  if (currentStatus === "pending") {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleUpdateStatus("approved")}>
          אישור
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleUpdateStatus("rejected")}
        >
          דחייה
        </Button>
      </div>
    );
  }

  if (currentStatus === "approved") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleUpdateStatus("cancelled")}
        >
          ביטול תור
        </Button>
        {/* Placeholder for Reschedule */}
        <Button size="sm" variant="outline" disabled>
          שינוי מועד
        </Button>
      </div>
    );
  }

  return null; // No actions for rejected/cancelled appointments
};