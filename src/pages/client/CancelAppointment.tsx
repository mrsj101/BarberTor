import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { Link } from "react-router-dom";
import { differenceInHours, addMinutes } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Appointment = {
  id: string;
  start_time: string;
  created_at: string;
  services: { name: string };
};

type Policy = {
  hours: number;
  graceMinutes: number;
};

const CancelAppointment = () => {
  const { user } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [policy, setPolicy] = useState<Policy>({ hours: 12, graceMinutes: 30 });
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const appointmentsPromise = supabase
        .from("appointments")
        .select("id, start_time, created_at, services(name)")
        .eq("user_id", user.id)
        .in("status", ["approved", "pending"])
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      const settingsPromise = supabase
        .from("business_settings")
        .select("cancellation_hours_before, cancellation_grace_period_minutes")
        .single();

      const [{ data: appointmentsData, error: appointmentsError }, { data: settingsData, error: settingsError }] = await Promise.all([appointmentsPromise, settingsPromise]);

      if (appointmentsError) throw appointmentsError;
      if (settingsError) console.warn("Could not fetch settings, using default.");

      setAppointments(appointmentsData as Appointment[] || []);
      setPolicy({
        hours: settingsData?.cancellation_hours_before || 12,
        graceMinutes: settingsData?.cancellation_grace_period_minutes || 30,
      });

    } catch (error: unknown) {
      showError("שגיאה בטעינת התורים שלך.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (appointmentId: string) => {
    setCancellingId(appointmentId);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: 'cancelled', notes: 'בוטל על ידי לקוח' })
        .eq('id', appointmentId);

      if (error) throw error;

      showSuccess("התור בוטל בהצלחה.");
      fetchData(); // Refresh the list
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showError(`שגיאה בביטול התור: ${message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("he-IL", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>ביטול תור</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">אין לך תורים עתידיים לביטול.</p>
              <Link to="/" className="text-primary underline">חזרה למסך הבית</Link>
            </div>
          ) : (
            appointments.map(app => {
              const hoursUntil = differenceInHours(new Date(app.start_time), new Date());
              const isBeforeDeadline = hoursUntil >= policy.hours;

              const appointmentCreatedAt = new Date(app.created_at);
              const gracePeriodEnd = addMinutes(appointmentCreatedAt, policy.graceMinutes);
              const isWithinGracePeriod = new Date() < gracePeriodEnd;

              const canCancel = isBeforeDeadline || isWithinGracePeriod;
              const tooltipMessage = `לא ניתן לבטל פחות מ-${policy.hours} שעות לפני התור, ותקופת החסד (${policy.graceMinutes} דקות) הסתיימה.`;

              return (
                <div key={app.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-bold">{app.services.name}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(app.start_time)}</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div tabIndex={0}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                disabled={!canCancel || cancellingId === app.id}
                                className={!canCancel ? "cursor-not-allowed" : ""}
                              >
                                {cancellingId === app.id ? "מבטל..." : "בטל תור"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>אישור ביטול תור</AlertDialogTitle>
                                <AlertDialogDescription>
                                  האם אתה בטוח שברצונך לבטל את התור? לא ניתן לשחזר פעולה זו.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>חזרה</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancel(app.id)}>
                                  כן, בטל את התור
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TooltipTrigger>
                      {!canCancel && (
                        <TooltipContent>
                          <p>{tooltipMessage}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelAppointment;