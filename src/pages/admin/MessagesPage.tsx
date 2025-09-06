import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface Template {
  key: string;
  title: string;
  body: string;
}

const AdminMessagesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateKey, setTemplateKey] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase
        .from("notification_templates")
        .select("key,title,body");
      setTemplates((data as Template[]) ?? []);
    };
    loadTemplates();
  }, []);

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    const tmpl = templates.find((t) => t.key === key);
    if (tmpl) {
      setTitle(tmpl.title);
      setBody(tmpl.body);
    }
  };

  const handleSend = async () => {
    const { data: users } = await supabase.from("profiles").select("id");
    const userIds = users?.map((u: { id: string }) => u.id) ?? [];
    await supabase.functions.invoke("send-notification", {
      body: { user_ids: userIds, title, body },
    });
    toast({ description: "ההודעה נשלחה" });
    setTemplateKey("");
    setTitle("");
    setBody("");
  };

  return (
    <div className="max-w-xl mx-auto space-y-4" dir="rtl">
      <h1 className="text-2xl font-bold text-center">שליחת הודעה</h1>
      <div className="space-y-2">
        <Label htmlFor="template">טמפלט</Label>
        <Select value={templateKey} onValueChange={handleTemplateChange}>
          <SelectTrigger id="template">
            <SelectValue placeholder="בחר טמפלט" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">כותרת</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">תוכן</Label>
        <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <Button onClick={handleSend} className="w-full">שליחה</Button>
    </div>
  );
};

export default AdminMessagesPage;
