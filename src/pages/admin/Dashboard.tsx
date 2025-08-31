import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, isToday, isWithinInterval, format } from "date-fns";
import { he } from "date-fns/locale";
import { DashboardStatCard } from "@/components/admin/DashboardStatCard";
import { RecentRequestsPreview } from "@/components/admin/RecentRequestsPreview";
import { TodaysAgenda } from "@/components/admin/TodaysAgenda";
import { CalendarCheck, Mail, Calendar as CalendarIcon } from "lucide-react";

type Appointment = {
  id: string;
  start_time: string;
  created_at: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  profiles: { first_name: string | null } | null;
  services: { name: string | null } | null;
};

type Item = {
  id: string;
  primaryText: string;
  secondaryText: string;
};

const Dashboard = () => {
  const [stats, setStats] = useState({ pending: 0, today: 0, week: 0 });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [todayItems, setTodayItems] = useState<Item[]>([]);
  const [weekItems, setWeekItems] = useState<Item[]>([]);
  const [todaysUpcomingCount, setTodaysUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, created_at, status, profiles(first_name), services(name)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching dashboard data:", error);
      } else if (data) {
        const typedData = data as Appointment[];
        
        // Stats calculation
        const pending = typedData.filter(a => a.status === 'pending');
        const todaysApproved = typedData.filter(a => new Date(a.start_time) >= todayStart && new Date(a.start_time) <= todayEnd && a.status === 'approved');
        const weekApproved = typedData.filter(a => new Date(a.start_time) >= weekStart && new Date(a.start_time) <= weekEnd && a.status === 'approved');
        
        setStats({ pending: pending.length, today: todaysApproved.length, week: weekApproved.length });
        
        // Recent requests (all statuses)
        setRecentAppointments(typedData.slice(0, 5));

        // Upcoming appointments logic
        const upcomingAppointments = typedData
          .filter(a => a.status === 'approved' && new Date(a.start_time) > now)
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        const todaysUpcoming = upcomingAppointments.filter(a => isToday(new Date(a.start_time)));
        setTodaysUpcomingCount(todaysUpcoming.length);

        const weeksUpcoming = upcomingAppointments.filter(a => isWithinInterval(new Date(a.start_time), { start: weekStart, end: weekEnd }));

        const todayDisplayItems = todaysUpcoming.length > 0 ? todaysUpcoming : upcomingAppointments;
        setTodayItems(
          todayDisplayItems.slice(0, 5).map(a => ({
            id: a.id,
            primaryText: a.profiles?.first_name || "לקוח",
            secondaryText: format(new Date(a.start_time), 'HH:mm')
          }))
        );

        setWeekItems(
          weeksUpcoming.slice(0, 5).map(a => ({
            id: a.id,
            primaryText: a.profiles?.first_name || "לקוח",
            secondaryText: format(new Date(a.start_time), 'EEE, HH:mm', { locale: he })
          }))
        );
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
        <DashboardStatCard 
          title="תורים להיום" 
          value={stats.today} 
          icon={CalendarIcon} 
          isLoading={loading}
          items={todayItems}
          listTitle={todaysUpcomingCount > 0 ? "התורים הבאים להיום:" : "חמשת התורים הבאים:"}
          emptyStateMessage="אין תורים קרובים."
        />
        <DashboardStatCard 
          title="תורים השבוע" 
          value={stats.week} 
          icon={CalendarCheck} 
          isLoading={loading}
          items={weekItems}
          listTitle="התורים הבאים השבוע:"
          emptyStateMessage="אין תורים קרובים השבוע."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentRequestsPreview appointments={recentAppointments} isLoading={loading} />
        </div>
        <div>
          <TodaysAgenda />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;