import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "../ui/skeleton";
import type { Service } from "@/pages/client/BookAppointment";
import { showError } from "@/utils/toast";

type Props = {
  service: Service;
  onSelectTime: (time: Date) => void;
  onBack: () => void;
};

type Slot = {
  time: string;
  available: boolean;
};

export const TimeSlotSelector = ({ service, onSelectTime, onBack }: Props) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;

    const fetchSlots = async () => {
      setLoading(true);
      setSlots([]);
      
      try {
        // Format date to YYYY-MM-DD to avoid timezone issues on the server
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        const { data, error } = await supabase.functions.invoke('get-available-slots', {
          body: { 
            date: formattedDate, 
            serviceDuration: service.duration_minutes 
          },
        });

        if (error) {
          throw error;
        }

        setSlots(data);

      } catch (error) {
        console.error("Error fetching available slots:", error);
        showError("שגיאה בטעינת זמנים פנויים. נסה שוב.");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [date, service.duration_minutes]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>שלב 2: בחירת מועד</CardTitle>
          <Button variant="ghost" onClick={onBack}>חזור</Button>
        </div>
        <p className="text-muted-foreground">שירות: {service.name} ({service.duration_minutes} דקות)</p>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-8">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-4 text-center md:text-right">
            {date ? date.toLocaleDateString("he-IL", { weekday: 'long', month: 'long', day: 'numeric' }) : "בחר תאריך"}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {loading && Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            {!loading && slots.length > 0 && slots.map((slot) => {
              const slotTime = new Date(slot.time);
              const isPast = slotTime < new Date();
              const isDisabled = !slot.available || isPast;

              return (
                <Button 
                  key={slot.time} 
                  variant="outline" 
                  onClick={() => onSelectTime(slotTime)}
                  disabled={isDisabled}
                  className={isDisabled ? "bg-muted text-muted-foreground line-through cursor-not-allowed" : ""}
                >
                  {slotTime.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' })}
                </Button>
              );
            })}
            {!loading && slots.length === 0 && date && (
              <p className="col-span-full text-center text-muted-foreground">אין תורים פנויים ביום זה.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};