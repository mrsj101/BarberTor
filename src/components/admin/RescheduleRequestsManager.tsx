import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Calendar, Clock, User, CheckCircle, XCircle, MessageSquare, AlertCircle } from "lucide-react";
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
  new_date?: string;
  new_time?: string;
  appointments: {
    id: string;
    start_time: string;
    end_time: string;
    services: { name: string; duration_minutes: number };
    profiles: { first_name: string | null };
  };
};

const statusMap = {
  pending: { text: "ממתין לטיפול", variant: "default" as const, color: "bg-yellow-500" },
  approved: { text: "אושר", variant: "secondary" as const, color: "bg-green-500" },
  rejected: { text: "נדחה", variant: "destructive" as const, color: "bg-red-500" },
};

export const RescheduleRequestsManager = () => {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

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
          new_date,
          new_time,
          appointments (
            id,
            start_time,
            end_time,
            services (name, duration_minutes),
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

  // אישור המועד שהמשתמש בחר
  const handleApproveUserTime = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      // עדכון התור עם המועד החדש שהמשתמש בחר
      const newDateTime = new Date(`${selectedRequest.new_date}T${selectedRequest.new_time}`);
      const endTime = addMinutes(newDateTime, selectedRequest.appointments.services.duration_minutes);

      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({
          start_time: newDateTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "approved", // התור מאושר ישירות
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
          admin_notes: adminNotes.trim() || "המועד החדש אושר",
        })
        .eq("id", selectedRequest.id);

      if (requestError) {
        showError(`שגיאה בעדכון הבקשה: ${requestError.message}`);
        return;
      }

      showSuccess("התור אושר בהצלחה למועד החדש");
      setIsRescheduleDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();

    } catch (error) {
      showError("אירעה שגיאה באישור התור");
    } finally {
      setProcessingId(null);
    }
  };

  // דחיית בקשה
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

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved';
    if (filter === 'rejected') return r.status === 'rejected';
    return true;
  });

  const pendingRequests = requests.filter(r => r.status === "pending");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>בקשות לתיאום מחדש</span>
            <Badge className="bg-blue-500">{pendingRequests.length} ממתינות</Badge>
          </CardTitle>
          <div className="flex gap-2 mt-4 justify-end">
            <Button
              variant={filter === 'all' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              הכל
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              ממתין
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter('approved')}
            >
              אושר
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter('rejected')}
            >
              נדחה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              אין בקשות לתיאום מחדש
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredRequests.map((request) => {
                const { date, time } = formatDateTime(request.appointments.start_time);
                const statusInfo = statusMap[request.status];
                return (
                  <Card key={request.id} className="transition-shadow border p-0 hover:shadow-md">
                    <CardContent className="p-3 md:p-4 flex flex-col md:flex-row md:items-center md:gap-6">
                      <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-6">
                        <div className="flex flex-col gap-1 min-w-[120px] md:min-w-[160px]">
                          <span className="font-medium">{request.appointments.profiles?.first_name || "לקוח"}</span>
                          <span className="text-xs text-gray-500">{request.appointments.services.name}</span>
                          <Badge variant={statusInfo.variant} className={statusInfo.color + " w-fit mt-1"}>{statusInfo.text}</Badge>
                        </div>
                        <div className="flex flex-col gap-1 min-w-[120px] md:min-w-[160px]">
                          <span className="text-xs text-gray-500">תור נוכחי</span>
                          <span className="font-medium">{date} {time}</span>
                        </div>
                        {request.new_date && request.new_time && (
                          <div className="flex flex-col gap-1 min-w-[120px] md:min-w-[160px]">
                            <span className="text-xs text-gray-500">מועד מבוקש</span>
                            <span className="font-medium text-green-700">{new Date(request.new_date).toLocaleDateString("he-IL", { weekday: "long", day: "2-digit", month: "2-digit" })} {request.new_time}</span>
                          </div>
                        )}
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-xs text-gray-500">סיבה</span>
                          <span className="text-sm text-gray-700 truncate max-w-xs md:max-w-md">{request.reason}</span>
                        </div>
                        {request.admin_notes && (
                          <div className="flex flex-col gap-1 min-w-[120px] md:min-w-[160px]">
                            <span className="text-xs text-gray-500">הערות אדמין</span>
                            <span className="text-xs text-blue-700 truncate max-w-xs md:max-w-md">{request.admin_notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-row gap-2 mt-2 md:mt-0 md:flex-col md:gap-2 md:items-end">
                        {request.status === "pending" && (
                          <>
                            {request.new_date && request.new_time && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setSelectedRequest(request); setIsRescheduleDialogOpen(true); }} disabled={processingId === request.id}>
                                <CheckCircle className="w-4 h-4 mr-2" />אישור
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setIsRescheduleDialogOpen(true); }} disabled={processingId === request.id}>
                              <Calendar className="w-4 h-4 mr-2" />מועד אחר
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedRequest(request); setIsRejectDialogOpen(true); }} disabled={processingId === request.id}>
                              <XCircle className="w-4 h-4 mr-2" />דחייה
                            </Button>
                          </>
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

      {/* דיאלוג אישור המועד החדש */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>אישור בקשה לתיאום מחדש</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">פרטי הבקשה:</h4>
                <p><strong>לקוח:</strong> {selectedRequest.appointments.profiles?.first_name || "לא ידוע"}</p>
                <p><strong>שירות:</strong> {selectedRequest.appointments.services.name}</p>
                <p><strong>סיבת הבקשה:</strong> {selectedRequest.reason}</p>
              </div>

              {/* הצגת המועד החדש שהמשתמש בחר */}
              {selectedRequest.new_date && selectedRequest.new_time && (
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <h4 className="font-semibold mb-2 text-green-800">המועד החדש שביקש המשתמש:</h4>
                  <p className="text-green-700">
                    {new Date(selectedRequest.new_date).toLocaleDateString("he-IL", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit"
                    })} בשעה {selectedRequest.new_time}
                  </p>
                </div>
              )}

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

              <div className="flex gap-2">
                {/* כפתור אישור המועד החדש */}
                {selectedRequest.new_date && selectedRequest.new_time && (
                  <Button
                    onClick={handleApproveUserTime}
                    disabled={processingId === selectedRequest.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    אישור המועד החדש
                  </Button>
                )}
                
                {/* כפתור בחירת מועד אחר */}
                <Button
                  variant="outline"
                  onClick={() => {
                    // כאן נפתח TimeSlotSelector לבחירת מועד אחר
                    // נצטרך להוסיף state נוסף לזה
                  }}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  בחירת מועד אחר
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRescheduleDialogOpen(false);
                    setSelectedRequest(null);
                    setAdminNotes("");
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* דיאלוג דחייה */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דחיית בקשה לתיאום מחדש</DialogTitle>
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
