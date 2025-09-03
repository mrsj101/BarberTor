import { PendingAppointmentsList } from "@/components/admin/PendingAppointmentsList";
import { RescheduleRequestsManager } from "@/components/admin/RescheduleRequestsManager";

const RequestsPage = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-right">אישור תורים</h1>
      {/* תורים ממתינים לאישור */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-right">תורים ממתינים לאישור</h2>
        <PendingAppointmentsList />
      </div>
      {/* אישור תיאום מחדש */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-right">אישור תיאום מחדש</h2>
        <RescheduleRequestsManager />
      </div>
    </div>
  );
};

export default RequestsPage;