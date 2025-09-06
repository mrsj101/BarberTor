import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

const MessagesPage = () => {
  const { session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session) return;
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setNotifications((data as Notification[]) ?? []);
    };

    fetchNotifications();
  }, [session]);

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-bold text-center">הודעות</h1>
      {notifications.map((n) => (
        <Card key={n.id}>
          <CardHeader className="text-right font-bold">{n.title}</CardHeader>
          <CardContent className="text-right">
            <p>{n.body}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(n.created_at), "Pp", { locale: he })}
            </p>
          </CardContent>
        </Card>
      ))}
      {notifications.length === 0 && (
        <p className="text-center text-muted-foreground">אין הודעות להצגה</p>
      )}
    </div>
  );
};

export default MessagesPage;
