import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/appointments-table/DataTable";
import { columns } from "@/components/admin/appointments-table/Columns";
import { Skeleton } from "@/components/ui/skeleton";

export type AppointmentWithDetails = {
  id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  notes: string | null;
  profiles: {
    id: string;
    first_name: string | null;
    phone: string | null;
  } | null;
  services: {
    id: string;
    name: string | null;
    duration_minutes: number;
  } | null;
};

const AppointmentsManagementPage = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*, profiles(*), services(*)")
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } else if (data) {
      setAppointments(data as unknown as AppointmentWithDetails[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ניהול תורים</h1>
      <p className="text-muted-foreground">
        כאן ניתן לנהל את כל התורים במערכת - עבר, הווה ועתיד.
      </p>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <DataTable columns={columns(fetchAppointments)} data={appointments} />
      )}
    </div>
  );
};

export default AppointmentsManagementPage;