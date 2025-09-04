import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NotificationSetting {
  id: string;
  title: string;
  body: string;
  user_ids: string[];
}

export function NotificationsManager() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userIds, setUserIds] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "שגיאה בטעינה", description: error.message, variant: "destructive" });
    } else {
      setNotifications(data ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "התראה עודכנה" : "התראה נוצרה" });
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
      toast({ title: "שגיאה במחיקה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "התראה נמחקה" });
      fetchNotifications();
    }
  };

  const sendNotification = async (n: NotificationSetting) => {
    const { error } = await supabase.functions.invoke("send-notification", {
      body: { title: n.title, body: n.body, user_ids: n.user_ids },
    });
    if (error) {
      toast({ title: "שגיאה בשליחה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "נשלח" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">התראות פוש</h2>
      <Input placeholder="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="תוכן" value={body} onChange={(e) => setBody(e.target.value)} />
      <Input
        placeholder="מזהי משתמשים מופרדים בפסיק"
        value={userIds}
        onChange={(e) => setUserIds(e.target.value)}
      />
      <div className="space-x-2">
        <Button onClick={saveNotification}>{editingId ? "עדכן התראה" : "צור התראה"}</Button>
        {editingId && <Button variant="outline" onClick={resetForm}>ביטול</Button>}
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
                <p className="text-sm text-muted-foreground">
                  משתמשים: {n.user_ids.join(", ")}
                </p>
              </div>
              <div className="space-x-2">
                <Button size="sm" onClick={() => sendNotification(n)}>שלח</Button>
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
}
