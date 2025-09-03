import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { PlusCircle, XCircle } from "lucide-react";

type TimeSlot = { start: string; end: string };
type WorkingHours = {
  [key: string]: TimeSlot[] | null;
};

const daysOfWeek = [
  { key: "sunday", name: "יום ראשון" },
  { key: "monday", name: "יום שני" },
  { key: "tuesday", name: "יום שלישי" },
  { key: "wednesday", name: "יום רביעי" },
  { key: "thursday", name: "יום חמישי" },
  { key: "friday", name: "יום שישי" },
  { key: "saturday", name: "יום שבת" },
];

const defaultHours: WorkingHours = {
  sunday: [{ start: "09:00", end: "18:00" }],
  monday: [{ start: "09:00", end: "18:00" }],
  tuesday: [{ start: "09:00", end: "18:00" }],
  wednesday: [{ start: "09:00", end: "18:00" }],
  thursday: [{ start: "09:00", end: "18:00" }],
  friday: [{ start: "09:00", end: "14:00" }],
  saturday: null,
};

export const BusinessHoursManager = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_settings")
      .select("working_hours")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      showError("שגיאה בטעינת ההגדרות.");
      setWorkingHours(defaultHours);
    } else if (data && data.working_hours) {
      setWorkingHours(data.working_hours);
    } else {
      setWorkingHours(defaultHours);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleTimeChange = (day: string, index: number, type: "start" | "end", value: string) => {
    if (!workingHours) return;
    const daySlots = [...(workingHours[day] || [])];
    daySlots[index] = { ...daySlots[index], [type]: value };
    setWorkingHours({ ...workingHours, [day]: daySlots });
  };

  const handleDayToggle = (day: string, enabled: boolean) => {
    if (!workingHours) return;
    setWorkingHours({
      ...workingHours,
      [day]: enabled ? [{ start: "09:00", end: "18:00" }] : null,
    });
  };

  const handleAddSlot = (day: string) => {
    if (!workingHours) return;
    const daySlots = [...(workingHours[day] || [])];
    daySlots.push({ start: "13:00", end: "20:00" });
    setWorkingHours({ ...workingHours, [day]: daySlots });
  };

  const handleRemoveSlot = (day: string, index: number) => {
    if (!workingHours) return;
    const daySlots = [...(workingHours[day] || [])];
    daySlots.splice(index, 1);
    setWorkingHours({ ...workingHours, [day]: daySlots.length > 0 ? daySlots : null });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("business_settings")
      .update({ working_hours: workingHours })
      .eq("id", 1);

    if (error) {
      showError(`שגיאה בשמירת ההגדרות: ${error.message}`);
    } else {
      showSuccess("שעות הפעילות עודכנו בהצלחה!");
    }
    setIsSaving(false);
  };

  if (loading || !workingHours) {
    return <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ניהול שעות פעילות</CardTitle>
        <CardDescription>
          קבע את ימי ושעות הפעילות. ניתן להוסיף מספר מקטעי זמן לכל יום.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {daysOfWeek.map(({ key, name }) => {
          const daySlots = workingHours[key];
          const isEnabled = daySlots !== null && daySlots.length > 0;
          return (
            <div key={key} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch id={key} checked={isEnabled} onCheckedChange={(checked) => handleDayToggle(key, checked)} />
                  <Label htmlFor={key} className="font-bold text-lg">{name}</Label>
                </div>
                {isEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => handleAddSlot(key)}>
                    <PlusCircle className="w-4 h-4 ml-2" />
                    הוסף מקטע
                  </Button>
                )}
              </div>
              {isEnabled && (
                <div className="space-y-2 pl-10">
                  {daySlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input type="time" value={slot.start} onChange={(e) => handleTimeChange(key, index, "start", e.target.value)} className="w-32" />
                      <span>-</span>
                      <Input type="time" value={slot.end} onChange={(e) => handleTimeChange(key, index, "end", e.target.value)} className="w-32" />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(key, index)}>
                        <XCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? "שומר..." : "שמור שינויים"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};