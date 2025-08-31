import { useState } from "react";
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
  price: number;
};

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

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
    const startTime = selectedTime;
    const endTime = addMinutes(startTime, selectedService.duration_minutes);

    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      service_id: selectedService.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "pending",
      notes: notes,
    });

    setIsSubmitting(false);

    if (error) {
      showError(`שגיאה בקביעת התור: ${error.message}`);
    } else {
      showSuccess("התור נקבע בהצלחה וממתין לאישור");
      navigate("/");
    }
  };

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
          <CardHeader>
            <CardTitle>אישור פרטי התור</CardTitle>
          </CardHeader>
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