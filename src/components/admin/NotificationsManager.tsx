import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function NotificationsManager() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userIds, setUserIds] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("business_settings")
      .select("appointment_reminders_enabled")
      .single()
      .then(({ data }) => {
        if (data) setRemindersEnabled(data.appointment_reminders_enabled || false);
      });
  }, []);

  const toggleReminders = async (checked: boolean) => {
    setRemindersEnabled(checked);
    const { error } = await supabase
      .from("business_settings")
      .update({ appointment_reminders_enabled: checked })
      .eq("id", 1);

    if (error) {
      setRemindersEnabled(!checked);
      toast({ title: "שגיאה בעדכון", description: error.message, variant: "destructive" });
    } else {
      toast({ title: checked ? "תזכורות הופעלו" : "תזכורות כובו" });
    }
  };

  const send = async () => {
    const ids = userIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const { error } = await supabase.functions.invoke("send-notification", {
      body: { title, body, user_ids: ids },
    });
    if (error) {
      toast({ title: "שגיאה בשליחה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "נשלח" });
      setTitle("");
      setBody("");
      setUserIds("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">התראות פוש</h2>
      <div className="flex items-center space-x-2 space-x-reverse">
        <Switch id="reminders-switch" checked={remindersEnabled} onCheckedChange={toggleReminders} />
        <Label htmlFor="reminders-switch" className="text-lg">
          {remindersEnabled ? "תזכורות יומיות מופעלות" : "תזכורות יומיות כבויות"}
        </Label>
      </div>
      <Input placeholder="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="תוכן" value={body} onChange={(e) => setBody(e.target.value)} />
      <Input
        placeholder="מזהי משתמשים מופרדים בפסיק"
        value={userIds}
        onChange={(e) => setUserIds(e.target.value)}
      />
      <Button onClick={send}>שלח התראה</Button>
    </div>
  );
}
