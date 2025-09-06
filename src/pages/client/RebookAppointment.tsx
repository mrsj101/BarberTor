import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { he } from "date-fns/locale";
import { addMinutes, differenceInHours } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AppointmentStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed" | "client_approval_pending";

type Appointment = {
  id: string;
  service_id: string;
  start_time: string;
  created_at: string;
  end_time: string;
  status: AppointmentStatus;
  services: { name: string; duration_minutes: number };
};

type Slot = {
  time: string;
  available: boolean;
};

type Policy = {
  hours: number;
  graceMinutes: number;
};

const RebookAppointment = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [policy, setPolicy] = useState<Policy>({ hours: 12, graceMinutes: 30 });
  const [loading, setLoading] = useState(true);
  const [isRebooking, setIsRebooking] = useState(false);
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const appointmentPromise = supabase
        .from("appointments")
        .select("id, service_id, start_time, created_at, end_time, status, services(name, duration_minutes)")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(1)
        .single();

      const settingsPromise = supabase
        .from("business_settings")
        .select("rebooking_hours_before, rebooking_grace_period_minutes")
        .single();

      const [{ data: appointmentData, error: appointmentError }, { data: settingsData, error: settingsError }] = await Promise.all([appointmentPromise, settingsPromise]);

      if (appointmentError && appointmentError.code !== 'PGRST116') throw appointmentError;
      if (settingsError) console.warn("Could not fetch settings, using default.");

      setAppointment(appointmentData as Appointment | null);
      setPolicy({
        hours: settingsData?.rebooking_hours_before || 12,
        graceMinutes: settingsData?.rebooking_grace_period_minutes || 30,
      });

    } catch (error: any) {
      showError("שגיאה בטעינת התור שלך.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchAvailableSlots = useCallback(async (date: Date) => {
    if (!appointment) return;
    
    setLoadingSlots(true);
    setAvailableSlots([]);
    
    try {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const { data, error } = await supabase.functions.invoke('get-available-slots', {
        body: {
          date: formattedDate,
          serviceDuration: appointment.services.duration_minutes,
        },
      });

      if (error) throw error;

      const now = new Date();
      const slots = (data as Slot[])
        .filter(slot => new Date(slot.time) > now && slot.available)
        .map(slot => new Date(slot.time));

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      showError("שגיאה בטעינת זמנים פנויים.");
    } finally {
      setLoadingSlots(false);
    }
  }, [appointment]);

  useEffect(() => {
    if (newDate && appointment) {
      fetchAvailableSlots(newDate);
    }
  }, [newDate, appointment, fetchAvailableSlots]);

  const handleRebookSubmit = async () => {
    if (!appointment || !selectedTime || !user) return;

    setIsRebooking(true);
    
    try {
      const { data: settings, error: settingsError } = await supabase
        .from("business_settings")
        .select("auto_approve_appointments")
        .single();
      if (settingsError) throw new Error("Failed to fetch settings.");
      const autoApprove = settings?.auto_approve_appointments || false;

      const { error: cancelError } = await supabase
        .from("appointments")
        .update({ status: 'cancelled', notes: `בוטל על ידי לקוח בעת תיאום מחדש.` })
        .eq('id', appointment.id);
      if (cancelError) throw cancelError;

      const startTime = selectedTime;
      const endTime = addMinutes(startTime, appointment.services.duration_minutes);
      const { error: insertError } = await supabase.from("appointments").insert({
        user_id: user.id,
        service_id: appointment.service_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: autoApprove ? "approved" : "pending",
        notes: `תואם מחדש מהזמנה #${appointment.id.slice(-6)}. ${notes}`,
      });
      if (insertError) throw insertError;

      showSuccess(autoApprove ? "התור תואם מחדש ואושר בהצלחה!" : "התור תואם מחדש וממתין לאישור");
      navigate("/");

    } catch (error: any) {
      showError(`שגיאה בתיאום התור מחדש: ${error.message}`);
      fetchData();
    } finally {
      setIsRebooking(false);
      setIsDialogOpen(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("he-IL", { weekday: "long", day: "2-digit", month: "long" }),
      time: date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const hoursUntil = appointment ? differenceInHours(new Date(appointment.start_time), new Date()) : 0;
  const isBeforeDeadline = appointment ? hoursUntil >= policy.hours : false;

  const appointmentCreatedAt = appointment ? new Date(appointment.created_at) : new Date();
  const gracePeriodEnd = appointment ? addMinutes(appointmentCreatedAt, policy.graceMinutes) : new Date();
  const isWithinGracePeriod = new Date() < gracePeriodEnd;

  const canRebook = isBeforeDeadline || isWithinGracePeriod;
  const tooltipMessage = `לא ניתן לתאם מחדש פחות מ-${policy.hours} שעות לפני התור, ותקופת החסד (${policy.graceMinutes} דקות) הסתיימה.`;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center md:text-right text-2xl">תיאום תור מחדש</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : !appointment ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">אין לך תור מאושר שניתן לתאם מחדש.</p>
              <Link to="/" className="text-primary underline">חזרה למסך הבית</Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-right text-sm text-blue-800">
                    <p className="font-medium">מדיניות תיאום מחדש</p>
                    <p>ניתן לתאם מחדש עד {policy.hours} שעות לפני מועד התור, או בתוך {policy.graceMinutes} דקות מרגע קביעת התור. בחירת מועד חדש תבטל את תורך הנוכחי.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-muted rounded-lg gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-lg">{appointment.services.name}</h4>
                    <Badge variant="secondary">מאושר</Badge>
                  </div>
                  <div className="flex items-center text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateTime(appointment.start_time).date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDateTime(appointment.start_time).time}</span>
                    </div>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div tabIndex={0}>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button disabled={!canRebook}>תיאום מחדש</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-center">בחירת מועד חדש</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2 text-right text-gray-900">1. בחר תאריך חדש:</label>
                                <div className="flex justify-center">
                                  <UiCalendar locale={he} mode="single" selected={newDate} onSelect={setNewDate} className="rounded-md border" disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} />
                                </div>
                              </div>
                              {newDate && (
                                <div>
                                  <label className="block text-sm font-medium mb-2 text-right text-gray-900">2. בחר שעה חדשה:</label>
                                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                    {loadingSlots && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                    {!loadingSlots && availableSlots.length > 0 && availableSlots.map((slot) => (
                                      <Button key={slot.toISOString()} variant={selectedTime?.getTime() === slot.getTime() ? "default" : "outline"} onClick={() => setSelectedTime(slot)} className="h-10 text-sm">
                                        {slot.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' })}
                                      </Button>
                                    ))}
                                    {!loadingSlots && availableSlots.length === 0 && <p className="col-span-4 text-center text-muted-foreground text-sm">אין זמנים פנויים ביום זה.</p>}
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium mb-2 text-right text-gray-900">3. הערות (אופציונלי):</label>
                                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות לתור החדש..." className="min-h-[80px]" dir="rtl" />
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button onClick={handleRebookSubmit} disabled={!selectedTime || isRebooking} className="flex-1">
                                  {isRebooking ? "מעדכן..." : "אשר תיאום מחדש"}
                                </Button>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">ביטול</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TooltipTrigger>
                    {!canRebook && (
                      <TooltipContent>
                        <p>{tooltipMessage}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RebookAppointment;