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
import { Link } from "react-router-dom";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { Calendar as UiCalendar } from "@/components/ui/calendar";

type AppointmentStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed" | "client_approval_pending";

type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  services: { name: string; duration_minutes: number };
};

type RescheduleRequest = {
  id: string;
  appointment_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  new_date?: string;
  new_time?: string;
  admin_notes?: string;
  created_at: string;
  appointments: {
    id: string;
    start_time: string;
    end_time: string;
    services: { name: string; duration_minutes: number };
  };
};

const statusMap: {
  [key in AppointmentStatus]: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    canReschedule: boolean;
  };
} = {
  pending: { text: "ממתין לאישור", variant: "default", canReschedule: false },
  approved: { text: "אושר", variant: "secondary", canReschedule: true },
  rejected: { text: "נדחה", variant: "destructive", canReschedule: false },
  cancelled: { text: "בוטל", variant: "destructive", canReschedule: false },
  completed: { text: "הושלם", variant: "outline", canReschedule: false },
  client_approval_pending: { text: "הוצע מועד חדש", variant: "default", canReschedule: false },
};

const RescheduleAppointment = () => {
  const { user } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // שליפת תורים עתידיים מאושרים
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, status, services(name, duration_minutes)")
        .eq("user_id", user.id)
        .in("status", ["approved", "client_approval_pending"])
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      // שליפת בקשות דחייה ממתינות לאישור
      const { data: requestsData, error: requestsError } = await supabase
        .from("reschedule_requests")
        .select(`
          id,
          appointment_id,
          reason,
          status,
          new_date,
          new_time,
          admin_notes,
          created_at,
          appointments (
            id,
            start_time,
            end_time,
            services (name, duration_minutes)
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
      }
      
      if (requestsError) {
        console.error("Error fetching reschedule requests:", requestsError);
      }

      if (appointmentsData) {
        setAppointments(appointmentsData as unknown as Appointment[]);
      }
      
      if (requestsData) {
        setRescheduleRequests(requestsData as unknown as RescheduleRequest[]);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      showError("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // פונקציה לשליפת זמנים פנויים
  const fetchAvailableSlots = useCallback(async (date: Date) => {
    if (!selectedAppointment) return;
    
    setLoadingSlots(true);
    setAvailableSlots([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-available-slots', {
        body: {
          date: date.toISOString(),
          serviceDuration: selectedAppointment.services.duration_minutes,
        },
      });

      if (error) {
        throw error;
      }

      const slots = data.map((slot: string) => new Date(slot));
      setAvailableSlots(slots);

    } catch (error) {
      console.error("Error fetching available slots:", error);
      showError("שגיאה בטעינת זמנים פנויים.");
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedAppointment]);

  // עדכון זמנים פנויים כשהתאריך משתנה
  useEffect(() => {
    if (newDate && selectedAppointment) {
      fetchAvailableSlots(newDate);
    }
  }, [newDate, selectedAppointment, fetchAvailableSlots]);

  const handleRescheduleRequest = async () => {
    if (!selectedAppointment) {
      showError("שגיאה בבחירת התור");
      return;
    }

    if (!selectedTime) {
      showError("אנא בחר תאריך ושעה חדשים");
      return;
    }

    // הסרתי את הבדיקה של הסיבה - היא אופציונלית עכשיו

    setReschedulingId(selectedAppointment.id);
    
    try {
      const { error } = await supabase
        .from("reschedule_requests")
        .insert({
          appointment_id: selectedAppointment.id,
          user_id: user?.id,
          reason: reason.trim() || "לא צוינה סיבה", // אם אין סיבה, נשתמש בטקסט ברירת מחדל
          new_date: selectedTime.toISOString().split('T')[0],
          new_time: selectedTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          status: "pending",
          created_at: new Date().toISOString(),
        });

      if (error) {
        showError(`שגיאה בשליחת הבקשה: ${error.message}`);
      } else {
        showSuccess("בקשתך לדחיית התור נשלחה לאדמין לאישור");
        setIsDialogOpen(false);
        setSelectedAppointment(null);
        setReason("");
        setNewDate(undefined);
        setSelectedTime(null);
        fetchData();
      }
    } catch (error) {
      showError("אירעה שגיאה בשליחת הבקשה");
    } finally {
      setReschedulingId(null);
    }
  };

  const handleClientResponse = async (
    appointmentId: string,
    newStatus: "approved" | "cancelled"
  ) => {
    setReschedulingId(appointmentId);
    
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) {
        showError(`שגיאה בעדכון התור: ${error.message}`);
      } else {
        showSuccess(newStatus === "approved" ? "התור אושר בהצלחה" : "התור בוטל");
        fetchData();
      }
    } catch (error) {
      showError("אירעה שגיאה בעדכון התור");
    } finally {
      setReschedulingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("he-IL", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
      time: date.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center md:text-right text-2xl">דחיית תור</CardTitle>
        </CardHeader>
        <CardContent>
          {/* הסבר על התהליך */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-right text-sm text-blue-800">
                <p className="font-medium">איך זה עובד?</p>
                <p>בקשתך לדחיית התור תישלח לאדמין לאישור. תקבל עדכון ברגע שיטופל.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* בקשות ממתינות לאישור */}
              {rescheduleRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-right">בקשות ממתינות לאישור:</h3>
                  <div className="space-y-3">
                    {rescheduleRequests.map((request) => {
                      const { date, time } = formatDateTime(request.appointments.start_time);
                      
                      return (
                        <div
                          key={request.id}
                          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-yellow-500">ממתין לאישור אדמין</Badge>
                            <h4 className="font-bold text-lg">{request.appointments.services.name}</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700">התור הנוכחי:</p>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{date}</span>
                                <Clock className="w-4 h-4" />
                                <span>{time}</span>
                              </div>
                            </div>
                            
                            {request.new_date && request.new_time && (
                              <div>
                                <p className="font-medium text-green-700">המועד החדש שביקשת:</p>
                                <div className="flex items-center gap-2 text-green-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(request.new_date).toLocaleDateString("he-IL")}</span>
                                  <Clock className="w-4 h-4" />
                                  <span>{request.new_time}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">
                              <strong>סיבה:</strong> {request.reason}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              נשלח ב: {new Date(request.created_at).toLocaleString("he-IL")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* תורים עתידיים */}
              {appointments.length === 0 && rescheduleRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">אין לך תורים עתידיים או בקשות ממתינות.</p>
                  <Link to="/" className="text-primary underline">חזרה למסך הבית</Link>
                </div>
              ) : appointments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-right">התורים העתידיים שלך:</h3>
                  
                  {appointments.map((appointment) => {
                    const { date, time } = formatDateTime(appointment.start_time);
                    const statusInfo = statusMap[appointment.status];
                    
                    // בדיקה אם יש בקשה ממתינת לתור הזה
                    const hasPendingRequest = rescheduleRequests.some(
                      req => req.appointment_id === appointment.id
                    );
                    
                    return (
                      <div
                        key={appointment.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-muted rounded-lg gap-4 mb-3"
                      >
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-lg">{appointment.services.name}</h4>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.text}
                            </Badge>
                          </div>
                          <div className="flex items-center text-muted-foreground gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="w-full sm:w-auto">
                          {appointment.status === "client_approval_pending" ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium text-center">
                                האדמין הציע מועד חדש - אשר או דחה:
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleClientResponse(appointment.id, "approved")}
                                  disabled={reschedulingId === appointment.id}
                                >
                                  אישור המועד
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleClientResponse(appointment.id, "cancelled")}
                                  disabled={reschedulingId === appointment.id}
                                >
                                  ביטול התור
                                </Button>
                              </div>
                            </div>
                          ) : statusInfo.canReschedule && !hasPendingRequest ? (
                            // הצגת כפתור רק אם אין בקשה ממתינת
                            <Dialog open={isDialogOpen && selectedAppointment?.id === appointment.id} 
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setSelectedAppointment(appointment);
                                      } else {
                                        setIsDialogOpen(false);
                                        setSelectedAppointment(null);
                                        setReason("");
                                        setNewDate(undefined);
                                        setSelectedTime(null);
                                      }
                                    }}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setIsDialogOpen(true);
                                  }}
                                  disabled={reschedulingId === appointment.id}
                                >
                                  בקש דחיית תור
                                </Button>
                              </DialogTrigger>
                              
                              {/* Dialog content remains the same */}
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-center">בקשה לדחיית תור</DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  {/* פרטי התור הנוכחי */}
                                  <div className="bg-gray-50 p-3 rounded">
                                    <h4 className="font-semibold text-gray-900 mb-2">פרטי התור הנוכחי:</h4>
                                    <p className="text-gray-700">{appointment.services.name}</p>
                                    <p className="text-gray-700">{date} בשעה {time}</p>
                                  </div>
                                  
                                  {/* בחירת תאריך */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2 text-right text-gray-900">
                                      תאריך חדש:
                                    </label>
                                    <div className="flex justify-center">
                                      <UiCalendar
                                        mode="single"
                                        selected={newDate}
                                        onSelect={setNewDate}
                                        className="rounded-md border"
                                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                      />
                                    </div>
                                  </div>

                                  {/* בחירת שעה */}
                                  {newDate && (
                                    <div>
                                      <label className="block text-sm font-medium mb-2 text-right text-gray-900">
                                        שעה חדשה:
                                      </label>
                                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                        {loadingSlots && Array.from({ length: 8 }).map((_, i) => (
                                          <Skeleton key={i} className="h-10 w-full" />
                                        ))}
                                        
                                        {!loadingSlots && availableSlots.length > 0 && availableSlots.map((slot) => (
                                          <Button 
                                            key={slot.toISOString()} 
                                            variant={selectedTime?.getTime() === slot.getTime() ? "default" : "outline"}
                                            onClick={() => setSelectedTime(slot)}
                                            className="h-10 text-sm"
                                          >
                                            {slot.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' })}
                                          </Button>
                                        ))}
                                        
                                        {!loadingSlots && availableSlots.length === 0 && (
                                          <p className="col-span-4 text-center text-muted-foreground text-sm">
                                            אין זמנים פנויים ביום זה.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* סיבת הבקשה */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2 text-right text-gray-900">
                                      סיבת הבקשה לדחייה (אופציונלי):
                                    </label>
                                    <Textarea
                                      value={reason}
                                      onChange={(e) => setReason(e.target.value)}
                                      placeholder="אנא הסבר מדוע אתה מבקש לדחות את התור..."
                                      className="min-h-[80px] text-gray-900 bg-white border-gray-300"
                                      dir="rtl"
                                    />
                                  </div>

                                  {/* כפתורי פעולה */}
                                  <div className="flex gap-2 pt-4">
                                    <Button 
                                      onClick={handleRescheduleRequest}
                                      disabled={!selectedTime} // רק בדיקה שיש שעה נבחרת
                                      className="flex-1"
                                    >
                                      שלח בקשה
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      onClick={() => {
                                        setIsDialogOpen(false);
                                        setSelectedAppointment(null);
                                        setReason("");
                                        setNewDate(undefined);
                                        setSelectedTime(null);
                                      }}
                                      className="flex-1"
                                    >
                                      ביטול
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : hasPendingRequest ? (
                            <Badge variant="outline" className="bg-yellow-50">
                              בקשה ממתינת
                            </Badge>
                          ) : (
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.text}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-primary underline">חזרה למסך הבית</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RescheduleAppointment;