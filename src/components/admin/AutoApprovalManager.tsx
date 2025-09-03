import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { AlertCircle } from "lucide-react";

type Props = {
  isCompact?: boolean;
};

export const AutoApprovalManager = ({ isCompact = false }: Props) => {
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_settings")
      .select("auto_approve_appointments")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      showError("שגיאה בטעינת הגדרת אישור אוטומטי.");
    } else if (data) {
      setAutoApprove(data.auto_approve_appointments || false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async (checked: boolean) => {
    setAutoApprove(checked);
    const { error } = await supabase
      .from("business_settings")
      .update({ auto_approve_appointments: checked })
      .eq("id", 1);

    if (error) {
      showError("שגיאה בעדכון ההגדרה.");
      setAutoApprove(!checked); // Revert on error
    } else {
      showSuccess(`אישור אוטומטי ${checked ? "הופעל" : "כובה"}.`);
    }
  };

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (isCompact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">אישור תורים אוטומטי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-approve-switch-compact" className="text-muted-foreground">
              {autoApprove ? "מופעל" : "כבוי"}
            </Label>
            <Switch
              id="auto-approve-switch-compact"
              checked={autoApprove}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>מערכת אישור תורים אוטומטית</CardTitle>
        <CardDescription>
          הפעל אפשרות זו כדי שהמערכת תאשר באופן אוטומטי כל תור חדש שנקבע בזמן פנוי.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch id="auto-approve-switch" checked={autoApprove} onCheckedChange={handleToggle} />
          <Label htmlFor="auto-approve-switch" className="text-lg">
            {autoApprove ? "אישור אוטומטי מופעל" : "אישור אוטומטי כבוי"}
          </Label>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-right text-sm text-blue-800">
              <p className="font-medium">איך זה עובד?</p>
              <p>כאשר האפשרות מופעלת, כל תור חדש שנקבע על ידי לקוח יאושר מיידית והזמן ייחסם ביומן. אם האפשרות כבויה, תורים חדשים ימתינו לאישורך הידני בעמוד "אישור תורים".</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};