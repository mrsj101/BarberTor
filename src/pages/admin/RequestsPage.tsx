import { PendingAppointmentsList } from "@/components/admin/PendingAppointmentsList";

const RequestsPage = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-right">אישור תורים ממתינים</h1>
      <PendingAppointmentsList />
    </div>
  );
};

export default RequestsPage;