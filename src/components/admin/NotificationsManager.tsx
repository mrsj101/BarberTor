import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface NotificationSetting {
  id: string;
  title: string;
  body: string;
  user_ids: string[];
}

export const NotificationsManager = () => {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userIds, setUserIds] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [eveningTime, setEveningTime] = useState("");
  const [eveningMessage, setEveningMessage] = useState("");
  const [morningStart, setMorningStart] = useState("");
  const [morningEnd, setMorningEnd] = useState("");
  const [morningMessage, setMorningMessage] = useState("");
  const [threeHoursTime, setThreeHoursTime] = useState("");
  const [threeHoursMessage, setThreeHoursMessage] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      showError(`שגיאה בטעינה: ${error.message}`);
    } else {
      setNotifications(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    supabase
      .from("business_settings")
      .select(
        "appointment_reminders_enabled, evening_reminder_time, evening_reminder_message, morning_reminder_start_time, morning_reminder_end_time, morning_reminder_message, three_hours_reminder_time, three_hours_reminder_message"
      )
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setRemindersEnabled(data.appointment_reminders_enabled || false);
        setEveningTime(data.evening_reminder_time?.slice(0, 5) || "");
        setEveningMessage(data.evening_reminder_message || "");
        setMorningStart(data.morning_reminder_start_time?.slice(0, 5) || "");
        setMorningEnd(data.morning_reminder_end_time?.slice(0, 5) || "");
        setMorningMessage(data.morning_reminder_message || "");
        setThreeHoursTime(data.three_hours_reminder_time?.slice(0, 5) || "");
        setThreeHoursMessage(data.three_hours_reminder_message || "");
      });
  }, []);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setUserIds("");
    setEditingId(null);
  };

  const saveNotification = async () => {
    const ids = userIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("notification_settings")
        .update({ title, body, user_ids: ids })
        .eq("id", editingId));
    } else {
      ({ error } = await supabase
        .from("notification_settings")
        .insert({ title, body, user_ids: ids }));
    }

    if (error) {
      showError(`שגיאה בשמירה: ${error.message}`);
    } else {
      showSuccess(editingId ? "התראה עודכנה" : "התראה נוצרה");
      resetForm();
      fetchNotifications();
    }
  };

  const editNotification = (n: NotificationSetting) => {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
    setUserIds(n.user_ids.join(", "));
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notification_settings")
      .delete()
      .eq("id", id);
    if (error) {
      showError(`שגיאה במחיקה: ${error.message}`);
    } else {
      showSuccess("התראה נמחקה");
      fetchNotifications();
    }
  };

  const sendNotification = async (n?: NotificationSetting) => {
    // אם נשלח אובייקט רשומה — שלח אותו; אחרת שלח מהטופס הנוכחי
    const payload = n
      ? { title: n.title, body: n.body, user_ids: n.user_ids }
      : {
          title,
          body,
          user_ids: userIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        };

    const { error } = await supabase.functions.invoke("send-notification", {
      body: payload,
    });

    if (error) {
      showError(`שגיאה בשליחה: ${error.message}`);
    } else {
      showSuccess("ההתראה נשלחה");
    }
  };

  const toggleReminders = async (checked: boolean) => {
    setRemindersEnabled(checked);
    const { error } = await supabase
      .from("business_settings")
      .upsert({ id: 1, appointment_reminders_enabled: checked });

    if (error) {
      setRemindersEnabled(!checked);
      showError(`שגיאה בעדכון: ${error.message}`);
    } else {
      showSuccess(checked ? "תזכורות הופעלו" : "תזכורות כובו");
    }
  };

  const saveReminderSettings = async () => {
    const { error } = await supabase
      .from("business_settings")
      .upsert({
        id: 1,
        evening_reminder_time: eveningTime || null,
        evening_reminder_message: eveningMessage || null,
        morning_reminder_start_time: morningStart || null,
        morning_reminder_end_time: morningEnd || null,
        morning_reminder_message: morningMessage || null,
        three_hours_reminder_time: threeHoursTime || null,
        three_hours_reminder_message: threeHoursMessage || null,
      });

    if (error) {
      showError(`שגיאה בעדכון: ${error.message}`);
    } else {
      showSuccess("תזכורות עודכנו");
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

      {remindersEnabled && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>תזכורת ערב לפני תור</CardTitle>
              <CardDescription>תזכורת שתישלח בערב שלפני מועד התור.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="evening-time" className="w-24">שעת שליחה</Label>
                <Input
                  id="evening-time"
                  type="time"
                  className="w-32"
                  placeholder="בחר שעה"
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                />
              </div>
              <Textarea
                placeholder="ההודעה שתישלח בערב לפני התור"
                value={eveningMessage}
                onChange={(e) => setEveningMessage(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תזכורת בוקר ביום התור</CardTitle>
              <CardDescription>
                הודעה שתישלח בבוקר יום התור בין השעות שייבחרו.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="morning-start">החל מ</Label>
                  <Input
                    id="morning-start"
                    type="time"
                    className="w-32"
                    placeholder="שעה"
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                  />
                </div>
                <span>-</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="morning-end">עד</Label>
                  <Input
                    id="morning-end"
                    type="time"
                    className="w-32"
                    placeholder="שעה"
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                  />
                </div>
              </div>
              <Textarea
                placeholder="ההודעה שתישלח בבוקר יום התור"
                value={morningMessage}
                onChange={(e) => setMorningMessage(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תזכורת 3 שעות לפני תור</CardTitle>
              <CardDescription>
                הודעה שתישלח שלוש שעות לפני מועד התור.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="three-hours-time" className="w-24">שעת שליחה</Label>
                <Input
                  id="three-hours-time"
                  type="time"
                  className="w-32"
                  placeholder="בחר שעה"
                  value={threeHoursTime}
                  onChange={(e) => setThreeHoursTime(e.target.value)}
                />
              </div>
              <Textarea
                placeholder="ההודעה שתישלח שלוש שעות לפני התור"
                value={threeHoursMessage}
                onChange={(e) => setThreeHoursMessage(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button onClick={saveReminderSettings}>שמור תזכורות</Button>
        </div>
      )}

      <Input placeholder="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="תוכן" value={body} onChange={(e) => setBody(e.target.value)} />
      <Input
        placeholder="מזהי משתמשים מופרדים בפסיק"
        value={userIds}
        onChange={(e) => setUserIds(e.target.value)}
      />

      <div className="space-x-2">
        <Button onClick={saveNotification}>
          {editingId ? "עדכן התראה" : "צור התראה"}
        </Button>
        {editingId && (
          <Button variant="outline" onClick={resetForm}>
            ביטול
          </Button>
        )}
        <Button onClick={() => sendNotification()}>שלח התראה</Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p>טוען...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין התראות מוגדרות.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="border rounded-md p-4 space-y-2">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p>{n.body}</p>
                <p className="text-sm text-muted-foreground">משתמשים: {n.user_ids.join(", ")}</p>
              </div>
              <div className="space-x-2">
                <Button size="sm" onClick={() => sendNotification(n)}>
                  שלח
                </Button>
                <Button size="sm" variant="outline" onClick={() => editNotification(n)}>
                  ערוך
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteNotification(n.id)}>
                  מחק
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
