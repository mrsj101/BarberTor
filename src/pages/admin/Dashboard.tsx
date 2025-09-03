import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, isToday, isWithinInterval, format } from "date-fns";
import { he } from "date-fns/locale";
import { DashboardStatCard } from "@/components/admin/DashboardStatCard";
import { RecentRequestsPreview } from "@/components/admin/RecentRequestsPreview";
import { TodaysAgenda } from "@/components/admin/TodaysAgenda";
import { CalendarCheck, Mail, Calendar as CalendarIcon } from "lucide-react";
import type { Appointment } from "@/components/admin/AppointmentCard";
import { AutoApprovalManager } from "@/components/admin/AutoApprovalManager";

type Item = {
  id: string;
  primaryText: string;
  secondaryText: string;
};

const Dashboard = () => {
  const [stats, setStats] = useState({ pending: 0, today: 0, week: 0 });
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [todayItems, setTodayItems] = useState<Item[]>([]);
  const [weekItems, setWeekItems] = useState<Item[]>([]);
  const [todaysUpcomingCount, setTodaysUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, created_at, status, profiles(*), services(*)")
      .order("created_at", { ascending: false });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
    }

    if (appointmentsData) {
      const typedData = appointmentsData as unknown as Appointment[];
      
      const pending = typedData.filter(a => a.status === 'pending');
      const todaysApproved = typedData.filter(a => new Date(a.start_time) >= todayStart && new Date(a.start_time) <= todayEnd && a.status === 'approved');
      const weekApproved = typedData.filter(a => new Date(a.start_time) >= weekStart && new Date(a.start_time) <= weekEnd && a.status === 'approved');
      
      setStats({ 
        pending: pending.length, 
        today: todaysApproved.length, 
        week: weekApproved.length,
      });
      
      setAllAppointments(typedData);

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
          secondaryText: todaysUpcoming.length > 0 
            ? format(new Date(a.start_time), 'HH:mm')
            : format(new Date(a.start_time), 'EEE, HH:mm', { locale: he })
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center md:text-right">דשבורד ניהול</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard title="הזמנות ממתינות" value={stats.pending} icon={Mail} isLoading={loading} linkTo="/admin/requests" linkText="עבור לאישור תורים" />
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
        <AutoApprovalManager isCompact={true} />
      </div>
      {/* הזמנות */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-right">הזמנות אחרונות</h2>
          <RecentRequestsPreview appointments={allAppointments} isLoading={loading} onUpdate={fetchData} />
        </div>
        <div>
          <TodaysAgenda />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;