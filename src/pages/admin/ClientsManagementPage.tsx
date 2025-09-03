import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";

interface Client {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_blocked: boolean | null;
  access_level: string | null;
  birth_date: string | null;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const ClientsManagementPage = () => {
  const { profile } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, is_blocked, access_level, birth_date");
    if (!error && data) {
      setClients((data as Client[]).filter(client => client.id !== profile?.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("profiles").delete().eq("id", id);
    setDeletingId(null);
    fetchClients();
  };

  const handleBlockToggle = async (client: Client) => {
    setBlockingId(client.id);
    setBlockLoading(true);
    await supabase
      .from("profiles")
      .update({ is_blocked: !client.is_blocked })
      .eq("id", client.id);
    setBlockingId(null);
    setBlockLoading(false);
    fetchClients();
  };

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-3xl font-bold text-center">ניהול לקוחות</h1>
      <div className="bg-muted rounded-lg p-6 shadow text-right">
        <p className="text-lg text-muted-foreground mb-4 text-right">כאן יוצגו כל הלקוחות הרשומים במערכת. ניתן למחוק, לחסום ולצפות בפרטי הלקוח.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg text-right rtl:text-right">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-center text-primary">שם פרטי</th>
                <th className="px-4 py-2 text-center text-primary">שם משפחה</th>
                <th className="px-4 py-2 text-center text-primary">טלפון</th>
                <th className="px-4 py-2 text-center text-primary">אימייל</th>
                <th className="px-4 py-2 text-center text-primary">תאריך לידה</th>
                <th className="px-4 py-2 text-center text-primary">סטטוס חסימה</th>
                <th className="px-4 py-2 text-center text-primary">רמת גישה</th>
                <th className="px-4 py-2 text-center text-primary">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">טוען נתונים...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">לא נמצאו לקוחות.</td></tr>
              ) : (
                clients.map(client => (
                  <tr key={client.id} className="border-b">
                    <td className="px-4 py-2 text-center text-muted-foreground">{client.first_name || "-"}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{client.last_name || "-"}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{client.phone || "-"}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{client.email || "-"}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{formatDate(client.birth_date)}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">
                      {client.is_blocked ? <span className="text-red-600 font-bold">חסום</span> : <span className="text-green-600 font-bold">פעיל</span>}
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{client.access_level || "-"}</td>
                    <td className="px-4 py-2 text-center text-muted-foreground">
                      <div className="flex flex-col gap-2 items-center justify-center">
                        <button
                          className={`px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition ${deletingId === client.id ? "opacity-50" : ""}`}
                          disabled={deletingId === client.id}
                          onClick={() => {
                            if (window.confirm("האם אתה בטוח שברצונך למחוק את הלקוח? פעולה זו אינה הפיכה!")) {
                              handleDelete(client.id);
                            }
                          }}
                        >
                          {deletingId === client.id ? "מוחק..." : "מחק"}
                        </button>
                        <button
                          className={`px-3 py-1 rounded ${client.is_blocked ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-gray-700 hover:bg-gray-800 text-white"} transition ${blockingId === client.id && blockLoading ? "opacity-50" : ""}`}
                          disabled={blockingId === client.id && blockLoading}
                          onClick={() => handleBlockToggle(client)}
                        >
                          {blockingId === client.id && blockLoading
                            ? "מעדכן..."
                            : client.is_blocked ? "בטל חסימה" : "חסום"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsManagementPage;
