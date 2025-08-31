import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Settings = {
  call_phone?: string;
  whatsapp_phone?: string;
};

export const FloatingButtons = () => {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("business_settings")
        .select("call_phone, whatsapp_phone")
        .single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-3">
      {settings.whatsapp_phone && (
        <a href={`https://wa.me/${settings.whatsapp_phone}`} target="_blank" rel="noopener noreferrer">
          <Button size="icon" className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600">
            <MessageCircle className="h-7 w-7" />
          </Button>
        </a>
      )}
      {settings.call_phone && (
        <a href={`tel:${settings.call_phone}`}>
          <Button size="icon" className="rounded-full h-14 w-14">
            <Phone className="h-7 w-7" />
          </Button>
        </a>
      )}
    </div>
  );
};