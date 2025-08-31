import { PendingAppointmentsList } from "@/components/admin/PendingAppointmentsList";

const RequestsPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">כל הזמנות התור הממתינות</h1>
      <PendingAppointmentsList />
    </div>
  );
};

export default RequestsPage;