import { Instagram } from "lucide-react";
import { Button } from "../ui/button";

export const SocialLinks = () => {
  return (
    <div className="p-4 rounded-lg flex flex-col items-center gap-4">
      <h3 className="text-lg font-bold mb-4 text-center md:text-right">יצירת קשר</h3>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <a href="https://www.instagram.com/tapiro_barber/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full flex items-center gap-2 justify-center">
            <Instagram />
            אינסטגרם
          </Button>
        </a>
        <a href="tel:0505952966">
          <Button variant="outline" className="w-full flex items-center gap-2 justify-center">
            📞
            התקשר
          </Button>
        </a>
        <a href="https://wa.me/972505952966" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full flex items-center gap-2 justify-center">
            <span style={{fontSize: '1.2em'}}>🟢</span>
            WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
};