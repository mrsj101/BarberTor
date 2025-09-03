import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

type WorkingHours = {
  [key: string]: { start: string; end: string } | null;
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
  sunday: { start: "09:00", end: "18:00" },
  monday: { start: "09:00", end: "18:00" },
  tuesday: { start: "09:00", end: "18:00" },
  wednesday: { start: "09:00", end: "18:00" },
  thursday: { start: "09:00", end: "18:00" },
  friday: { start: "09:00", end: "14:00" },
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

  const handleTimeChange = (day: string, type: "start" | "end", value: string) => {
    if (!workingHours) return;
    const dayHours = workingHours[day] || { start: "09:00", end: "18:00" };
    setWorkingHours({
      ...workingHours,
      [day]: { ...dayHours, [type]: value },
    });
  };

  const handleDayToggle = (day: string, enabled: boolean) => {
    if (!workingHours) return;
    setWorkingHours({
      ...workingHours,
      [day]: enabled ? { start: "09:00", end: "18:00" } : null,
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("business_settings")
      .update({ working_hours: workingHours })
      .eq("id", 1); // Assuming there's only one row for settings

    if (error) {
      showError(`שגיאה בשמירת ההגדרות: ${error.message}`);
    } else {
      showSuccess("שעות הפעילות עודכנו בהצלחה!");
    }
    setIsSaving(false);
  };

  if (loading || !workingHours) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ניהול שעות פעילות</CardTitle>
        <CardDescription>
          קבע את ימי ושעות הפעילות של העסק. שינויים ישפיעו על התורים שיוצגו ללקוחות.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {daysOfWeek.map(({ key, name }) => {
          const daySettings = workingHours[key];
          const isEnabled = daySettings !== null;
          return (
            <div key={key} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Switch
                  id={key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleDayToggle(key, checked)}
                />
                <Label htmlFor={key} className="font-bold w-20">{name}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="time"
                  value={daySettings?.start || ""}
                  onChange={(e) => handleTimeChange(key, "start", e.target.value)}
                  disabled={!isEnabled}
                  className="w-32"
                />
                <span>-</span>
                <Input
                  type="time"
                  value={daySettings?.end || ""}
                  onChange={(e) => handleTimeChange(key, "end", e.target.value)}
                  disabled={!isEnabled}
                  className="w-32"
                />
              </div>
            </div>
          );
        })}
        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? "שומר..." : "שמור שינויים"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};