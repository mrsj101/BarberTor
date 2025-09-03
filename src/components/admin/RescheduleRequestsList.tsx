import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Calendar, Clock, User, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { TimeSlotSelector } from "@/components/booking/TimeSlotSelector";
import { addMinutes } from "date-fns";

type RescheduleRequest = {
  id: string;
  appointment_id: string;
  user_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_notes?: string;
  appointments: {
    id: string;
    start_time: string;
    end_time: string;
    services: { id: string; name: string; duration_minutes: number; price: number | null; };
    profiles: { first_name: string | null };
  };
};

const statusMap = {
  pending: { text: "ממתין לטיפול", variant: "default" as const, color: "bg-yellow-500" },
  approved: { text: "אושר", variant: "secondary" as const, color: "bg-green-500" },
  rejected: { text: "נדחה", variant: "destructive" as const, color: "bg-red-500" },
};

export const RescheduleRequestsList = () => {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reschedule_requests")
        .select(`
          id,
          appointment_id,
          user_id,
          reason,
          status,
          created_at,
          admin_notes,
          appointments (
            id,
            start_time,
            end_time,
            services (id, name, duration_minutes, price),
            profiles (first_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reschedule requests:", error);
        showError("שגיאה בטעינת בקשות הדחייה");
      } else if (data) {
        setRequests(data as unknown as RescheduleRequest[]);
      }
    } catch (error) {
      showError("אירעה שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApproveWithNewTime = async (newTime: Date) => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      const startTime = newTime;
      const endTime = addMinutes(startTime, selectedRequest.appointments.services.duration_minutes);

      // עדכון התור עם הזמן החדש
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "client_approval_pending", // הלקוח יצטרך לאשר
        })
        .eq("id", selectedRequest.appointment_id);

      if (appointmentError) {
        showError(`שגיאה בעדכון התור: ${appointmentError.message}`);
        return;
      }

      // עדכון הבקשה
      const { error: requestError } = await supabase
        .from("reschedule_requests")
        .update({
          status: "approved",
          admin_notes: adminNotes.trim() || "התור נדחה למועד חדש",
        })
        .eq("id", selectedRequest.id);

      if (requestError) {
        showError(`שגיאה בעדכון הבקשה: ${requestError.message}`);
        return;
      }

      showSuccess("הבקשה אושרה והלקוח יקבל הצעה למועד חדש");
      setIsRescheduleDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();

    } catch (error) {
      showError("אירעה שגיאה באישור הבקשה");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      const { error } = await supabase
        .from("reschedule_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes.trim() || "הבקשה נדחתה",
        })
        .eq("id", selectedRequest.id);

      if (error) {
        showError(`שגיאה בדחיית הבקשה: ${error.message}`);
        return;
      }

      showSuccess("הבקשה נדחתה");
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();

    } catch (error) {
      showError("אירעה שגיאה בדחיית הבקשה");
    } finally {
      setProcessingId(null);
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

  const pendingRequests = requests.filter(r => r.status === "pending");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>בקשות לדחיית תורים</span>
            <Badge className="bg-blue-500">{pendingRequests.length} ממתינות</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              אין בקשות לדחיית תורים
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const { date, time } = formatDateTime(request.appointments.start_time);
                const statusInfo = statusMap[request.status];
                
                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">
                              {request.appointments.profiles?.first_name || "לקוח"} (ID: {request.user_id.slice(-8)})
                            </span>
                            <Badge variant={statusInfo.variant} className={statusInfo.color}>
                              {statusInfo.text}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-1">התור הנוכחי:</h4>
                              <p className="font-medium">{request.appointments.services.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{date}</span>
                                <Clock className="w-4 h-4" />
                                <span>{time}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              סיבת הבקשה:
                            </h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded text-right">
                              {request.reason}
                            </p>
                          </div>

                          {request.admin_notes && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-gray-700 mb-2">הערות אדמין:</h4>
                              <p className="text-gray-600 bg-blue-50 p-3 rounded text-right">
                                {request.admin_notes}
                              </p>
                            </div>
                          )}

                          <div className="text-sm text-gray-500">
                            נשלח ב: {new Date(request.created_at).toLocaleString("he-IL")}
                          </div>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsRescheduleDialogOpen(true);
                              }}
                              disabled={processingId === request.id}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              אישור + קביעת מועד
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsRejectDialogOpen(true);
                              }}
                              disabled={processingId === request.id}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              דחייה
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* דיאלוג אישור עם בחירת מועד */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>אישור בקשה וקביעת מועד חדש</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">פרטי הבקשה:</h4>
                <p><strong>לקוח:</strong> {selectedRequest.appointments.profiles?.first_name || "לא ידוע"}</p>
                <p><strong>שירות:</strong> {selectedRequest.appointments.services.name}</p>
                <p><strong>סיבת הבקשה:</strong> {selectedRequest.reason}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right">
                  הערות אדמין (אופציונלי):
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="הוסף הערות אם יש צורך..."
                  className="min-h-[80px]"
                  dir="rtl"
                />
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-right">בחר מועד חדש:</h4>
                <TimeSlotSelector
                  service={selectedRequest.appointments.services}
                  onSelectTime={handleApproveWithNewTime}
                  onBack={() => setIsRescheduleDialogOpen(false)}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* דיאלוג דחייה */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דחיית בקשה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              האם אתה בטוח שברצונך לדחות את הבקשה?
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                סיבת הדחייה (אופציונלי):
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="הסבר מדוע הבקשה נדחתה..."
                className="min-h-[80px]"
                dir="rtl"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={processingId === selectedRequest?.id}
                variant="destructive"
                className="flex-1"
              >
                דחה בקשה
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setSelectedRequest(null);
                  setAdminNotes("");
                }}
                className="flex-1"
              >
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};