import { useState, useEffect } from "react";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { TimeSlotSelector } from "@/components/booking/TimeSlotSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "@/utils/toast";
import { addMinutes } from "date-fns";

export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
};

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const [hasFutureAppointment, setHasFutureAppointment] = useState(false);
  const [loadingFuture, setLoadingFuture] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setLoadingFuture(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "approved", "client_approval_pending"])
        .gte("start_time", new Date().toISOString());

      if (error) {
        setHasFutureAppointment(false);
      } else {
        setHasFutureAppointment((data?.length ?? 0) > 0);
      }
      setLoadingFuture(false);
    };
    fetchAppointments();
  }, [user]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedTime || !user) return;

    setIsSubmitting(true);
    
    try {
      // Fetch auto-approval setting
      const { data: settings, error: settingsError } = await supabase
        .from("business_settings")
        .select("auto_approve_appointments")
        .single();

      if (settingsError) {
        throw new Error("Failed to fetch business settings.");
      }

      const autoApprove = settings?.auto_approve_appointments || false;
      const startTime = selectedTime;
      const endTime = addMinutes(startTime, selectedService.duration_minutes);

      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        service_id: selectedService.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: autoApprove ? "approved" : "pending",
        notes: notes,
      });

      if (error) {
        throw error;
      }

      showSuccess(autoApprove ? "התור נקבע ואושר בהצלחה!" : "התור נקבע בהצלחה וממתין לאישור");
      navigate("/");

    } catch (error: any) {
      showError(`שגיאה בקביעת התור: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingFuture) {
    return (
      <Card>
        <CardHeader><CardTitle>קביעת תור</CardTitle></CardHeader>
        <CardContent><div className="h-24 w-full bg-muted animate-pulse rounded" /></CardContent>
      </Card>
    );
  }

  if (hasFutureAppointment) {
    return (
      <Card>
        <CardHeader><CardTitle>קביעת תור</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 text-center">
            כבר יש לך תור עתידי פעיל. לא ניתן לקבוע תור נוסף עד שהתור יסתיים או יבוטל.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      {step === 1 && <ServiceSelector onSelectService={handleServiceSelect} />}
      
      {step === 2 && selectedService && (
        <TimeSlotSelector
          service={selectedService}
          onSelectTime={handleTimeSelect}
          onBack={() => {
            setStep(1);
            setSelectedTime(null);
          }}
        />
      )}

      {step === 3 && selectedService && selectedTime && (
        <Card>
          <CardHeader><CardTitle>אישור פרטי התור</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="font-bold text-lg">{selectedService.name}</p>
              <p className="text-muted-foreground">
                {selectedTime.toLocaleDateString("he-IL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-muted-foreground">
                בשעה: {selectedTime.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">הערות (אופציונלי)</label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="בקשות מיוחדות, שאלות..."
              />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)}>חזרה</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "קובע תור..." : "קבע תור"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookAppointment;