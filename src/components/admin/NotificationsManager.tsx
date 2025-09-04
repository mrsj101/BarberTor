import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

type Notification = {
  id?: number;
  title: string;
  body: string;
};

export function NotificationsManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userIds, setUserIds] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body")
      .order("created_at", { ascending: false });

    if (error) {
      showError("שגיאה בטעינת ההתראות.");
    } else {
      setNotifications(data || []);
    }
  }, []);

  const saveNotification = useCallback(async () => {
    const { error } = await supabase.from("notifications").insert({ title, body });

    if (error) {
      showError(`שגיאה בשמירת ההתראה: ${error.message}`);
    } else {
      showSuccess("התראה נשמרה בהצלחה");
      setTitle("");
      setBody("");
      setUserIds("");
      fetchNotifications();
    }
  }, [title, body, fetchNotifications]);

  const sendNotification = useCallback(async () => {
    const ids = userIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const { error } = await supabase.functions.invoke("send-notification", {
      body: { title, body, user_ids: ids },
    });
    if (error) {
      showError(`שגיאה בשליחה: ${error.message}`);
    } else {
      showSuccess("ההתראה נשלחה");
    }
  }, [title, body, userIds]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      showError(`שגיאה בעדכון: ${error.message}`);
    } else {
      showSuccess(checked ? "תזכורות הופעלו" : "תזכורות כובו");
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
      <div className="flex gap-2">
        <Button onClick={saveNotification}>שמור התראה</Button>
        <Button onClick={sendNotification}>שלח התראה</Button>
      </div>
      {notifications.length > 0 && (
        <ul className="list-disc pr-5 space-y-1">
          {notifications.map((n) => (
            <li key={n.id}>{n.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
