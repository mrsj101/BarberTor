import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/appointments-table/DataTable";
import { columns } from "@/components/admin/appointments-table/Columns";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAppointmentCard } from "@/components/admin/appointments-table/MobileAppointmentCard";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

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

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const clientName = appointment.profiles?.first_name || "";
      return clientName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [appointments, searchTerm]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(app => (
              <MobileAppointmentCard key={app.id} appointment={app} onUpdate={fetchAppointments} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">לא נמצאו תורים.</p>
          )}
        </div>
      );
    }

    return <DataTable columns={columns(fetchAppointments)} data={filteredAppointments} />;
  };

  return (
    <div className="space-y-6">
      <div className="text-center md:text-right">
        <h1 className="text-3xl font-bold">ניהול תורים</h1>
        <p className="text-muted-foreground">
          כאן ניתן לנהל את כל התורים במערכת - עבר, הווה ועתיד.
        </p>
      </div>
      <Input
        placeholder="חפש לקוח..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm mx-auto md:mx-0"
      />
      {renderContent()}
    </div>
  );
};

export default AppointmentsManagementPage;