import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Instagram, Facebook } from "lucide-react";
import { TikTokIcon } from "../icons/TikTokIcon";
import { Button } from "../ui/button";

type Settings = {
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
};

export const SocialLinks = () => {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("business_settings")
        .select("instagram_url, facebook_url, tiktok_url")
        .single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <div className="text-center p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">עקבו אחרינו</h3>
      <div className="flex justify-center gap-4">
        {settings.instagram_url && (
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon"><Instagram /></Button>
          </a>
        )}
        {settings.facebook_url && (
          <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon"><Facebook /></Button>
          </a>
        )}
        {settings.tiktok_url && (
          <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon"><TikTokIcon /></Button>
          </a>
        )}
      </div>
    </div>
  );
};