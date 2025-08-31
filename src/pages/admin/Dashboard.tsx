import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format } from "date-fns";
import { DashboardStatCard } from "@/components/admin/DashboardStatCard";
import { PendingRequestsPreview } from "@/components/admin/PendingRequestsPreview";
import { TodaysAgenda } from "@/components/admin/TodaysAgenda";
import { Users, CalendarCheck, Mail, Calendar as CalendarIcon } from "lucide-react";

type Appointment = {
  id: string;
  start_time: string;
  status: string;
  profiles: { first_name: string | null } | null;
  services: { name: string | null } | null;
};

const Dashboard = () => {
  const [stats, setStats] = useState({ pending: 0, today: 0, week: 0 });
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }).toISOString(); // Sunday
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 }).toISOString();

      // Fetch all relevant appointments in one go
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, status, profiles(first_name), services(name)")
        .gte("start_time", weekStart)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching dashboard data:", error);
      } else if (data) {
        const typedData = data as Appointment[];
        const pending = typedData.filter(a => a.status === 'pending');
        const todays = typedData.filter(a => a.start_time >= todayStart && a.start_time <= todayEnd && a.status === 'approved');
        const week = typedData.filter(a => a.start_time >= weekStart && a.start_time <= weekEnd && a.status === 'approved');

        setStats({ pending: pending.length, today: todays.length, week: week.length });
        setPendingAppointments(pending);
        setTodaysAppointments(todays);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">דשבורד ניהול</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard title="בקשות ממתינות" value={stats.pending} icon={Mail} isLoading={loading} />
        <DashboardStatCard title="תורים להיום" value={stats.today} icon={CalendarIcon} isLoading={loading} />
        <DashboardStatCard title="תורים השבוע" value={stats.week} icon={CalendarCheck} isLoading={loading} />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <PendingRequestsPreview appointments={pendingAppointments} isLoading={loading} />
        </div>
        <div>
          <TodaysAgenda appointments={todaysAppointments} isLoading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;