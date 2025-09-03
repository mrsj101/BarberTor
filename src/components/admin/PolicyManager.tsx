import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

export const PolicyManager = () => {
  const [policyHours, setPolicyHours] = useState<number | string>("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_settings")
      .select("cancellation_policy_hours")
      .single();

    if (error) {
      showError("שגיאה בטעינת מדיניות הביטולים.");
    } else if (data) {
      setPolicyHours(data.cancellation_policy_hours || 12);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const hours = Number(policyHours);
    if (isNaN(hours) || hours < 0) {
      showError("ערך לא תקין. הזן מספר שעות חיובי.");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("business_settings")
      .update({ cancellation_policy_hours: hours })
      .eq("id", 1);

    if (error) {
      showError(`שגיאה בשמירת המדיניות: ${error.message}`);
    } else {
      showSuccess("מדיניות הביטולים והתיאום מחדש עודכנה!");
    }
    setIsSaving(false);
  };

  if (loading) {
    return <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>מדיניות ביטול ותיאום מחדש</CardTitle>
        <CardDescription>
          קבע כמה שעות מראש לקוח יכול לבטל או לתאם מחדש תור. הגדרה זו תחול על שני המקרים.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Label htmlFor="policy-hours" className="whitespace-nowrap">שעות לפני התור:</Label>
          <Input
            id="policy-hours"
            type="number"
            value={policyHours}
            onChange={(e) => setPolicyHours(e.target.value)}
            className="w-32"
            min="0"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? "שומר..." : "שמור מדיניות"}
        </Button>
      </CardFooter>
    </Card>
  );
};