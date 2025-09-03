import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, isToday, isWithinInterval, format } from "date-fns";
import { he } from "date-fns/locale";
import { DashboardStatCard } from "@/components/admin/DashboardStatCard";
import { RecentRequestsPreview } from "@/components/admin/RecentRequestsPreview";
import { TodaysAgenda } from "@/components/admin/TodaysAgenda";
import { CalendarCheck, Mail, Calendar as CalendarIcon, Clock } from "lucide-react";
import type { Appointment } from "@/components/admin/AppointmentCard";
import { RescheduleRequestsManager } from "@/components/admin/RescheduleRequestsManager";

type Item = {
  id: string;
  primaryText: string;
  secondaryText: string;
};

const Dashboard = () => {
  const [stats, setStats] = useState({ pending: 0, today: 0, week: 0, rescheduleRequests: 0 });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
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

    // שליפת תורים
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, created_at, status, profiles(first_name), services(name)")
      .order("created_at", { ascending: false });

    // שליפת בקשות לדחיית תור
    const { data: rescheduleData, error: rescheduleError } = await supabase
      .from("reschedule_requests")
      .select("id, status, created_at")
      .eq("status", "pending");

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
    }
    
    if (rescheduleError) {
      console.error("Error fetching reschedule requests:", rescheduleError);
    }

    if (appointmentsData) {
      const typedData = appointmentsData as unknown as Appointment[];
      
      const pending = typedData.filter(a => a.status === 'pending');
      const todaysApproved = typedData.filter(a => new Date(a.start_time) >= todayStart && new Date(a.start_time) <= todayEnd && a.status === 'approved');
      const weekApproved = typedData.filter(a => new Date(a.start_time) >= weekStart && new Date(a.start_time) <= weekEnd && a.status === 'approved');
      
      const rescheduleCount = rescheduleData ? rescheduleData.length : 0;
      
      setStats({ 
        pending: pending.length, 
        today: todaysApproved.length, 
        week: weekApproved.length,
        rescheduleRequests: rescheduleCount
      });
      
      setRecentAppointments(typedData.slice(0, 5));

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
          primaryText: a.profiles?.[0]?.first_name || "לקוח",
          secondaryText: todaysUpcoming.length > 0 
            ? format(new Date(a.start_time), 'HH:mm')
            : format(new Date(a.start_time), 'EEE, HH:mm', { locale: he })
        }))
      );

      setWeekItems(
        weeksUpcoming.slice(0, 5).map(a => ({
          id: a.id,
          primaryText: a.profiles?.[0]?.first_name || "לקוח",
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
        <DashboardStatCard title="הזמנות ממתינות" value={stats.pending} icon={Mail} isLoading={loading} />
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
        <DashboardStatCard 
          title="בקשות לתיאום מחדש" 
          value={stats.rescheduleRequests} 
          icon={Clock} 
          isLoading={loading}
          items={[]}
          listTitle=""
          emptyStateMessage="אין בקשות ממתינות."
          linkTo="/admin/requests"
          linkText="לניהול בקשות"
        />
      </div>
      {/* הזמנות */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-right">הזמנות אחרונות</h2>
          <RecentRequestsPreview appointments={recentAppointments} isLoading={loading} onUpdate={fetchData} />
        </div>
        <div>
          <TodaysAgenda />
        </div>
      </div>
      {/* בקשות לתיאום מחדש */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-right">בקשות לתיאום מחדש</h2>
        <RescheduleRequestsManager />
      </div>
    </div>
  );
};

export default Dashboard;